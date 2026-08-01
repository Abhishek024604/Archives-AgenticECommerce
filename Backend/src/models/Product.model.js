import mongoose from "mongoose"

const productSchema = new mongoose.Schema(
    {
        brandName: {
            type: String,
            required: true
        },
        productName: {
            type: String,
            required: true
        },
        category: {
            type: String,
            enum: ["women", "men", "footwear", "bags", "perfumes", "accessories", "home & lifestyle"],
            required: true,
            default: "men",
            lowercase: true,
            trim: true
        },
        subCategory: {
            type: String,
            lowercase: true,
            trim: true
        },
        price: {
            type: Number,
            required: true
        },
        rating: {
            type: Number,
            default: 0
        },
        totalRatings: {
            type: Number,
            default: 0
        },
        discount: {
            type: Number,
            default: 0
        },
        salesCount: {
            type: Number,
            default: 0
        },
        images: {
            type: [String],
            required: true
        },
        variants: [
  {
    size: String,
    stock: Number
  }
],
        seller: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }

    }, { timestamps: true }
)

const Product = mongoose.model("Product", productSchema)

export default Product