import mongoose from "mongoose"

const reviewSchema = new mongoose.Schema(
    {
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true
        },
        seller: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        customer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        order: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Order"
        },
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5
        },
        comment: {
            type: String,
            trim: true
        },
        media: {
            type: [String],
            default: []
        },
        status: {
            type: String,
            enum: ["Pending", "Published", "Hidden"],
            default: "Published"
        }
    }, 
    { timestamps: true }
)

const Review = mongoose.model("Review", reviewSchema)

export default Review
