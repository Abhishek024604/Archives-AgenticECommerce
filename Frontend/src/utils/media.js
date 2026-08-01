const API_ORIGIN = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const resolveMediaUrl = (url) => {
  if (!url) return ""

  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:") || url.startsWith("/assets")) {
    return url
  }

  return `${API_ORIGIN}${url.startsWith("/") ? url : `/${url}`}`
}
