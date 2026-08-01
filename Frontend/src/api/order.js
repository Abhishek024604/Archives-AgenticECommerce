import { API } from "./axios";

export const placeOrder = (payload) => API.post("/order/place", payload);

export const getMyOrders = () => API.get("/order/my");

export const getSellerOrders = () => API.get("/order/seller");

export const getSellerOrderById = (orderId) => API.get(`/order/seller/${orderId}`);

export const dispatchSellerOrder = (orderId) =>
  API.patch(`/order/seller/${orderId}/dispatch`);
