import express from "express";
import { verifyUser } from "../middleware/authMiddleware.js";
import { getSellerPayouts } from "../controllers/payoutController.js";

const router = express.Router();

router.get("/seller", verifyUser, getSellerPayouts);

export default router;
