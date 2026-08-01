import express from "express";
import * as cartController from "../controllers/cartController.js";
import { verifyUser } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/add", verifyUser, cartController.addToCart);
router.get("/", verifyUser, cartController.getCart);
router.put("/update", verifyUser, cartController.updateCartItem);
router.put("/update-size", verifyUser, cartController.updateCartItemSize);
router.delete("/remove", verifyUser, cartController.removeCartItem);
router.delete("/clear", verifyUser, cartController.clearCart);

export default router;