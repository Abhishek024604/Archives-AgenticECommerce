import dotenv from "dotenv"
import mongoose from "mongoose"
import bcrypt from "bcrypt"
import google from "googlethis"
import Product from "../src/models/Product.model.js"
import User from "../src/models/User.model.js"
import { createProductService } from "../src/services/productService.js"

dotenv.config()

const queries = [
    "men crew neck t shirt", "men oversized t shirt", "men polo t shirt", "men graphic t shirt",
    "men printed t shirt", "men solid t shirt", "men full sleeve t shirt", "men henley t shirt",
    "men casual shirt", "men formal shirt", "men linen shirt", "men checked shirt",
    "men striped shirt", "men denim shirt", "men oxford shirt", "men flannel shirt",
    "men slim fit shirt", "men slim fit jeans", "men regular fit jeans", "men relaxed fit jeans",
    "men baggy jeans", "men ripped jeans", "men black jeans", "men blue jeans",
    "men chinos", "men cargo pants", "men formal trousers", "men joggers",
    "men track pants", "men linen trousers", "men cotton trousers", "men cargo shorts",
    "men denim shorts", "men sports shorts", "men cotton shorts", "men gym shorts",
    "men bomber jacket", "men denim jacket", "men leather jacket", "men varsity jacket",
    "men puffer jacket", "men windcheater", "men blazer", "men hoodie",
    "men oversized hoodie", "men zip hoodie", "men sweatshirt", "men fleece hoodie",
    "men kurta", "men kurta pajama", "men sherwani", "men nehru jacket",
    "men pathani suit", "men sneakers", "men running shoes", "men casual shoes",
    "men loafers", "men formal shoes", "men boots", "men sandals",
    "men slippers", "men leather wallet", "men belt", "men sunglasses",
    "men wrist watch", "men cap", "men backpack", "men messenger bag",
    "men bracelet"
]

const brands = ['Levis', 'Zara', 'H&M', 'Nike', 'Adidas', 'Puma', 'Roadster', 'Polo Ralph Lauren', 'Tommy Hilfiger', 'Calvin Klein', 'Wrangler']

const toTitleCase = (str) => str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());

const getRandomPrice = () => Math.floor(Math.random() * (4999 - 999 + 1)) + 999;
const getRandomBrand = () => brands[Math.floor(Math.random() * brands.length)];
const getRandomRating = () => (Math.random() * (5.0 - 3.5) + 3.5).toFixed(1);

const delay = ms => new Promise(res => setTimeout(res, ms));

const findOrCreateSeedSeller = async () => {
    const existingSeller = await User.findOne({ role: "seller" })

    if (existingSeller) {
        return existingSeller
    }

    const password = await bcrypt.hash("SeedSeller@123", 10)

    return await User.create({
        role: "seller",
        name: "Seed Seller",
        email: "seed.seller@example.com",
        password,
        sellerInfo: {
            storeName: "Archive Seed Store",
            address: {
                locality: "Studio Lane",
                city: "Bengaluru",
                state: "Karnataka",
                pincode: 560001
            },
            contact: 9876543210
        }
    })
}

const seedProducts = async () => {
    if (!process.env.MONGODB_URI) {
        throw new Error("MONGODB_URI is not set")
    }

    await mongoose.connect(process.env.MONGODB_URI)

    const seller = await findOrCreateSeedSeller()
    const created = []

    console.log("Clearing old products...")
    await Product.deleteMany({})
    
    console.log(`Starting to seed ${queries.length} items...`)

    for (const query of queries) {
        console.log(`Scraping Google Images for: ${query}...`);
        
        let scrapedImages = [];
        try {
            // Using the user's exact query
            const searchQuery = `high quality ${query} fashion model photography`;
            const imageResults = await google.image(searchQuery, { safe: false });
            scrapedImages = imageResults.slice(0, 3).map(img => img.url);
        } catch (e) {
            console.error(`Failed to scrape images for ${query}`, e.message);
            // Fallback just in case
            scrapedImages = [
                `https://loremflickr.com/900/1200/fashion,model,mens?lock=${Math.floor(Math.random()*1000)}`
            ];
        }

        const title = toTitleCase(query);

const getCategoryForQuery = (query) => {
    const q = query.toLowerCase();
    if (q.includes("shoes") || q.includes("sneakers") || q.includes("loafers") || q.includes("boots") || q.includes("sandals") || q.includes("slippers")) return "shoes";
    if (q.includes("bag") || q.includes("wallet") || q.includes("backpack")) return "bags";
    if (q.includes("perfume") || q.includes("fragrance") || q.includes("scent")) return "perfumes";
    if (q.includes("watch") || q.includes("sunglasses") || q.includes("belt") || q.includes("cap") || q.includes("bracelet")) return "accessories";
    if (q.includes("women") || q.includes("dress") || q.includes("blouse") || q.includes("skirt")) return "women";
    if (q.includes("home") || q.includes("decor") || q.includes("interior") || q.includes("candle")) return "home";
    if (q.includes("lifestyle") || q.includes("travel")) return "lifestyle";
    return "men";
};

        // Map to our schema
        const productData = {
            brandName: getRandomBrand(),
            productName: title,
            category: getCategoryForQuery(query),
            price: getRandomPrice(),
            rating: Number(getRandomRating()),
            totalRatings: Math.floor(Math.random() * 200) + 10,
            discount: Math.floor(Math.random() * 50) + 10, // 10% to 60% discount
            images: scrapedImages.length > 0 ? scrapedImages : [`https://loremflickr.com/900/1200/fashion,model,mens?lock=${Math.floor(Math.random()*1000)}`],
            variants: [
                { size: "S", stock: 15 },
                { size: "M", stock: 30 },
                { size: "L", stock: 20 },
                { size: "XL", stock: 10 }
            ]
        }

        const product = await createProductService(productData, seller)
        created.push(`${product.brandName} ${product.productName}`)
        
        // Small delay to prevent google blocking us
        await delay(1500);
    }

    console.log(JSON.stringify({
        seller: {
            id: seller._id,
            name: seller.name,
            storeName: seller.sellerInfo?.storeName
        },
        requested: queries.length,
        created: created.length,
        createdProducts: created,
    }, null, 2))
}

seedProducts()
    .catch((error) => {
        console.error(error.message)
        process.exitCode = 1
    })
    .finally(async () => {
        await mongoose.disconnect()
    })
