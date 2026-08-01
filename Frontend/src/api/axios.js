import axios from "axios"

export const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");

export const API = axios.create({
  baseURL: `${API_URL}/api`,
  withCredentials: true
})

let refreshing = false
let pending = []

const processQueue = (error, tokenRefreshed) => {
  pending.forEach(({ resolve, reject }) => {
    if (error) reject(error)
    else resolve(tokenRefreshed)
  })
  pending = []
}

API.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config || {}
    const isRefreshRequest = original.url?.includes("/auth/refresh")

    if (error.response?.status === 401 && !original._retry && !isRefreshRequest) {
      if (refreshing) {
        return new Promise((resolve, reject) => {
          pending.push({ resolve, reject })
        }).then(() => API(original))
      }

      original._retry = true
      refreshing = true

      try {
        await API.post("/auth/refresh")
        processQueue(null, true)
        return API(original)
      } catch (e) {
        processQueue(e, false)
        return Promise.reject(e)
      } finally {
        refreshing = false
      }
    }

    return Promise.reject(error)
  }
)
