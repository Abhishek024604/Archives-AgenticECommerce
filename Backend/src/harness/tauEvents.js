/**
 * Tau Agent Harness Events
 * Reference: https://twotimespi.dev/internals/agent-loop/
 * 
 * Provider-neutral event stream definitions that make agent execution
 * completely observable, testable, and streaming-first.
 */

export const TauEventType = {
    AGENT_START: 'agent_start',
    TURN_START: 'turn_start',
    MESSAGE_START: 'message_start',
    MESSAGE_UPDATE: 'message_update',
    MESSAGE_END: 'message_end',
    TOOL_EXECUTION_START: 'tool_execution_start',
    TOOL_EXECUTION_UPDATE: 'tool_execution_update',
    TOOL_EXECUTION_END: 'tool_execution_end',
    TURN_END: 'turn_end',
    AGENT_SETTLED: 'agent_settled',
    QUEUE_UPDATE: 'queue_update',
    COMPACTION: 'compaction'
};

export const createAgentStartEvent = (runId, prompt, options = {}) => ({
    type: TauEventType.AGENT_START,
    runId,
    timestamp: Date.now(),
    prompt,
    ...options
});

export const createTurnStartEvent = (turnIndex, timestamp = Date.now()) => ({
    type: TauEventType.TURN_START,
    turnIndex,
    timestamp
});

export const createMessageStartEvent = (messageId, role = 'assistant') => ({
    type: TauEventType.MESSAGE_START,
    messageId,
    role,
    timestamp: Date.now()
});

export const createMessageUpdateEvent = (messageId, delta) => ({
    type: TauEventType.MESSAGE_UPDATE,
    messageId,
    delta: {
        text: delta.text || '',
        toolCall: delta.toolCall || null,
        thinking: delta.thinking || ''
    },
    timestamp: Date.now()
});

export const createMessageEndEvent = (message) => ({
    type: TauEventType.MESSAGE_END,
    message,
    timestamp: Date.now()
});

export const createToolExecutionStartEvent = (toolCallId, toolName, args) => ({
    type: TauEventType.TOOL_EXECUTION_START,
    toolCallId,
    toolName,
    arguments: args,
    timestamp: Date.now()
});

export const createToolExecutionUpdateEvent = (toolCallId, toolName, delta) => ({
    type: TauEventType.TOOL_EXECUTION_UPDATE,
    toolCallId,
    toolName,
    delta,
    timestamp: Date.now()
});

export const createToolExecutionEndEvent = (toolCallId, toolName, result, isError = false, durationMs = 0, args = {}) => ({
    type: TauEventType.TOOL_EXECUTION_END,
    toolCallId,
    toolName,
    arguments: args,
    result,
    isError,
    durationMs,
    timestamp: Date.now()
});

export const createTurnEndEvent = (turnIndex, usage = null) => ({
    type: TauEventType.TURN_END,
    turnIndex,
    usage,
    timestamp: Date.now()
});

export const createAgentSettledEvent = (runId, status = 'completed', metadata = {}) => ({
    type: TauEventType.AGENT_SETTLED,
    runId,
    status, // 'completed' | 'cancelled' | 'error'
    timestamp: Date.now(),
    ...metadata
});

export const createQueueUpdateEvent = (queuedPrompts = []) => ({
    type: TauEventType.QUEUE_UPDATE,
    queuedPrompts,
    timestamp: Date.now()
});

export const createCompactionEvent = (originalCount, compactedCount, summary) => ({
    type: TauEventType.COMPACTION,
    originalCount,
    compactedCount,
    summary,
    timestamp: Date.now()
});
