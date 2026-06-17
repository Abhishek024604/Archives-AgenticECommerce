import { API } from "./axios";

export const sendOTP = (payload) => API.post("/otp/send-otp", payload);

export const verifyOTP = (payload) => API.post("/otp/verify-otp", payload);
