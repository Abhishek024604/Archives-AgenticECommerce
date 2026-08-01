import mongoose from "mongoose"

const blogSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true
        },
        slug: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },
        subtitle: {
            type: String,
            trim: true,
            default: ""
        },
        excerpt: {
            type: String,
            trim: true,
            default: ""
        },
        content: {
            type: String,
            required: true,
            trim: true
        },
        contentFormat: {
            type: String,
            enum: ["plain", "html"],
            default: "plain"
        },
        coverImage: {
            type: String,
            required: true,
            trim: true
        },
        category: {
            type: String,
            trim: true,
            default: "Editorial"
        },
        theme: {
            type: String,
            enum: ["Sustainability", "Design & Craft", "Watches", "Fragrance", "Horology & Tailoring", "Culture & Heritage", "Quiet Luxury"],
            default: "Design & Craft",
            trim: true
        },
        tags: {
            type: [String],
            default: []
        },
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        readTimeMinutes: {
            type: Number,
            default: 1
        },
        readsCount: {
            type: Number,
            default: 0
        },
        totalTimeSpent: {
            type: Number,
            default: 0
        }
    },
    { timestamps: true }
)

blogSchema.index({ title: "text", subtitle: "text", excerpt: "text", content: "text" })

const Blog = mongoose.model("Blog", blogSchema)

export default Blog
