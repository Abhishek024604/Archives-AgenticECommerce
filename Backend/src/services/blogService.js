import mongoose from "mongoose"
import Blog from "../models/Blog.model.js"
import {
    calculateReadTime,
    createExcerpt,
    createSlug,
    normalizeTags,
    validateBlogInput,
    validateBlogUpdate
} from "../utils/blogValidation.js"
import { sanitizeBlogHtml } from "../utils/blogContent.js"
import { saveDataImage } from "../utils/imageUpload.js"

const ensureSeller = (user) => {
    if (user.role !== "seller") {
        throw new Error("Only sellers can post blogs")
    }
}

const createUniqueSlug = async (title, existingId = null) => {
    const baseSlug = createSlug(title)

    if (!baseSlug) {
        throw new Error("Title must include letters or numbers")
    }

    let slug = baseSlug
    let count = 2

    while (await Blog.findOne({
        slug,
        ...(existingId ? { _id: { $ne: existingId } } : {})
    })) {
        slug = `${baseSlug}-${count}`
        count += 1
    }

    return slug
}

const resolveCoverImage = async (data) => {
    if (data.coverImageData) {
        return await saveDataImage(data.coverImageData, "blogs")
    }

    return data.coverImage?.trim() || ""
}

const normalizeContent = (data) => {
    if (data.contentFormat === "html") {
        return {
            content: sanitizeBlogHtml(data.content),
            contentFormat: "html"
        }
    }

    return {
        content: data.content.trim(),
        contentFormat: "plain"
    }
}

export const createBlogService = async (data, user) => {
    ensureSeller(user)
    validateBlogInput(data)

    const slug = await createUniqueSlug(data.title)
    const { content, contentFormat } = normalizeContent(data)
    const excerpt = data.excerpt?.trim() || createExcerpt(content)
    const coverImage = await resolveCoverImage(data)

    return await Blog.create({
        title: data.title.trim(),
        slug,
        subtitle: data.subtitle?.trim() || "",
        excerpt,
        content,
        contentFormat,
        coverImage,
        category: data.category?.trim() || "Editorial",
        theme: data.theme?.trim() || "Design & Craft",
        tags: normalizeTags(data.tags),
        author: user._id,
        readTimeMinutes: calculateReadTime(content)
    })
}

export const getBlogsService = async ({ search, category, theme, filter, limit = 80 } = {}) => {
    const query = {}

    if (category) {
        query.category = category
    }

    if (theme) {
        query.theme = theme
    }

    if (search) {
        query.$text = { $search: search }
    }

    const resultLimit = Math.min(Math.max(Number(limit) || 80, 1), 120);

    if (filter === "trending") {
        const trendingBlogs = await Blog.aggregate([
            { $match: query },
            { 
                $addFields: {
                    trendingScore: { 
                        $add: [
                            { $multiply: ["$readsCount", 10] },
                            { $divide: ["$totalTimeSpent", 60] }
                        ]
                    }
                }
            },
            { $sort: { trendingScore: -1, createdAt: -1 } },
            { $limit: resultLimit }
        ]);

        if (trendingBlogs.length === 0 || trendingBlogs[0]?.trendingScore === 0) {
            const randomBlogs = await Blog.aggregate([
                { $match: query },
                { $sample: { size: resultLimit } }
            ]);
            return await Blog.populate(randomBlogs, { path: "author", select: "name email role sellerInfo.storeName" });
        }

        return await Blog.populate(trendingBlogs, { path: "author", select: "name email role sellerInfo.storeName" });
    }

    return await Blog.find(query)
        .populate("author", "name email role sellerInfo.storeName")
        .sort({ createdAt: -1 })
        .limit(resultLimit)
}

export const logMetricsService = async (id, timeSpent) => {
    if (!mongoose.Types.ObjectId.isValid(id) && !id) {
        throw new Error("Invalid blog ID")
    }

    const query = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { slug: id }
    const blog = await Blog.findOne(query)

    if (!blog) {
        throw new Error("Blog not found")
    }

    blog.readsCount += 1
    if (timeSpent && !isNaN(timeSpent)) {
        blog.totalTimeSpent += Number(timeSpent)
    }

    await blog.save()
    return blog
}

export const getBlogBySlugService = async (slug) => {
    const query = mongoose.Types.ObjectId.isValid(slug)
        ? { _id: slug }
        : { slug }

    const blog = await Blog.findOne(query).populate("author", "name email role sellerInfo.storeName")

    if (!blog) {
        throw new Error("Blog not found")
    }

    return blog
}

export const updateBlogService = async (id, data, user) => {
    ensureSeller(user)

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error("Invalid blog ID")
    }

    validateBlogUpdate(data)

    const blog = await Blog.findById(id)

    if (!blog) {
        throw new Error("Blog not found")
    }

    if (blog.author.toString() !== user._id.toString()) {
        throw new Error("Unauthorized")
    }

    if (data.title !== undefined) {
        blog.title = data.title.trim()
        blog.slug = await createUniqueSlug(data.title, blog._id)
    }

    if (data.subtitle !== undefined) {
        blog.subtitle = data.subtitle.trim()
    }

    if (data.content !== undefined) {
        const { content, contentFormat } = normalizeContent(data)
        blog.content = content
        blog.contentFormat = contentFormat
        blog.readTimeMinutes = calculateReadTime(blog.content)

        if (data.excerpt === undefined) {
            blog.excerpt = createExcerpt(blog.content)
        }
    }

    if (data.excerpt !== undefined) {
        blog.excerpt = data.excerpt.trim() || createExcerpt(blog.content)
    }

    if (data.coverImage !== undefined) {
        blog.coverImage = data.coverImage.trim()
    }

    if (data.coverImageData !== undefined) {
        blog.coverImage = await saveDataImage(data.coverImageData, "blogs")
    }

    if (data.category !== undefined) {
        blog.category = data.category.trim() || "Editorial"
    }

    if (data.tags !== undefined) {
        blog.tags = normalizeTags(data.tags)
    }

    await blog.save()
    return blog
}

export const deleteBlogService = async (id, user) => {
    ensureSeller(user)

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error("Invalid blog ID")
    }

    const blog = await Blog.findById(id)

    if (!blog) {
        throw new Error("Blog not found")
    }

    if (blog.author.toString() !== user._id.toString()) {
        throw new Error("Unauthorized")
    }

    await blog.deleteOne()

    return { message: "Blog deleted" }
}
