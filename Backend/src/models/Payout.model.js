import mongoose from "mongoose";

const payoutSchema = new mongoose.Schema(
  {
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    payoutId: {
      type: String,
      required: true,
      unique: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["Processing", "Paid", "Failed"],
      default: "Processing",
    },
    mode: {
      type: String,
      default: "NEFT",
    },
    accountDetails: {
      type: String,
    },
  },
  { timestamps: true }
);

const Payout = mongoose.model("Payout", payoutSchema);
export default Payout;
