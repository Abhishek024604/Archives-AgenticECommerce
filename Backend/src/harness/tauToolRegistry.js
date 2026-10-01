/**
 * Tau Agent Tool Registry & Execution Boundary
 * Reference: https://twotimespi.dev/reference/tools/ and https://twotimespi.dev/guides/extensions/
 * 
 * Separates tool definition and execution from the agent loop.
 * Guarantees error containment: tool failures NEVER crash the agent loop,
 * but return structured error blocks that allow the model to self-heal.
 */

export class AgentToolResult {
    constructor({ content = [], isError = false, metadata = {} } = {}) {
        this.content = Array.isArray(content)
            ? content.map(c => typeof c === 'string' ? { type: 'text', text: c } : c)
            : [{ type: 'text', text: String(content || '') }];
        this.isError = Boolean(isError);
        this.metadata = metadata;
    }

    getText() {
        return this.content
            .filter(c => c.type === 'text')
            .map(c => c.text)
            .join('\n');
    }

    static success(textOrBlocks, metadata = {}) {
        const content = typeof textOrBlocks === 'string'
            ? [{ type: 'text', text: textOrBlocks }]
            : textOrBlocks;
        return new AgentToolResult({ content, isError: false, metadata });
    }

    static error(errorMessage, metadata = {}) {
        return new AgentToolResult({
            content: [{ type: 'text', text: `Tool Error: ${errorMessage}` }],
            isError: true,
            metadata
        });
    }
}

export class AgentTool {
    constructor({
        name,
        description,
        parameters = { type: 'object', properties: {} },
        executeFn,
        timeoutMs = 30000,
        category = 'general'
    }) {
        if (!name || typeof name !== 'string') {
            throw new Error('Tool name is required and must be a string');
        }
        if (typeof executeFn !== 'function') {
            throw new Error(`Tool ${name} must supply an executeFn function`);
        }

        this.name = name;
        this.description = description || '';
        this.parameters = parameters;
        this.executeFn = executeFn;
        this.timeoutMs = timeoutMs;
        this.category = category;
    }

    /**
     * Executes the tool safely within an isolated error boundary.
     * @param {Object} args - Arguments supplied by model
     * @param {Object} context - Execution context { signal, onUpdate, sellerId, user, ... }
     * @returns {Promise<AgentToolResult>}
     */
    async execute(args = {}, context = {}) {
        const { signal, onUpdate } = context;

        if (signal?.aborted) {
            return AgentToolResult.error('Tool execution cancelled prior to start', { cancelled: true });
        }

        const startTime = Date.now();

        // Enforce timeout
        let timeoutId;
        const timeoutPromise = new Promise((_, reject) => {
            timeoutId = setTimeout(() => {
                reject(new Error(`Tool execution timed out after ${this.timeoutMs}ms`));
            }, this.timeoutMs);
        });

        const executionPromise = (async () => {
            try {
                const rawResult = await this.executeFn(args, {
                    signal,
                    onUpdate: (update) => {
                        if (typeof onUpdate === 'function') {
                            onUpdate(update);
                        }
                    },
                    ...context
                });

                if (rawResult instanceof AgentToolResult) {
                    return rawResult;
                }

                if (rawResult && typeof rawResult === 'object' && rawResult.content) {
                    return new AgentToolResult(rawResult);
                }

                if (typeof rawResult === 'string') {
                    return AgentToolResult.success(rawResult);
                }

                return AgentToolResult.success(JSON.stringify(rawResult, null, 2));
            } catch (err) {
                return AgentToolResult.error(err.message || 'Unknown tool execution error', {
                    stack: err.stack
                });
            }
        })();

        try {
            const result = await Promise.race([executionPromise, timeoutPromise]);
            return result;
        } catch (err) {
            return AgentToolResult.error(err.message, { timedOut: true });
        } finally {
            clearTimeout(timeoutId);
        }
    }

    /**
     * Returns standard tool definition for OpenAI/OpenRouter APIs
     */
    toOpenAISchema() {
        return {
            type: 'function',
            function: {
                name: this.name,
                description: this.description,
                parameters: this.parameters
            }
        };
    }
}

export class ToolRegistry {
    constructor() {
        this.tools = new Map();
    }

    registerTool(tool) {
        if (!(tool instanceof AgentTool)) {
            tool = new AgentTool(tool);
        }
        this.tools.set(tool.name, tool);
        return this;
    }

    registerMany(toolsArray = []) {
        for (const t of toolsArray) {
            this.registerTool(t);
        }
        return this;
    }

    getTool(name) {
        return this.tools.get(name);
    }

    hasTool(name) {
        return this.tools.has(name);
    }

    listTools() {
        return Array.from(this.tools.values());
    }

    toOpenAISchemas() {
        return this.listTools().map(t => t.toOpenAISchema());
    }
}
