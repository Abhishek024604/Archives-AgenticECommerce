import mongoose from "mongoose";
import dotenv from "dotenv";
import connectDB from "./src/config/db.js";
import Product from "./src/models/Product.model.js";
import User from "./src/models/User.model.js";

dotenv.config();

const brands = ["Myntra", "Flipkart", "H&M", "Meesho", "Ajio", "Pantaloons"];

const categoryData = {
  women: {
    images: [
      "/assets/clean_hero4.png",
      "/assets/clean_hero4.png",
      "/assets/clean_hero4.png",
      "/assets/clean_hero4.png"
    ],
    items: ["Summer Dress", "Casual Tunic", "Floral Maxi", "Cotton Kurta", "Denim Jacket"]
  },
  men: {
    images: [
      "/assets/clean_hero4.png",
      "/assets/clean_hero4.png",
      "/assets/clean_hero4.png",
      "/assets/clean_hero4.png"
    ],
    items: ["Classic Tailored Shirt", "Casual Chinos", "Graphic T-Shirt", "Linen Blend Blazer", "Puffer Jacket"]
  },
  shoes: {
    images: [
      "/assets/clean_hero4.png",
      "/assets/clean_hero4.png",
      "/assets/clean_hero4.png",
      "/assets/clean_hero4.png"
    ],
    items: ["Running Sneakers", "Leather Loafers", "Canvas Slip-ons", "Ankle Boots", "Sports Runners"]
  },
  bags: {
    images: [
      "/assets/clean_hero4.png",
      "/assets/clean_hero4.png",
      "/assets/clean_hero4.png",
      "/assets/clean_hero4.png"
    ],
    items: ["Leather Tote", "Crossbody Satchel", "Canvas Backpack", "Evening Clutch", "Weekender Duffel"]
  },
  perfumes: {
    images: [
      "/assets/clean_hero4.png",
      "/assets/clean_hero4.png",
      "/assets/clean_hero4.png",
      "/assets/clean_hero4.png"
    ],
    items: ["Eau de Parfum", "Citrus Cologne", "Floral Mist", "Woody Essence", "Signature Blend"]
  },
  accessories: {
    images: [
      "/assets/clean_hero4.png",
      "/assets/clean_hero4.png",
      "/assets/clean_hero4.png",
      "/assets/clean_hero4.png"
    ],
    items: ["Gold Plated Necklace", "Aviator Sunglasses", "Classic Watch", "Silk Scarf", "Leather Belt"]
  },
  lifestyle: {
    images: [
      "/assets/clean_hero4.png",
      "/assets/clean_hero4.png",
      "/assets/clean_hero4.png",
      "/assets/clean_hero4.png"
    ],
    items: ["Yoga Mat", "Minimalist Journal", "Ceramic Mug Set", "Woven Throw Blanket", "Aromatherapy Candles"]
  },
  home: {
    images: [
      "/assets/clean_hero4.png",
      "/assets/clean_hero4.png",
      "/assets/clean_hero4.png",
      "/assets/clean_hero4.png"
    ],
    items: ["Linen Cushions", "Geometric Vase", "Modern Table Lamp", "Cotton Bedding Set", "Decorative Tray"]
  }
};

const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
const getPrice = (min, max) => Math.floor(Math.random() * (max - min) + min);

const seedProducts = async () => {
  try {
    await connectDB();
    console.log("Connected to DB, preparing to reset and seed products...");

    const seller = await User.findOne({ role: "seller" });
    if (!seller) {
      console.log("No seller found in DB, aborting seed.");
      process.exit();
    }

    // Remove existing products
    await Product.deleteMany({ seller: seller._id });
    console.log("Existing products deleted.");

    const newProducts = [];
    
    // Generate products for each category
    for (const [category, data] of Object.entries(categoryData)) {
        for (let i = 0; i < 6; i++) {
            const brand = getRandom(brands);
            const itemName = getRandom(data.items);
            const basePrice = getPrice(499, 4999);
            
            newProducts.push({
                brandName: brand,
                productName: `${brand} ${itemName}`,
                category: category,
                price: basePrice,
                rating: 0,
                totalRatings: 0,
                discount: Math.floor(Math.random() * 50),
                salesCount: Math.floor(Math.random() * 1000),
                images: [
                    getRandom(data.images),
                    getRandom(data.images)
                ],
                variants: [
                    { size: "S", stock: getPrice(10, 100) },
                    { size: "M", stock: getPrice(10, 100) },
                    { size: "L", stock: getPrice(10, 100) }
                ],
                seller: seller._id
            });
        }
    }

    await Product.insertMany(newProducts);
    console.log(`Successfully seeded ${newProducts.length} high-quality product listings mapped to real categories and brands!`);

    process.exit();
  } catch (error) {
    console.error("Error seeding products:", error);
    process.exit(1);
  }
};

seedProducts();
