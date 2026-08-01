import User from "../models/User.model.js";
import Product from "../models/Product.model.js";

// @route   POST /api/wishlist/toggle/:productId
// @desc    Toggle product in wishlist
export const toggleWishlist = async (req, res) => {
    try {
        const { productId } = req.params;
        const userId = req.user._id;

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Check if product is already in wishlist
        const isWishlisted = user.wishlist.includes(productId);

        if (isWishlisted) {
            // Remove from wishlist
            user.wishlist = user.wishlist.filter(id => id.toString() !== productId);
            await user.save();
            res.status(200).json({ message: "Removed from wishlist", wishlisted: false, wishlist: user.wishlist });
        } else {
            // Add to wishlist
            user.wishlist.push(productId);
            await user.save();
            res.status(200).json({ message: "Added to wishlist", wishlisted: true, wishlist: user.wishlist });
        }

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @route   GET /api/wishlist
// @desc    Get user's populated wishlist
export const getWishlist = async (req, res) => {
    try {
        const userId = req.user._id;

        const user = await User.findById(userId).populate("wishlist");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json(user.wishlist);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
