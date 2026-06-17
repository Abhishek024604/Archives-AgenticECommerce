import { API } from "./axios"

export const getMessages = (communityId) => API.get(`/messages/${communityId}`)