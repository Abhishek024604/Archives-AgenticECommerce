import Payout from "../models/Payout.model.js";

export const getSellerPayouts = async (req, res) => {
  try {
    const sellerId = req.user._id;
    const payouts = await Payout.find({ seller: sellerId }).sort({ createdAt: -1 });
    res.json(payouts);
  } catch (error) {
    console.error("getSellerPayouts error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
