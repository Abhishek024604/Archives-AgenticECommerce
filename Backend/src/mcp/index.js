import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { randomUUID } from "crypto";
import { registerTools } from "./tools.js";

const getServer = () => {
    const server = new McpServer({
        name: "ECommerce-MCP-Server",
        version: "1.0.0"
    });
    registerTools(server);
    return server;
};

// Store active MCP transports by session ID to allow multiple agents to connect simultaneously
const transports = {};

export const attachMcpServer = (app) => {

    // =========================================================================
    // 1. MODERN: STREAMABLE HTTP TRANSPORT (Protocol Version 2025-11-25)
    // Resolves deprecation warning.
    // =========================================================================
    app.all("/mcp", async (req, res) => {
        try {
            const sessionId = req.headers['mcp-session-id'];
            let transport;

            if (sessionId && transports[sessionId]) {
                const existing = transports[sessionId];
                if (existing instanceof StreamableHTTPServerTransport) {
                    transport = existing;
                } else {
                    res.status(400).json({ error: "Session exists but uses a different transport protocol" });
                    return;
                }
            } else if (!sessionId && req.method === 'POST' && req.body?.method === 'initialize') {
                transport = new StreamableHTTPServerTransport({
                    sessionIdGenerator: () => randomUUID(),
                    onsessioninitialized: id => {
                        transports[id] = transport;
                    }
                });
                
                transport.onclose = () => {
                    const sid = transport.sessionId;
                    if (sid && transports[sid]) {
                        delete transports[sid];
                    }
                };

                const server = getServer();
                await server.connect(transport);
            } else {
                res.status(400).json({ error: "Invalid session or not an initialization request." });
                return;
            }

            await transport.handleRequest(req, res, req.body);
        } catch (error) {
            console.error('MCP Error:', error);
            if (!res.headersSent) res.status(500).json({ error: "Internal server error" });
        }
    });

    // =========================================================================
    // 2. DEPRECATED: HTTP + SSE TRANSPORT (Protocol Version 2024-11-05)
    // Preserved for backward compatibility with older agents.
    // =========================================================================
    app.get("/mcp/sse", async (req, res) => {
        const transport = new SSEServerTransport("/mcp/messages", res);
        transports[transport.sessionId] = transport;

        res.on("close", () => {
            delete transports[transport.sessionId];
        });

        const server = getServer();
        await server.connect(transport);
    });

    app.post("/mcp/messages", async (req, res) => {
        const sessionId = req.query.sessionId;
        const existingTransport = transports[sessionId];

        if (existingTransport instanceof SSEServerTransport) {
            await existingTransport.handlePostMessage(req, res, req.body);
        } else if (!existingTransport) {
            res.status(404).send("Session not found");
        } else {
            res.status(400).send("Session exists but uses a different transport protocol");
        }
    });
};
