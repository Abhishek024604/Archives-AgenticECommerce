import express from "express";
import { chat } from "../controllers/lucasController.js";
import { verifyUser } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/chat", verifyUser, chat);

export default router;
