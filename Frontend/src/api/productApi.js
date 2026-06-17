import { API } from "./axios"

export const fetchProducts = (params) => API.get("/products", { params })

export const fetchProductSuggestions = (params) => API.get("/products/suggest", { params })
