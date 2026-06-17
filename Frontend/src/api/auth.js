import { API } from "./axios"

export const signUp = (userData) => API.post("/auth/signup", userData)

export const signIn = (userData) => API.post("/auth/signin", userData) 

export const logout = () => API.post("/auth/logout")

export const checkAuth = () => API.get("/auth/check-auth") 

export const refreshToken = () => API.post("/auth/refresh")