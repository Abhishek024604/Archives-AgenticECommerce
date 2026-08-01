import * as blogService from "../services/blogService.js"

export const createBlog = async (req, res) => {
    try {
        const blog = await blogService.createBlogService(req.body, req.user)

        res.status(201).json({
            success: true,
            blog
        })
    } catch (error) {
        const status = error.message.includes("Only sellers") ? 403 : 400

        res.status(status).json({
            success: false,
            message: error.message
        })
    }
}

export const getBlogs = async (req, res) => {
    try {
        const blogs = await blogService.getBlogsService({
            search: req.query.search,
            category: req.query.category,
            theme: req.query.theme,
            filter: req.query.filter,
            limit: req.query.limit
        })

        res.status(200).json({
            success: true,
            blogs
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

export const logMetrics = async (req, res) => {
    try {
        const { timeSpent } = req.body
        const blog = await blogService.logMetricsService(req.params.id, timeSpent)

        res.status(200).json({
            success: true,
            blog
        })
    } catch (error) {
        res.status(404).json({
            success: false,
            message: error.message
        })
    }
}



export const getBlogBySlug = async (req, res) => {
    try {
        const blog = await blogService.getBlogBySlugService(req.params.slug)

        res.status(200).json({
            success: true,
            blog
        })
    } catch (error) {
        res.status(404).json({
            success: false,
            message: error.message
        })
    }
}

export const updateBlog = async (req, res) => {
    try {
        const blog = await blogService.updateBlogService(req.params.id, req.body, req.user)

        res.status(200).json({
            success: true,
            blog
        })
    } catch (error) {
        const status = error.message === "Unauthorized" || error.message.includes("Only sellers")
            ? 403
            : 400

        res.status(status).json({
            success: false,
            message: error.message
        })
    }
}

export const deleteBlog = async (req, res) => {
    try {
        const result = await blogService.deleteBlogService(req.params.id, req.user)

        res.status(200).json({
            success: true,
            ...result
        })
    } catch (error) {
        const status = error.message === "Unauthorized" || error.message.includes("Only sellers")
            ? 403
            : 400

        res.status(status).json({
            success: false,
            message: error.message
        })
    }
}
