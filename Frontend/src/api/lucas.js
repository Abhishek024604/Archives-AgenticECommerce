import { API } from "./axios";

export const chatWithLucas = (messages) =>
  API.post("/lucas/chat", { messages });
