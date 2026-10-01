/**
 * Tau Provider Adapter (tau_ai layer)
 * Reference: https://twotimespi.dev/internals/architecture/ and https://twotimespi.dev/guides/providers-and-models/
 * 
 * Translates provider APIs (OpenRouter, Groq, OpenAI) into provider-neutral event streams.
 * Includes automatic retry with exponential backoff and rate-limit handling.
 */

export class TauProvider {
    constructor({
        apiKey = process.env.OPENROUTER_API_KEY || process.env.GROQ_API_KEY,
        baseURL = process.env.OPENROUTER_API_KEY ? "https://openrouter.ai/api/v1" : "https://api.groq.com/openai/v1",
        defaultModel = process.env.OPENROUTER_MODEL || (process.env.OPENROUTER_API_KEY ? "meta-llama/llama-3.1-8b-instruct:free" : "llama-3.3-70b-versatile"),
        maxRetries = 2,
        retryDelayMs = 1000
    } = {}) {
        this.apiKey = apiKey;
        this.baseURL = baseURL.replace(/\/+$/, '');
        this.defaultModel = defaultModel;
        this.maxRetries = maxRetries;
        this.retryDelayMs = retryDelayMs;
    }

    /**
     * Executes a streaming chat completion turn.
     * @param {Object} params
     * @param {Array} params.messages - Prepared transcript messages
     * @param {Array} params.tools - OpenAI format tool definitions
     * @param {string} params.model - Override model name
     * @param {number} params.temperature - Temperature
     * @param {AbortSignal} params.signal - Cancellation signal
     * @param {Function} params.onChunk - Callback for incremental deltas { textDelta, thinkingDelta, toolCallsDelta }
     * @returns {Promise<{ content: string, toolCalls: Array|null, usage: Object|null }>}
     */
    async streamChat({
        messages,
        tools = [],
        model = this.defaultModel,
        temperature = 0.2,
        signal = null,
        onChunk = () => {}
    }) {
        if (!this.apiKey) {
            throw new Error("Provider API key is missing. Set OPENROUTER_API_KEY or GROQ_API_KEY.");
        }

        const body = {
            model,
            messages,
            temperature,
            stream: true
        };

        if (tools && tools.length > 0) {
            body.tools = tools;
            body.tool_choice = "auto";
        }

        const headers = {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${this.apiKey}`,
            "HTTP-Referer": "http://localhost:5173",
            "X-Title": "ARCHIVIST Store Harness"
        };

        let attempt = 0;
        let lastError = null;

        while (attempt <= this.maxRetries) {
            if (signal?.aborted) {
                throw new Error("Operation cancelled by user");
            }

            try {
                const response = await fetch(`${this.baseURL}/chat/completions`, {
                    method: "POST",
                    headers,
                    body: JSON.stringify(body),
                    signal
                });

                if (!response.ok) {
                    const status = response.status;
                    const errBody = await response.text();

                    // Retry on rate limit (429) or server errors (500, 502, 503, 504)
                    if ([429, 500, 502, 503, 504].includes(status) && attempt < this.maxRetries) {
                        const waitTime = this.retryDelayMs * Math.pow(2, attempt);
                        console.warn(`[TauProvider] Received HTTP ${status}. Retrying in ${waitTime}ms (Attempt ${attempt + 1}/${this.maxRetries})...`);
                        await new Promise(res => setTimeout(res, waitTime));
                        attempt++;
                        continue;
                    }

                    throw new Error(`Provider API error (${status}): ${errBody}`);
                }

                // Process Server-Sent Events stream
                return await this._consumeSseStream(response.body, onChunk, signal);
            } catch (err) {
                lastError = err;
                if (err.name === 'AbortError' || signal?.aborted) {
                    throw new Error("Operation cancelled");
                }
                if (attempt < this.maxRetries) {
                    const waitTime = this.retryDelayMs * Math.pow(2, attempt);
                    console.warn(`[TauProvider] Request failed: ${err.message}. Retrying in ${waitTime}ms...`);
                    await new Promise(res => setTimeout(res, waitTime));
                    attempt++;
                } else {
                    break;
                }
            }
        }

        throw lastError || new Error("Provider request failed after retries.");
    }

    /**
     * Consumes SSE chunks from the provider response stream.
     */
    async _consumeSseStream(bodyStream, onChunk, signal) {
        const reader = bodyStream.getReader();
        const decoder = new TextDecoder("utf-8");

        let accumulatedText = "";
        let accumulatedThinking = "";
        const toolCallsMap = new Map();
        let usage = null;
        let buffer = "";

        try {
            while (true) {
                if (signal?.aborted) {
                    reader.cancel();
                    throw new Error("Stream aborted by user");
                }

                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer = lines.pop(); // keep last incomplete line

                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed || !trimmed.startsWith("data:")) continue;

                    const dataStr = trimmed.slice(5).trim();
                    if (dataStr === "[DONE]") continue;

                    try {
                        const parsed = JSON.parse(dataStr);
                        const choice = parsed.choices?.[0];
                        if (parsed.usage) usage = parsed.usage;

                        if (!choice) continue;

                        const delta = choice.delta;
                        if (!delta) continue;

                        // 1. Text Delta
                        if (delta.content) {
                            accumulatedText += delta.content;
                            onChunk({ textDelta: delta.content, fullText: accumulatedText });
                        }

                        // 2. Reasoning / Thinking Delta (e.g. DeepSeek-R1 or Qwen-thinking)
                        if (delta.reasoning_content || delta.thinking) {
                            const th = delta.reasoning_content || delta.thinking;
                            accumulatedThinking += th;
                            onChunk({ thinkingDelta: th });
                        }

                        // 3. Tool Calls Delta
                        if (delta.tool_calls && Array.isArray(delta.tool_calls)) {
                            for (const tc of delta.tool_calls) {
                                const index = tc.index ?? 0;
                                if (!toolCallsMap.has(index)) {
                                    toolCallsMap.set(index, {
                                        id: tc.id || `call_${Date.now()}_${index}`,
                                        type: "function",
                                        function: {
                                            name: tc.function?.name || "",
                                            arguments: tc.function?.arguments || ""
                                        }
                                    });
                                } else {
                                    const existing = toolCallsMap.get(index);
                                    if (tc.id) existing.id = tc.id;
                                    if (tc.function?.name) existing.function.name += tc.function.name;
                                    if (tc.function?.arguments) existing.function.arguments += tc.function.arguments;
                                }
                            }
                            onChunk({ toolCallsDelta: delta.tool_calls });
                        }
                    } catch (e) {
                        // Ignore malformed line
                    }
                }
            }
        } finally {
            reader.releaseLock();
        }

        const toolCalls = toolCallsMap.size > 0
            ? Array.from(toolCallsMap.values()).map(tc => {
                // Ensure arguments are parseable or fallback to empty object
                return {
                    id: tc.id,
                    type: "function",
                    function: {
                        name: tc.function.name,
                        arguments: tc.function.arguments
                    }
                };
            })
            : null;

        return {
            content: accumulatedText,
            thinking: accumulatedThinking,
            toolCalls,
            usage
        };
    }
}
