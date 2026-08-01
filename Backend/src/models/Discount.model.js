import mongoose from "mongoose";

const discountSchema = new mongoose.Schema(
  {
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    code: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["Percentage", "Fixed Amount"],
      required: true,
    },
    value: {
      type: Number,
      required: true,
    },
    subValue: {
      type: String, // e.g., "Max ₹1,500" or "Min. order ₹2,999"
    },
    revenueGenerated: { type: Number, default: 0 },
    usage: {
      type: Number,
      default: 0,
    },
    maxrevenueGenerated: { type: Number, default: 0 },
    usage: {
      type: Number,
      required: true,
    },
    validityStart: {
      type: Date,
      required: true,
    },
    validityEnd: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["Active", "Scheduled", "Expired"],
      default: "Active",
    },
  },
  { timestamps: true }
);

const Discount = mongoose.model("Discount", discountSchema);
export default Discount;
