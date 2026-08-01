import express from "express";
import { getWishlist, toggleWishlist } from "../controllers/wishlistController.js";
import { verifyUser } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", verifyUser, getWishlist);
router.post("/toggle/:productId", verifyUser, toggleWishlist);

export default router;
