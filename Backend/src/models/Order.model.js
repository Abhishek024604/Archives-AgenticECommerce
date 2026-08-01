import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        sellerId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },

        brandName: String,
        productName: String,
        image: String,
        price: Number,
        size: String,

        quantity: {
          type: Number,
          required: true,
          min: 1
        },
        dispatchedAt: {
          type: Date,
          default: null,
        },
      },
    ],

    subtotal: {
      type: Number,
      required: true,
    },

    discountCode: { type: String, default: null },
    discount: {
      type: Number,
      default: 0,
    },

    totalAmount: {
      type: Number,
      required: true,
    },

    status: {
      type: String,
      enum: ["PENDING", "CONFIRMED", "CANCELLED"],
      default: "PENDING"
    },
    paymentMethod: {
      type: String,
      enum: ["CARD", "UPI", "NET_BANKING", "COD"],
      default: "CARD"
    },
    shippingAddress: {
      name: String,
      phone: String,
      addressLine: String,
      city: String,
      state: String,
      pincode: Number
    },
    orderId: {
      type: String,
      unique: true
    }
  },
  {
    timestamps: true,
  }
);

const Order = mongoose.model("Order", orderSchema);

export default Order;
