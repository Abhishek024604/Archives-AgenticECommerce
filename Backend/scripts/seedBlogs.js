import dotenv from "dotenv"
import mongoose from "mongoose"
import Blog from "../src/models/Blog.model.js"
import User from "../src/models/User.model.js"
import { createBlogService } from "../src/services/blogService.js"

dotenv.config()

const blogs = [
    {
        title: "The History of the Trench",
        subtitle: "A study in utility, weather, and enduring silhouette.",
        excerpt: "From the damp trenches of the Somme to the rain-slicked streets of mid-century cinema, the gabardine shield remains a symbol of utilitarian grace.",
        category: "Outerwear",
        coverImage: "https://images.unsplash.com/photo-1520975954732-35dd22299614?auto=format&fit=crop&w=1400&q=80",
        tags: ["trench", "outerwear", "heritage"],
        content: "The trench coat began as a garment of necessity, engineered for wet weather, movement, and discipline. Its genius lies in details that still feel purposeful today: storm flaps, belted waists, epaulettes, and densely woven cotton gabardine.\n\nIn modern wardrobes it has moved beyond military origin into a quieter form of authority, pairing easily with tailoring, denim, or silk. The best examples are not loud. They earn attention through proportion, patina, and the confidence of a garment built to survive more than one season."
    },
    {
        title: "Silk: A Weaver's Legacy",
        subtitle: "Tracing the delicate thread from ancient looms to contemporary ateliers.",
        excerpt: "A study in tactile memory, tracing the delicate thread from the mulberry groves of the East to the modern atelier.",
        category: "Textiles",
        coverImage: "https://images.unsplash.com/photo-1528459105426-b9548367069b?auto=format&fit=crop&w=1400&q=80",
        tags: ["silk", "textiles", "craft"],
        content: "Silk is less a fabric than a discipline. Every stage, from cultivation to spinning and finishing, carries the patience of hands that understand tension, light, and time. Its surface changes with movement, catching shadow as readily as shine.\n\nContemporary designers return to silk because it refuses to be simplified. It can be austere in a bias-cut dress, ceremonial in a scarf, or quietly practical as a lining that lets a jacket move with the body. To wear silk well is to respect both fragility and strength."
    },
    {
        title: "Sustainable Sartorialism",
        subtitle: "How careful material choices become a long-term wardrobe philosophy.",
        excerpt: "Redefining longevity in an era of ephemeral trends: how we build wardrobes that outlive the season.",
        category: "Sustainability",
        coverImage: "https://images.unsplash.com/photo-1508186225823-0963cf9ab0de?auto=format&fit=crop&w=1400&q=80",
        tags: ["sustainability", "wardrobe", "materials"],
        content: "Sustainability begins before a garment is purchased. It starts with asking whether the object has enough clarity, construction, and emotional permanence to remain useful. A responsible wardrobe is not only made of organic fibers or recycled trims; it is edited with restraint.\n\nMending, tailoring, resale, and careful storage all matter. The most sustainable piece is often the one that avoids obsolescence through better pattern work, honest material, and a silhouette that does not rely on novelty to feel alive."
    },
    {
        title: "Timeless Horology and the Cuff",
        subtitle: "The small architecture of watches, sleeves, and proportion.",
        excerpt: "A close look at how watches and cuffs frame the hand, carrying rhythm, ritual, and restraint into daily dress.",
        category: "Accessories",
        coverImage: "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&w=1400&q=80",
        tags: ["watches", "accessories", "tailoring"],
        content: "A watch is one of the few accessories that combines instrument and ornament. Its success depends on scale. The cuff must break cleanly, the case must sit without shouting, and the strap should converse with the leather and metal already present in the outfit.\n\nVintage horology teaches restraint because older cases were often smaller, thinner, and more exacting. Worn with tailoring, a watch becomes a punctuation mark rather than a headline, measuring not only time but the wearer's appetite for proportion."
    },
    {
        title: "Monochrome Matters",
        subtitle: "The quiet force of a single tonal wardrobe.",
        excerpt: "The profound impact of a single-tone wardrobe on the psychological presence of the wearer.",
        category: "Styling",
        coverImage: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=1400&q=80",
        tags: ["styling", "monochrome", "minimalism"],
        content: "Monochrome dressing is frequently mistaken for simplicity. In practice, it demands sharper attention to texture, weight, and temperature. A charcoal wool coat, a washed cotton shirt, and a polished leather shoe may share a tonal family while carrying entirely different surfaces.\n\nThis is where depth appears. Without color contrast to carry the composition, fit and material must do more of the work. The reward is presence without noise, a wardrobe language that feels edited, deliberate, and remarkably durable."
    }
]

const seedBlogs = async () => {
    await mongoose.connect(process.env.MONGODB_URI)

    const seller = await User.findOne({ role: "seller" })

    if (!seller) {
        throw new Error("No seller account found. Create a seller before seeding blogs.")
    }

    const created = []
    const skipped = []

    for (const blogData of blogs) {
        const existing = await Blog.findOne({ title: blogData.title })

        if (existing) {
            skipped.push(blogData.title)
            continue
        }

        const blog = await createBlogService(blogData, seller)
        created.push(blog.title)
    }

    console.log(JSON.stringify({
        seller: {
            id: seller._id,
            name: seller.name,
            storeName: seller.sellerInfo?.storeName
        },
        created,
        skipped
    }, null, 2))
}

seedBlogs()
    .catch((error) => {
        console.error(error.message)
        process.exitCode = 1
    })
    .finally(async () => {
        await mongoose.disconnect()
    })
