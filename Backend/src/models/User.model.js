import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        role: {
            type: String,
            enum: ["customer", "seller", "admin"],
            default: "customer"
        },
        name: {
            type: String,
            required: true
        },
        email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
},
        password: {
            type: String,
            required: true,
        },
        profileImage: {
            type: String
        },
        joinedCommunities: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Community"
            }
        ],
        sellerInfo: {
            storeName: String,
            address: {
                locality: { type: String },
                city: { type: String },
                state: { type: String },
                pincode: { type: Number }
            },
            contact: {
                type: Number
            }
        },
        wishlist: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Product"
            }
        ]

    }, { timestamps: true })

userSchema.pre("validate", function () {
    if (this.role !== "seller") {
        this.sellerInfo = undefined
        return
    }

    const sellerInfo = this.sellerInfo || {}
    const address = sellerInfo.address || {}

    if (!sellerInfo.storeName) {
        throw new Error("Store name is required for sellers")
    }

    if (!address.locality || !address.city || !address.state || address.pincode == null) {
        throw new Error("Complete seller address is required")
    }

    if (sellerInfo.contact == null) {
        throw new Error("Seller contact is required")
    }
})

const User = new mongoose.model("User", userSchema)

export default User
