import { stripHtml } from "./blogContent.js"

export const createSlug = (value = "") => {
    return value
        .toString()
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
}

export const createExcerpt = (content = "", maxLength = 180) => {
    const normalized = stripHtml(content)

    if (normalized.length <= maxLength) {
        return normalized
    }

    return `${normalized.slice(0, maxLength).trim()}...`
}

export const calculateReadTime = (content = "") => {
    const words = stripHtml(content).split(/\s+/).filter(Boolean).length
    return Math.max(1, Math.ceil(words / 220))
}

export const normalizeTags = (tags = []) => {
    if (!Array.isArray(tags)) {
        return []
    }

    return tags
        .map((tag) => tag.toString().trim())
        .filter(Boolean)
        .slice(0, 8)
}

export const validateBlogInput = (data) => {
    if (!data.title || !data.content || (!data.coverImage && !data.coverImageData)) {
        throw new Error("Title, content, and cover image are required")
    }

    if (data.title.trim().length < 4) {
        throw new Error("Title must be at least 4 characters")
    }

    if (stripHtml(data.content).length < 80) {
        throw new Error("Content must be at least 80 characters")
    }
}

export const validateBlogUpdate = (data) => {
    if (data.title != null && data.title.trim().length < 4) {
        throw new Error("Title must be at least 4 characters")
    }

    if (data.content != null && stripHtml(data.content).length < 80) {
        throw new Error("Content must be at least 80 characters")
    }

    if (data.coverImage != null && !data.coverImage.trim()) {
        throw new Error("Cover image is required")
    }
}
