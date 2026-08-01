import express from "express";
import { verifyUser } from "../middleware/authMiddleware.js";
import {
    createReview,
    getSellerReviews,
    updateReviewStatus,
    getProductReviews,
    canReviewProduct
} from "../controllers/reviewController.js";

const router = express.Router();

// Buyer route
router.post("/", verifyUser, createReview);
router.get("/product/:productId", getProductReviews);
router.get("/can-review/:productId", verifyUser, canReviewProduct);

// Seller routes
router.get("/seller", verifyUser, getSellerReviews);
router.put("/:id/status", verifyUser, updateReviewStatus);

export default router;
