// routes/order.routes.js

import express from "express";
import * as orderController from "../controllers/orderController.js";
import {verifyUser} from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/my", verifyUser, orderController.getMyOrders);
router.get("/seller", verifyUser, orderController.getSellerOrders);
router.patch("/seller/:orderId/dispatch", verifyUser, orderController.dispatchSellerOrder);
router.post("/place", verifyUser, orderController.placeOrder);

export default router;
