import Discount from "../models/Discount.model.js";

export const getSellerDiscounts = async (req, res) => {
  try {
    const sellerId = req.user._id;
    const discounts = await Discount.find({ seller: sellerId }).sort({ createdAt: -1 });
    res.json(discounts);
  } catch (error) {
    console.error("getSellerDiscounts error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
export const applyDiscount = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ message: "Discount code is required" });
    }
    const discount = await Discount.findOne({ code });
    if (!discount) {
      return res.status(404).json({ message: "Invalid discount code" });
    }
    const now = new Date();
    if (discount.status !== "Active" || discount.validityStart > now || discount.validityEnd < now) {
      return res.status(400).json({ message: "Discount code is not active or has expired" });
    }
    if (discount.usage >= discount.maxUsage) {
      return res.status(400).json({ message: "Discount code usage limit reached" });
    }
    res.json(discount);
  } catch (error) {
    console.error("applyDiscount error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
