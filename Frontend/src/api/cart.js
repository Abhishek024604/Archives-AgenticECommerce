import { API } from "./axios";

export const getCart = () => API.get("/cart");
export const addToCart = (payload) => API.post("/cart/add", payload);
export const updateCartItem = (payload) => API.put("/cart/update", payload);
export const removeCartItem = (payload) => API.delete("/cart/remove", { data: payload });
export const clearCart = () => API.delete("/cart/clear");