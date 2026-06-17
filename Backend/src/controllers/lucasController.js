import { chatWithLucas } from "../services/lucasService.js";

export const chat = async (req, res) => {
    try {
        if (req.user.role !== "seller") {
            return res.status(403).json({
                message: "Lucas Seller is available only to seller accounts"
            });
        }

        const history = Array.isArray(req.body.messages) ? req.body.messages : [];
        const latestMessage = history.at(-1);

        if (latestMessage?.role !== "user" || !latestMessage.content?.trim()) {
            return res.status(400).json({ message: "A seller message is required" });
        }

        const result = await chatWithLucas(req.user, history);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({
            message: error.message || "Lucas could not complete the request"
        });
    }
};
