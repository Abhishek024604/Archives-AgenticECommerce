import { streamChatWithCheckoutAgent } from "../services/checkoutAgentService.js";

export const chat = async (req, res) => {
    try {
        const history = Array.isArray(req.body.messages) ? req.body.messages : [];
        const latestMessage = history.at(-1);

        if (latestMessage?.role !== "user" || !latestMessage.content?.trim()) {
            return res.status(400).json({ message: "A user message is required" });
        }

        // The user object is attached by authMiddleware. If they are a guest, user might be undefined, but our tools might require authentication for checkout/cart.
        // Assuming verifyUser middleware is used.
        const user = req.user;

        const context = req.body.context || {};

        // streamChatWithCheckoutAgent handles the res stream internally
        await streamChatWithCheckoutAgent(user, history, res, context, req);
    } catch (error) {
        console.error("Checkout Agent Error:", error);
        if (!res.headersSent) {
            res.status(500).json({
                message: error.message || "The agent could not complete the request"
            });
        } else {
            res.write(`data: ${JSON.stringify({ error: error.message || "Internal server error" })}\n\n`);
            res.write("data: [DONE]\n\n");
            res.end();
        }
    }
};
