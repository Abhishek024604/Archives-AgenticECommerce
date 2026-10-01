/**
 * Tau Agent Transcript & Context Manager
 * Reference: https://twotimespi.dev/internals/agent-loop/ and https://twotimespi.dev/guides/context/
 * 
 * Guarantees message integrity, prevents tool_call/tool_result orphaned pairs,
 * manages context window limits with structured compaction, and provides
 * durable session storage.
 */

export class TauTranscript {
    constructor({ maxTokens = 16000, compactThreshold = 14000 } = {}) {
        this.messages = [];
        this.maxTokens = maxTokens;
        this.compactThreshold = compactThreshold;
        this.systemCheckpoints = [];
    }

    /**
     * Appends a user message
     */
    addUserMessage(content) {
        if (!content || typeof content !== 'string') return;
        this.messages.push({
            role: 'user',
            content: content.trim(),
            timestamp: Date.now()
        });
    }

    /**
     * Appends an assistant message
     */
    addAssistantMessage({ content = '', toolCalls = null, thinking = '' }) {
        const msg = {
            role: 'assistant',
            content: content || '',
            timestamp: Date.now()
        };
        if (toolCalls && Array.isArray(toolCalls) && toolCalls.length > 0) {
            msg.tool_calls = toolCalls;
        }
        if (thinking) {
            msg.thinking = thinking;
        }
        this.messages.push(msg);
    }

    /**
     * Appends a tool result message matching a tool_call_id
     */
    addToolResult({ toolCallId, toolName, content, isError = false }) {
        const textContent = typeof content === 'string'
            ? content
            : JSON.stringify(content);

        this.messages.push({
            role: 'tool',
            tool_call_id: toolCallId,
            name: toolName,
            content: textContent,
            isError: Boolean(isError),
            timestamp: Date.now()
        });
    }

    /**
     * Imports an existing message history safely, repairing any corrupted or orphaned pairs.
     */
    importHistory(history = []) {
        if (!Array.isArray(history)) return;

        this.messages = [];
        for (const item of history) {
            if (!item || typeof item !== 'object') continue;
            const role = item.role;
            if (!['user', 'assistant', 'tool', 'system'].includes(role)) continue;

            const sanitized = {
                role,
                content: typeof item.content === 'string' ? item.content : JSON.stringify(item.content || ''),
                timestamp: item.timestamp || Date.now()
            };

            if (item.tool_calls) sanitized.tool_calls = item.tool_calls;
            if (item.tool_call_id) sanitized.tool_call_id = item.tool_call_id;
            if (item.name) sanitized.name = item.name;

            this.messages.push(sanitized);
        }

        this.enforceIntegrity();
    }

    /**
     * Enforces strict tool call / tool result pairing.
     * Prevents API rejection ("An assistant message with tool_calls must be followed by tool messages").
     */
    enforceIntegrity() {
        const validated = [];
        let i = 0;

        while (i < this.messages.length) {
            const msg = this.messages[i];

            if (msg.role === 'assistant' && msg.tool_calls && msg.tool_calls.length > 0) {
                const requiredIds = new Set(msg.tool_calls.map(tc => tc.id));
                const toolResults = [];

                // Look ahead for matching tool messages
                let j = i + 1;
                while (j < this.messages.length && this.messages[j].role === 'tool') {
                    const toolMsg = this.messages[j];
                    if (requiredIds.has(toolMsg.tool_call_id)) {
                        toolResults.push(toolMsg);
                        requiredIds.delete(toolMsg.tool_call_id);
                    }
                    j++;
                }

                // If any tool call was missing a result (e.g. from an aborted run), supply synthetic error results
                for (const missingId of requiredIds) {
                    const call = msg.tool_calls.find(c => c.id === missingId);
                    toolResults.push({
                        role: 'tool',
                        tool_call_id: missingId,
                        name: call?.function?.name || 'unknown',
                        content: JSON.stringify({ error: 'Tool execution was interrupted or missing result.' }),
                        isError: true,
                        timestamp: Date.now()
                    });
                }

                validated.push(msg);
                validated.push(...toolResults);
                i = j;
            } else if (msg.role === 'tool') {
                // Orphan tool message without preceding assistant tool_calls: discard
                i++;
            } else {
                validated.push(msg);
                i++;
            }
        }

        this.messages = validated;
    }

    /**
     * Estimates token count (rough rule of thumb: 1 token ≈ 4 characters)
     */
    estimateTokens() {
        let chars = 0;
        for (const m of this.messages) {
            chars += (m.content ? m.content.length : 0);
            if (m.tool_calls) chars += JSON.stringify(m.tool_calls).length;
        }
        return Math.ceil(chars / 4);
    }

    /**
     * Performs automatic compaction if context size exceeds threshold.
     * Keeps recent turns intact while summarizing older exchanges into a checkpoint.
     * @returns {Object|null} compaction summary if performed, else null
     */
    compactIfNeeded(systemPromptBase = '') {
        const currentTokens = this.estimateTokens();
        if (currentTokens < this.compactThreshold || this.messages.length <= 6) {
            return null;
        }

        const originalCount = this.messages.length;

        // Keep the last 4 messages (e.g. current query and immediate previous turn)
        const recentMessages = this.messages.slice(-4);
        const olderMessages = this.messages.slice(0, -4);

        // Summarize key operational facts from older messages
        const summaryPoints = [];
        for (const m of olderMessages) {
            if (m.role === 'user') {
                summaryPoints.push(`- User previously requested: "${m.content.slice(0, 100)}"`);
            } else if (m.role === 'assistant' && m.tool_calls) {
                const tools = m.tool_calls.map(tc => tc.function?.name).filter(Boolean);
                summaryPoints.push(`- Actions performed: ${tools.join(', ')}`);
            }
        }

        const summaryText = [
            `[CONTEXT COMPACTED - Previous Session Summary]`,
            ...summaryPoints.slice(-8), // Keep top salient points
            `[End of Compacted Summary]`
        ].join('\n');

        this.systemCheckpoints.push(summaryText);

        // Reconstruct messages with summary injected cleanly
        this.messages = [
            {
                role: 'system',
                content: summaryText,
                timestamp: Date.now()
            },
            ...recentMessages
        ];

        this.enforceIntegrity();

        return {
            originalCount,
            compactedCount: this.messages.length,
            tokensBefore: currentTokens,
            tokensAfter: this.estimateTokens(),
            summary: summaryText
        };
    }

    /**
     * Prepares standard messages payload for OpenRouter / OpenAI API
     */
    toApiMessages(systemPrompt = '') {
        this.enforceIntegrity();
        const payload = [];

        if (systemPrompt && typeof systemPrompt === 'string') {
            payload.push({
                role: 'system',
                content: systemPrompt
            });
        }

        for (const m of this.messages) {
            const entry = {
                role: m.role,
                content: m.content || ''
            };
            if (m.tool_calls) entry.tool_calls = m.tool_calls;
            if (m.tool_call_id) entry.tool_call_id = m.tool_call_id;
            if (m.name) entry.name = m.name;
            payload.push(entry);
        }

        return payload;
    }

    /**
     * Serializes to JSON for durable storage
     */
    toJSON() {
        return {
            messages: this.messages,
            systemCheckpoints: this.systemCheckpoints,
            tokens: this.estimateTokens()
        };
    }

    static fromJSON(data) {
        const transcript = new TauTranscript();
        if (data && Array.isArray(data.messages)) {
            transcript.messages = data.messages;
            transcript.systemCheckpoints = data.systemCheckpoints || [];
            transcript.enforceIntegrity();
        }
        return transcript;
    }
}
