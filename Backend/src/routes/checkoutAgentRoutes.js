import express from "express";
import { chat } from "../controllers/checkoutAgentController.js";
import { verifyOptionalUser } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/chat", verifyOptionalUser, chat);

export default router;
