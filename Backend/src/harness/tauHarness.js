/**
 * Tau Agent Loop Harness (tau_agent core)
 * Reference: https://twotimespi.dev/internals/agent-loop/
 * 
 * Owns the portable agent brain:
 * 1. Takes system prompt, transcript, tools, and model selection.
 * 2. Emits normalized events as text, thinking, and tool calls arrive.
 * 3. Safely executes requested tools with isolated error handling and cancellation.
 * 4. Appends structured tool results to the transcript.
 * 5. Cycles until the assistant produces no more tool calls or max turns reached.
 * 6. Guarantees agent_settled emission.
 */

import {
    createAgentStartEvent,
    createTurnStartEvent,
    createMessageStartEvent,
    createMessageUpdateEvent,
    createMessageEndEvent,
    createToolExecutionStartEvent,
    createToolExecutionUpdateEvent,
    createToolExecutionEndEvent,
    createTurnEndEvent,
    createAgentSettledEvent,
    createCompactionEvent
} from './tauEvents.js';
import { randomUUID } from 'crypto';

export class TauHarness {
    constructor({
        provider,
        toolRegistry,
        maxTurns = 6,
        model = null,
        temperature = 0.2
    } = {}) {
        this.provider = provider;
        this.toolRegistry = toolRegistry;
        this.maxTurns = maxTurns;
        this.model = model;
        this.temperature = temperature;
    }

    /**
     * Runs an agent loop for a prompt.
     * @param {Object} params
     * @param {string} params.prompt - User prompt text
     * @param {string} params.systemPrompt - System instruction prompt
     * @param {TauTranscript} params.transcript - Authoritative transcript manager
     * @param {AbortSignal} params.signal - Cancellation signal
     * @param {Object} params.context - Execution context for tools (e.g. user, sellerId)
     * @param {Function} params.emitEvent - Listener for normalized Tau events
     * @returns {Promise<{ answer: string, toolsUsed: Array<string>, transcript: TauTranscript }>}
     */
    async run({
        prompt,
        systemPrompt,
        transcript,
        signal = null,
        context = {},
        emitEvent = () => {}
    }) {
        const runId = randomUUID();
        const toolsUsed = [];

        // 1. Emit AgentStartEvent
        emitEvent(createAgentStartEvent(runId, prompt, { model: this.model || this.provider?.defaultModel }));

        // Check if compaction is needed before running
        const compaction = transcript.compactIfNeeded(systemPrompt);
        if (compaction) {
            emitEvent(createCompactionEvent(
                compaction.originalCount,
                compaction.compactedCount,
                compaction.summary
            ));
        }

        let turnIndex = 0;
        let finalAssistantText = "";

        try {
            while (turnIndex < this.maxTurns) {
                if (signal?.aborted) {
                    emitEvent(createAgentSettledEvent(runId, 'cancelled', { reason: 'User requested cancellation' }));
                    return { answer: finalAssistantText || "Run cancelled.", toolsUsed, transcript };
                }

                // 2. Emit TurnStartEvent
                emitEvent(createTurnStartEvent(turnIndex));

                const messageId = randomUUID();
                emitEvent(createMessageStartEvent(messageId, 'assistant'));

                const apiMessages = transcript.toApiMessages(systemPrompt);
                const toolSchemas = this.toolRegistry ? this.toolRegistry.toOpenAISchemas() : [];

                // 3. Ask provider to stream response
                const providerResult = await this.provider.streamChat({
                    messages: apiMessages,
                    tools: toolSchemas,
                    model: this.model,
                    temperature: this.temperature,
                    signal,
                    onChunk: (chunk) => {
                        if (chunk.textDelta) {
                            emitEvent(createMessageUpdateEvent(messageId, { text: chunk.textDelta }));
                        }
                        if (chunk.thinkingDelta) {
                            emitEvent(createMessageUpdateEvent(messageId, { thinking: chunk.thinkingDelta }));
                        }
                    }
                });

                finalAssistantText = providerResult.content || "";

                // 4. Emit MessageEndEvent
                const completedMessage = {
                    id: messageId,
                    role: 'assistant',
                    content: finalAssistantText,
                    tool_calls: providerResult.toolCalls || []
                };
                emitEvent(createMessageEndEvent(completedMessage));

                // Append assistant message to transcript
                transcript.addAssistantMessage({
                    content: finalAssistantText,
                    toolCalls: providerResult.toolCalls,
                    thinking: providerResult.thinking
                });

                // 5. If no tool calls requested, we are done with this run
                if (!providerResult.toolCalls || providerResult.toolCalls.length === 0) {
                    emitEvent(createTurnEndEvent(turnIndex, providerResult.usage));
                    break;
                }

                // 6. Execute requested tools
                for (const toolCall of providerResult.toolCalls) {
                    const toolName = toolCall.function.name;
                    const toolCallId = toolCall.id;
                    let args = {};

                    try {
                        args = toolCall.function.arguments
                            ? JSON.parse(toolCall.function.arguments)
                            : {};
                    } catch (e) {
                        args = { raw: toolCall.function.arguments };
                    }

                    toolsUsed.push(toolName);

                    // Emit ToolExecutionStartEvent
                    emitEvent(createToolExecutionStartEvent(toolCallId, toolName, args));

                    const toolInstance = this.toolRegistry.getTool(toolName);
                    const toolStartTime = Date.now();
                    let toolResult;

                    if (!toolInstance) {
                        toolResult = {
                            content: [{ type: 'text', text: `Tool '${toolName}' is not recognized.` }],
                            isError: true
                        };
                    } else {
                        toolResult = await toolInstance.execute(args, {
                            signal,
                            onUpdate: (delta) => {
                                emitEvent(createToolExecutionUpdateEvent(toolCallId, toolName, delta));
                            },
                            ...context
                        });
                    }

                    const durationMs = Date.now() - toolStartTime;

                    // Emit ToolExecutionEndEvent
                    emitEvent(createToolExecutionEndEvent(
                        toolCallId,
                        toolName,
                        toolResult.getText(),
                        toolResult.isError,
                        durationMs,
                        args
                    ));

                    // Append tool result to transcript
                    transcript.addToolResult({
                        toolCallId,
                        toolName,
                        content: toolResult.getText(),
                        isError: toolResult.isError
                    });
                }

                emitEvent(createTurnEndEvent(turnIndex, providerResult.usage));
                turnIndex++;
            }

            // 7. Emit AgentSettledEvent
            emitEvent(createAgentSettledEvent(runId, 'completed', {
                totalTurns: turnIndex + 1,
                toolsCount: toolsUsed.length
            }));

            return {
                answer: finalAssistantText || "I have completed processing your request.",
                toolsUsed: [...new Set(toolsUsed)],
                transcript
            };
        } catch (error) {
            emitEvent(createAgentSettledEvent(runId, 'error', {
                error: error.message
            }));
            throw error;
        }
    }
}
