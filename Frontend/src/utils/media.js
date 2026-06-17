const API_ORIGIN = "http://localhost:5000"

export const resolveMediaUrl = (url) => {
  if (!url) return ""

  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) {
    return url
  }

  return `${API_ORIGIN}${url.startsWith("/") ? url : `/${url}`}`
}
