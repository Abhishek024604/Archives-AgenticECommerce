import express from "express";
import { verifyUser } from "../middleware/authMiddleware.js";
import { getSellerDiscounts, applyDiscount } from "../controllers/discountController.js";

const router = express.Router();

router.get("/seller", verifyUser, getSellerDiscounts);

router.post('/apply', applyDiscount);

export default router;
