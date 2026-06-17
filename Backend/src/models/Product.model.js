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