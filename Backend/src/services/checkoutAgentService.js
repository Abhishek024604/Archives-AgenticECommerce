/**
 * Checkout Visual Copilot & Shopping Agent
 * Refactored with the Tau Agent Harness architecture (https://twotimespi.dev/)
 * 
 * Provides:
 * 1. Normalized Tau event lifecycle mapped cleanly to client SSE.
 * 2. Full cancellation handling on client disconnect (AbortSignal propagation).
 * 3. Structured context compaction for lengthy product exploration sessions.
 * 4. Resilient direct-tool execution without flaky HTTP-over-SSE loops.
 */

import { TauProvider } from '../harness/tauProvider.js';
import { TauHarness } from '../harness/tauHarness.js';
import { TauTranscript } from '../harness/tauTranscript.js';
import { createCheckoutToolRegistry } from '../harness/storeTools.js';

let sharedProvider = null;
let checkoutToolRegistry = null;

const getProvider = () => {
    if (!sharedProvider) {
        sharedProvider = new TauProvider({
            apiKey: process.env.OPENROUTER_API_KEY || process.env.GROQ_API_KEY,
            baseURL: process.env.OPENROUTER_API_KEY ? "https://openrouter.ai/api/v1" : "https://api.groq.com/openai/v1",
            defaultModel: process.env.OPENROUTER_MODEL || (process.env.OPENROUTER_API_KEY ? "meta-llama/llama-3.1-8b-instruct:free" : "llama-3.3-70b-versatile"),
            maxRetries: 2,
            retryDelayMs: 1000
        });
    }
    return sharedProvider;
};

const getCheckoutTools = () => {
    if (!checkoutToolRegistry) {
        checkoutToolRegistry = createCheckoutToolRegistry();
    }
    return checkoutToolRegistry;
};

const buildSystemPrompt = (user, context) => `You are the Autonomous Shopping Assistant & Visual Copilot for ARCHIVIST luxury e-commerce.
Your goal is to help the customer (Name: ${user?.name || "Guest"}) discover products, inspect items, manage their bag, and guide them through checkout.
Your user's ID is: ${user?._id?.toString() || ""}. Pass this exact ID in 'userId' arguments for tools like ui_add_to_cart, get_cart, etc.

Current User Context:
- Current Page Path: ${context?.currentPath || "/"}
- Current Search Params: ${context?.currentSearch || ""}

Available product categories:
- women
- men
- footwear
- bags
- perfumes
- accessories
- home & lifestyle

WHEN THE USER ASKS TO FIND PRODUCTS:
1. Understand the user's natural language request.
2. Extract relevant filters:
   - category (must be one of: women, men, footwear, bags, perfumes, accessories, home & lifestyle)
   - subCategory (e.g., shirt, t-shirt, blazer, jeans, boots, sneakers, heels, dress, jacket, perfume, watch)
   - brandName (e.g., PETER ENGLAND, Roadster, HRX, CADMON, Zara, Archivist)
   - minPrice / maxPrice (preserve user constraints exactly in INR)
   - minRating (minimum rating threshold 0-5)
   - minDiscount (minimum discount percentage 0-100)
   - size (e.g., S, M, L, XL, UK 7, UK 8, 30, 32)
   - sortBy (price_asc, price_desc, rating_desc, newest, discount_desc)
   - limit (default 10)
3. Use search_products.
4. Never invent products.
5. Only recommend products returned by the tool.
6. If the user gives a price constraint, preserve it exactly.
7. If a requested filter is unavailable in the product database, do not pretend it exists.
8. Ask a clarification question only when necessary.
9. Return product IDs so the frontend can render product cards.

EXAMPLE: "Find men's shirts under ₹500"
User:
Find men's shirts under 500

Agent internally determines:
{
    "category": "men",
    "subCategory": "shirt",
    "maxPrice": 500,
    "limit": 10
}

Then calls:
search_products(...)

Suppose MongoDB returns products:
[
    {
        "_id": "123",
        "productName": "Slim Fit Shirt",
        "brandName": "Roadster",
        "price": 449,
        "rating": 4.2
    },
    {
        "_id": "456",
        "productName": "Casual Cotton Shirt",
        "brandName": "HRX",
        "price": 399,
        "rating": 4.1
    }
]

The agent then responds:
{
    "type": "product_results",
    "message": "I found 2 men's shirts under ₹500.",
    "products": [
        { "id": "123" },
        { "id": "456" }
    ]
}

CRITICAL ARCHITECTURAL RULE: DON'T MAKE THE LLM RENDER PRODUCT CARDS.
Don't generate markdown text cards, fake ASCII images, or mock buttons like:
[Image]
Slim Fit Shirt
₹449
[Add to Cart]

Instead, your agent response should contain structured data:
{
    "type": "product_results",
    "message": "I found these shirts under ₹500.",
    "products": [
        { "id": "123" },
        { "id": "456" }
    ]
}
Then React does:
<ProductGrid products={products} />
Your UI remains deterministic.

VISUAL COPILOT & SHOPPING RULES:
- You are also a visual copilot. You can use 'ui_*' tools to interact with the screen.
- When the user asks to see a category or navigate, you can call 'ui_search' or 'ui_navigate'.
- When a user wants to view a specific product, use 'ui_click_product'.
- When the user wants to select a size, use 'ui_select_size'.
- When they want to add to bag, use 'ui_add_to_cart'.
- If the user asks to go to their cart, view their bag, or check their cart, use 'ui_navigate' with path '/cart' or 'get_cart'.
- If the user wants to check out, first retrieve the cart using 'get_cart'. Summarize it briefly. Then ask for their shipping details and payment method (CARD or COD) if you don't have it, before using 'place_order'.
- Monetary values are Indian rupees (INR).`;

/**
 * Streams chat turns with the Checkout Copilot using the Tau Harness over SSE.
 */
export const streamChatWithCheckoutAgent = async (user, history, res, context, req = null) => {
    if (!process.env.OPENROUTER_API_KEY && !process.env.GROQ_API_KEY) {
        throw new Error("Checkout Agent is not configured. Add OPENROUTER_API_KEY to your .env file.");
    }

    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const provider = getProvider();
    const toolRegistry = getCheckoutTools();

    // 1. Initialize Tau Transcript with context safety
    const transcript = new TauTranscript({
        maxTokens: 14000,
        compactThreshold: 12000
    });
    transcript.importHistory(history);

    const latestUserMsg = [...transcript.messages].reverse().find(m => m.role === 'user');
    const promptText = latestUserMsg ? latestUserMsg.content : "Help me find products and checkout.";

    // 2. Cancellation controller for client disconnects
    const abortController = new AbortController();
    if (req) {
        req.on('close', () => {
            abortController.abort();
        });
    }

    const harness = new TauHarness({
        provider,
        toolRegistry,
        maxTurns: 5,
        model: process.env.OPENROUTER_MODEL,
        temperature: 0.2
    });

    const executionContext = {
        user,
        userId: user?._id?.toString() || "",
        currentPath: context?.currentPath || "/",
        currentSearch: context?.currentSearch || ""
    };

    // Helper to send formatted SSE
    const writeSse = (data) => {
        if (!res.writableEnded) {
            res.write(`data: ${JSON.stringify(data)}\n\n`);
        }
    };

    try {
        await harness.run({
            prompt: promptText,
            systemPrompt: buildSystemPrompt(user, context),
            transcript,
            signal: abortController.signal,
            context: executionContext,
            emitEvent: (event) => {
                // Map Tau Events to frontend SSE stream
                switch (event.type) {
                    case 'turn_start':
                        writeSse({
                            type: 'turn_start',
                            turnIndex: event.turnIndex,
                            timestamp: event.timestamp,
                            tauEvent: event
                        });
                        break;

                    case 'message_update':
                        writeSse({
                            type: 'message_update',
                            content: event.delta.text || '',
                            thinking: event.delta.thinking || '',
                            tauEvent: event
                        });
                        break;

                    case 'tool_execution_start':
                        writeSse({
                            type: 'tool_execution_start',
                            toolCallId: event.toolCallId,
                            toolName: event.toolName,
                            agentAction: event.toolName,
                            args: event.arguments || {},
                            actionState: "running",
                            tauEvent: event
                        });
                        break;

                    case 'tool_execution_end': {
                        let parsedProducts = null;
                        if (event.toolName === 'search_products' && event.result) {
                            try {
                                const parsed = JSON.parse(event.result);
                                if (parsed && Array.isArray(parsed.products)) {
                                    parsedProducts = parsed.products;
                                }
                            } catch (e) {}
                        }

                        writeSse({
                            type: 'tool_execution_end',
                            toolCallId: event.toolCallId,
                            toolName: event.toolName,
                            toolExecuted: event.toolName,
                            status: event.isError ? "error" : "success",
                            isError: event.isError,
                            args: event.arguments || {},
                            result: event.result,
                            products: parsedProducts,
                            durationMs: event.durationMs,
                            agentAction: event.toolName,
                            actionState: "done",
                            tauEvent: event
                        });

                        if (parsedProducts && parsedProducts.length > 0) {
                            writeSse({
                                type: 'product_results',
                                products: parsedProducts
                            });
                        }
                        break;
                    }

                    case 'turn_end':
                        writeSse({
                            type: 'turn_end',
                            turnIndex: event.turnIndex,
                            usage: event.usage,
                            tauEvent: event
                        });
                        break;

                    case 'compaction':
                        writeSse({
                            type: 'compaction',
                            compaction: true,
                            summary: event.summary,
                            tauEvent: event
                        });
                        break;

                    case 'agent_settled':
                        writeSse({
                            type: 'agent_settled',
                            status: event.status,
                            tauEvent: event
                        });
                        break;
                }
            }
        });

        // Provide final structured messages
        writeSse({ finalMessages: transcript.messages });
    } catch (error) {
        console.error("[CheckoutAgent:TauHarness] Execution error:", error);
        writeSse({ error: error.message || "Agent execution failed" });
    } finally {
        if (!res.writableEnded) {
            res.write("data: [DONE]\n\n");
            res.end();
        }
    }
};
