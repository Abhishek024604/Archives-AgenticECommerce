import Review from "../models/Review.model.js";
import Product from "../models/Product.model.js";
import Order from "../models/Order.model.js";

// Create a review
export const createReview = async (req, res) => {
    try {
        const { product: productId, rating, comment, media, order } = req.body;
        const customer = req.user._id;

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        // Verify that the user has bought this product (status = CONFIRMED)
        const orderRecord = await Order.findOne({
            user: customer,
            status: "CONFIRMED",
            "items.productId": productId
        });

        if (!orderRecord) {
            return res.status(403).json({ message: "You can only review products you have purchased." });
        }

        const review = await Review.create({
            product: productId,
            seller: product.seller,
            customer,
            order: order || orderRecord._id,
            rating,
            comment,
            media,
            status: "Published" // Auto-publish based on user feedback
        });

        // Update product average rating
        const allReviews = await Review.find({ product: productId, status: "Published" });
        const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
        product.rating = totalRating / allReviews.length;
        product.totalRatings = allReviews.length;
        await product.save();

        res.status(201).json(review);
    } catch (error) {
        console.error("Create review error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

// Get reviews for a specific product (public/buyer facing)
export const getProductReviews = async (req, res) => {
    try {
        const { productId } = req.params;
        const reviews = await Review.find({ product: productId, status: "Published" })
            .populate("customer", "name profileImage")
            .sort({ createdAt: -1 });

        res.json(reviews);
    } catch (error) {
        console.error("Get product reviews error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

// Get reviews for a seller's products
export const getSellerReviews = async (req, res) => {
    try {
        const sellerId = req.user._id;
        
        const reviews = await Review.find({ seller: sellerId })
            .populate("product", "productName images variants")
            .populate("customer", "name email storeName")
            .populate("order", "orderNumber")
            .sort({ createdAt: -1 });

        res.json(reviews);
    } catch (error) {
        console.error("Get seller reviews error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

// Update review status (Publish, Hide, etc.)
export const updateReviewStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const reviewId = req.params.id;

        const review = await Review.findById(reviewId);
        
        if (!review) {
            return res.status(404).json({ message: "Review not found" });
        }

        // Ensure the current user is the seller of the product being reviewed
        if (review.seller.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not authorized to update this review" });
        }

        review.status = status;
        await review.save();

        res.json(review);
    } catch (error) {
        console.error("Update review status error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

export const canReviewProduct = async (req, res) => {
    try {
        const { productId } = req.params;
        const customer = req.user._id;

        const orderRecord = await Order.findOne({
            user: customer,
            status: "CONFIRMED",
            "items.productId": productId
        });

        res.json({ canReview: !!orderRecord });
    } catch (error) {
        console.error("canReviewProduct error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};
