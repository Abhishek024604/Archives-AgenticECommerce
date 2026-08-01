import { API } from "./axios"

export const createCommunity = (data) => API.post("/communities", data)

export const joinCommunity = (communityId) => API.post(`/communities/join/${communityId}`)

export const leaveCommunity = (communityId) => API.post(`/communities/leave/${communityId}`)

export const deleteCommunity = (communityId) => API.delete(`/communities/${communityId}`)

export const getCommunities = (search = "") => API.get(`/communities${search ? `?search=${encodeURIComponent(search)}` : ""}`)