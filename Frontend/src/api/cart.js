import { API } from "./axios";

export const getCart = () => API.get("/cart");
export const addToCart = (payload) => API.post("/cart/add", payload);
export const updateCartItem = async (data) => {
  return await API.put("/cart/update", data);
};

export const updateCartItemSize = async (data) => {
  return await API.put("/cart/update-size", data);
};

export const removeCartItem = (payload) => API.delete("/cart/remove", { data: payload });
export const clearCart = () => API.delete("/cart/clear");