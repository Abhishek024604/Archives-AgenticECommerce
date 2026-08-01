import { API } from "./axios"

export const getBlogs = (params = {}) => API.get("/blogs", { params })

export const getBlog = (slug) => API.get(`/blogs/${slug}`)

export const createBlog = (data) => API.post("/blogs", data)

export const updateBlog = (id, data) => API.put(`/blogs/${id}`, data)

export const deleteBlog = (id) => API.delete(`/blogs/${id}`)

export const logBlogMetrics = (id, timeSpent) => API.post(`/blogs/${id}/metrics`, { timeSpent })
