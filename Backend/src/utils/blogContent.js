const allowedTags = new Set([
    "p",
    "br",
    "strong",
    "b",
    "em",
    "i",
    "u",
    "h2",
    "h3",
    "blockquote",
    "ul",
    "ol",
    "li"
])

const tagPattern = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi

export const sanitizeBlogHtml = (html = "") => {
    return html
        .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
        .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
        .replace(/<!--[\s\S]*?-->/g, "")
        .replace(tagPattern, (match, tagName) => {
            const normalizedTag = tagName.toLowerCase()

            if (!allowedTags.has(normalizedTag)) {
                return ""
            }

            return match.startsWith("</") ? `</${normalizedTag}>` : `<${normalizedTag}>`
        })
        .replace(/\son[a-z]+\s*=\s*(['"]).*?\1/gi, "")
        .replace(/\s(?:href|src)\s*=\s*(['"])\s*javascript:.*?\1/gi, "")
        .trim()
}

export const stripHtml = (value = "") => {
    return value
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<\/p>/gi, "\n")
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/gi, " ")
        .replace(/&amp;/gi, "&")
        .replace(/&lt;/gi, "<")
        .replace(/&gt;/gi, ">")
        .replace(/\s+/g, " ")
        .trim()
}
