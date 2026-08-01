import mongoose from "mongoose";
import dotenv from "dotenv";
import connectDB from "./src/config/db.js";
import Review from "./src/models/Review.model.js";
import User from "./src/models/User.model.js";
import Product from "./src/models/Product.model.js";
import Order from "./src/models/Order.model.js";

dotenv.config();

const seedReviews = async () => {
  try {
    await connectDB();
    console.log("Connected to DB, looking for a seller and products...");

    const seller = await User.findOne({ role: "seller" });
    if (!seller) {
      console.log("No seller found in DB, aborting seed.");
      process.exit();
    }

    const products = await Product.find({ seller: seller._id }).limit(5);
    if (products.length === 0) {
      console.log("No products found for seller, aborting seed.");
      process.exit();
    }

    const customers = await User.find({ _id: { $ne: seller._id } }).limit(5);
    if (customers.length === 0) {
      console.log("No customers found, aborting seed.");
      process.exit();
    }

    const orders = await Order.find({ "items.productId": { $in: products.map(p => p._id) } }).limit(5);

    console.log(`Found seller: ${seller.name}, ${products.length} products, ${customers.length} customers.`);

    const mockReviews = [
      {
        product: products[0]._id,
        seller: seller._id,
        customer: customers[0]._id,
        rating: 5,
        comment: "Excellent quality and perfect fit. Really happy with the purchase!",
        media: ["https://images.unsplash.com/photo-1596755094514-f87e32f85e2c?w=150&h=150&fit=crop", "https://images.unsplash.com/photo-1596755094514-f87e32f85e2c?w=150&h=150&fit=crop"],
        status: "Published",
        order: orders[0]?._id
      },
      {
        product: products[1]?._id || products[0]._id,
        seller: seller._id,
        customer: customers[1]?._id || customers[0]._id,
        rating: 4,
        comment: "Good product but the color was slightly different from images.",
        media: [],
        status: "Published",
        order: orders[1]?._id || orders[0]?._id
      },
      {
        product: products[2]?._id || products[0]._id,
        seller: seller._id,
        customer: customers[2]?._id || customers[0]._id,
        rating: 2,
        comment: "Worst experience. Poor quality fabric and late delivery.",
        media: [],
        status: "Pending",
        order: orders[2]?._id || orders[0]?._id
      },
      {
        product: products[3]?._id || products[0]._id,
        seller: seller._id,
        customer: customers[3]?._id || customers[0]._id,
        rating: 5,
        comment: "Amazing product! Worth every penny.",
        media: ["https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=150&h=150&fit=crop"],
        status: "Published",
        order: orders[3]?._id || orders[0]?._id
      },
      {
        product: products[4]?._id || products[0]._id,
        seller: seller._id,
        customer: customers[4]?._id || customers[0]._id,
        rating: 3,
        comment: "Average quality. Packaging was good though.",
        media: [],
        status: "Hidden",
        order: orders[4]?._id || orders[0]?._id
      }
    ];

    await Review.insertMany(mockReviews);
    console.log("Successfully seeded reviews!");

    // Update product ratings
    for (const p of products) {
        const allReviews = await Review.find({ product: p._id, status: "Published" });
        if (allReviews.length > 0) {
            const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
            p.rating = totalRating / allReviews.length;
            p.totalRatings = allReviews.length;
            await p.save();
        }
    }

    process.exit();
  } catch (error) {
    console.error("Error seeding reviews:", error);
    process.exit(1);
  }
};

seedReviews();
