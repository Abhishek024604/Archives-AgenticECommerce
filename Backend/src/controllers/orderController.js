// controllers/order.controller.js

import * as orderService from "../services/orderService.js";

export const placeOrder = async (req, res) => {
    try {
        const order = await orderService.placeOrderService(
            req.user,
            req.body.shippingAddress,
            req.body.paymentMethod
        );

        res.status(201).json(order);

    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

export const getMyOrders = async (req, res) => {
    try {
        const orders = await orderService.getMyOrdersService(req.userId);
        res.status(200).json(orders);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const getSellerOrders = async (req, res) => {
    try {
        if (req.user.role !== "seller") {
            return res.status(403).json({ message: "Only sellers can access seller orders" });
        }

        const orders = await orderService.getSellerOrdersService(req.user._id);
        res.status(200).json(orders);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const dispatchSellerOrder = async (req, res) => {
    try {
        if (req.user.role !== "seller") {
            return res.status(403).json({ message: "Only sellers can dispatch seller orders" });
        }

        const order = await orderService.dispatchSellerOrderService(
            req.params.orderId,
            req.user._id
        );

        res.status(200).json(order);
    } catch (err) {
        const status = err.message === "Order not found"
            ? 404
            : err.message === "This order does not contain your products"
                ? 403
                : 400;

        res.status(status).json({ message: err.message });
    }
};
