import dotenv from "dotenv"
import mongoose from "mongoose"
import bcrypt from "bcrypt"
import path from "path"
import { mkdir, writeFile } from "fs/promises"
import Product from "../src/models/Product.model.js"
import User from "../src/models/User.model.js"
import { createProductService } from "../src/services/productService.js"

dotenv.config()

const publicBaseUrl = process.env.PUBLIC_BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`
const imageFolder = "products/seed-products"
const imageDirectory = path.join(process.cwd(), "uploads", imageFolder)

const slugify = (value) =>
    value
        .toLowerCase()
        .replace(/&/g, "and")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")

const escapeXml = (value) =>
    String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;")

const imagePaletteByType = {
    apparel: ["#f4efe7", "#6f5e52", "#1f2933"],
    footwear: ["#ece7df", "#4c3f36", "#14181f"],
    accessory: ["#eef1f4", "#56606a", "#20242a"],
    bag: ["#f1eadf", "#7a5a3a", "#26221f"],
    jewelry: ["#f5f0e1", "#b89245", "#2f2a20"]
}

const fileNameForImage = (brandName, productName, view) =>
    `${slugify(`${brandName}-${productName}`)}-${view}.svg`

const publicImageUrl = (brandName, productName, view) =>
    `${publicBaseUrl}/uploads/${imageFolder}/${fileNameForImage(brandName, productName, view)}`

const renderSilhouette = (type, accent, ink) => {
    if (type === "footwear") {
        return `
            <path d="M225 720c82 48 211 48 331 24 86-17 162-17 215 12 42 23 59 60 43 88-15 27-59 42-118 42H271c-73 0-130-36-130-83 0-38 34-71 84-83Z" fill="${accent}"/>
            <path d="M245 704c80 35 182 38 296 15 62-13 117-11 166 8-56-71-117-111-197-127-95 26-191 58-265 104Z" fill="${ink}" opacity=".9"/>
        `
    }

    if (type === "bag") {
        return `
            <path d="M300 385c0-92 70-155 150-155s150 63 150 155" fill="none" stroke="${ink}" stroke-width="34" stroke-linecap="round"/>
            <rect x="215" y="365" width="470" height="455" rx="46" fill="${accent}"/>
            <path d="M265 450h370v300H265z" fill="${ink}" opacity=".12"/>
        `
    }

    if (type === "jewelry") {
        return `
            <circle cx="450" cy="570" r="165" fill="none" stroke="${accent}" stroke-width="48"/>
            <circle cx="450" cy="570" r="86" fill="none" stroke="${ink}" stroke-width="18" opacity=".85"/>
            <circle cx="450" cy="350" r="42" fill="${accent}"/>
        `
    }

    if (type === "accessory") {
        return `
            <rect x="250" y="395" width="400" height="150" rx="74" fill="${accent}"/>
            <circle cx="355" cy="470" r="82" fill="${ink}" opacity=".88"/>
            <circle cx="545" cy="470" r="82" fill="${ink}" opacity=".88"/>
            <path d="M250 735h400" stroke="${accent}" stroke-width="56" stroke-linecap="round"/>
        `
    }

    return `
        <path d="M370 240h160l70 85 120 43-59 156-72-25v356H311V499l-72 25-59-156 120-43 70-85Z" fill="${accent}"/>
        <path d="M372 240c17 52 43 79 78 79s61-27 78-79" fill="none" stroke="${ink}" stroke-width="22" stroke-linecap="round"/>
        <path d="M311 500h278v355H311z" fill="${ink}" opacity=".08"/>
    `
}

const renderProductSvg = ({ brandName, productName, imageSubject, variantType }, view) => {
    const [background, accent, ink] = imagePaletteByType[variantType]
    const subject = imageSubject.replace(/\bfashion\b|\bmenswear\b|\bfootwear\b|\bactivewear\b|\bshoes\b|\bjewelry\b/gi, "").trim()

    return `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1200" viewBox="0 0 900 1200" role="img" aria-label="${escapeXml(`${brandName} ${productName}`)}">
        <rect width="900" height="1200" fill="${background}"/>
        <rect x="58" y="58" width="784" height="1084" fill="none" stroke="${ink}" stroke-opacity=".14" stroke-width="2"/>
        <g transform="translate(0 ${view === 2 ? 18 : view === 3 ? -12 : 0})">
            ${renderSilhouette(variantType, accent, ink)}
        </g>
        <text x="450" y="980" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="38" fill="${ink}">${escapeXml(productName)}</text>
        <text x="450" y="1035" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" font-weight="700" letter-spacing="5" fill="${ink}" opacity=".72">${escapeXml(brandName.toUpperCase())}</text>
        <text x="450" y="1084" text-anchor="middle" font-family="Arial, sans-serif" font-size="17" fill="${ink}" opacity=".58">${escapeXml(subject || productName)} - view ${view}</text>
    </svg>`
}

const variantsByType = {
    apparel: [
        { size: "XS", stock: 8 },
        { size: "S", stock: 16 },
        { size: "M", stock: 24 },
        { size: "L", stock: 18 },
        { size: "XL", stock: 10 }
    ],
    footwear: [
        { size: "UK 6", stock: 7 },
        { size: "UK 7", stock: 12 },
        { size: "UK 8", stock: 18 },
        { size: "UK 9", stock: 14 },
        { size: "UK 10", stock: 9 }
    ],
    accessory: [
        { size: "One Size", stock: 30 }
    ],
    bag: [
        { size: "Small", stock: 10 },
        { size: "Medium", stock: 18 },
        { size: "Large", stock: 8 }
    ],
    jewelry: [
        { size: "One Size", stock: 20 },
        { size: "Adjustable", stock: 14 }
    ]
}

const catalog = [
    ["Aster & Co.", "Linen Camp Collar Shirt", 2499, 4.4, 118, 12, "linen shirt fashion", "apparel"],
    ["Aster & Co.", "Raw Linen Shirt", 7200, 4.6, 126, 12, "raw linen shirt fashion", "apparel"],
    ["Aster & Co.", "Oxford Button Down Shirt", 2799, 4.5, 94, 10, "oxford shirt menswear", "apparel"],
    ["Aster & Co.", "Textured Knit Polo", 3199, 4.3, 77, 8, "knit polo fashion", "apparel"],
    ["Aster & Co.", "Relaxed Cotton Tee", 1299, 4.2, 201, 5, "cotton t shirt fashion", "apparel"],
    ["North Loom", "Washed Denim Jacket", 5499, 4.7, 142, 15, "denim jacket fashion", "apparel"],
    ["North Loom", "Raw Hem Straight Jeans", 3999, 4.4, 165, 10, "straight jeans fashion", "apparel"],
    ["North Loom", "Pleated Wide Leg Trousers", 4299, 4.6, 98, 12, "wide leg trousers fashion", "apparel"],
    ["North Loom", "Corduroy Overshirt", 4599, 4.5, 83, 14, "corduroy overshirt fashion", "apparel"],
    ["Vale Studio", "Wool Blend Overcoat", 8999, 4.8, 62, 18, "wool overcoat fashion", "apparel"],
    ["Vale Studio", "Structured Wool Coat", 14800, 4.8, 74, 10, "structured wool coat fashion", "apparel"],
    ["Vale Studio", "Quilted Utility Jacket", 6799, 4.6, 71, 16, "quilted jacket fashion", "apparel"],
    ["Vale Studio", "Double Breasted Blazer", 7499, 4.7, 55, 10, "double breasted blazer", "apparel"],
    ["Vale Studio", "Tailored Waistcoat", 3499, 4.2, 39, 8, "tailored waistcoat fashion", "apparel"],
    ["Mira Atelier", "Silk Slip Dress", 6999, 4.8, 120, 20, "silk slip dress fashion", "apparel"],
    ["Mira Atelier", "Pleated Midi Skirt", 3799, 4.5, 110, 12, "pleated midi skirt fashion", "apparel"],
    ["Mira Atelier", "Ribbed Knit Dress", 4599, 4.4, 87, 10, "ribbed knit dress fashion", "apparel"],
    ["Mira Atelier", "Wrap Front Blouse", 2899, 4.3, 132, 9, "wrap blouse fashion", "apparel"],
    ["Saffron Thread", "Hand Block Printed Kurta", 3299, 4.7, 156, 12, "printed kurta fashion", "apparel"],
    ["Saffron Thread", "Chanderi Dupatta", 2299, 4.6, 88, 7, "chanderi dupatta fashion", "accessory"],
    ["Saffron Thread", "Cotton Anarkali Set", 5999, 4.8, 74, 15, "anarkali dress fashion", "apparel"],
    ["Saffron Thread", "Embroidered Nehru Jacket", 4999, 4.5, 46, 10, "nehru jacket fashion", "apparel"],
    ["Terra Trail", "Canvas Field Sneakers", 3599, 4.3, 190, 18, "canvas sneakers shoes", "footwear"],
    ["Terra Trail", "Leather Derby Shoes", 6499, 4.6, 84, 10, "leather derby shoes", "footwear"],
    ["Terra Trail", "Suede Chelsea Boots", 7499, 4.7, 61, 14, "suede chelsea boots", "footwear"],
    ["Terra Trail", "Signature Chelsea Boot", 16900, 4.7, 83, 10, "signature chelsea boot footwear", "footwear"],
    ["Terra Trail", "Minimal Slide Sandals", 2199, 4.1, 143, 6, "slide sandals footwear", "footwear"],
    ["Civic Form", "Structured Tote Bag", 4299, 4.6, 98, 12, "structured tote bag", "bag"],
    ["Civic Form", "Pebbled Leather Crossbody", 5499, 4.7, 73, 15, "leather crossbody bag", "bag"],
    ["Civic Form", "Nylon Sling Pack", 2499, 4.2, 169, 8, "nylon sling bag", "bag"],
    ["Civic Form", "Canvas Weekend Duffel", 5999, 4.5, 57, 10, "canvas duffel bag", "bag"],
    ["Oris Lane", "Aviator Sunglasses", 1999, 4.4, 215, 20, "aviator sunglasses", "accessory"],
    ["Oris Lane", "Acetate Square Sunglasses", 2499, 4.5, 131, 15, "square sunglasses fashion", "accessory"],
    ["Oris Lane", "Leather Belt", 1799, 4.3, 189, 10, "leather belt fashion", "accessory"],
    ["Oris Lane", "Silk Pocket Square", 1199, 4.2, 68, 5, "silk pocket square", "accessory"],
    ["Hour & Hide", "Minimal Steel Watch", 7999, 4.7, 101, 12, "minimal wrist watch", "accessory"],
    ["Hour & Hide", "Leather Strap Chronograph", 9999, 4.8, 89, 10, "chronograph watch", "accessory"],
    ["Hour & Hide", "Braided Leather Bracelet", 1299, 4.1, 112, 8, "leather bracelet fashion", "jewelry"],
    ["Hour & Hide", "Signet Ring", 1599, 4.2, 76, 6, "signet ring jewelry", "jewelry"],
    ["Nava Home", "Waffle Knit Lounge Set", 3999, 4.5, 93, 14, "waffle lounge set fashion", "apparel"],
    ["Nava Home", "Organic Cotton Joggers", 2999, 4.4, 157, 9, "cotton joggers fashion", "apparel"],
    ["Nava Home", "Merino Lounge Cardigan", 5499, 4.6, 64, 12, "merino cardigan fashion", "apparel"],
    ["Nava Home", "Soft Fleece Hoodie", 3499, 4.5, 178, 15, "fleece hoodie fashion", "apparel"],
    ["Rove Active", "Seamless Training Tee", 1699, 4.3, 210, 10, "training t shirt activewear", "apparel"],
    ["Rove Active", "Compression Leggings", 2899, 4.4, 186, 12, "compression leggings activewear", "apparel"],
    ["Rove Active", "Lightweight Running Shorts", 1999, 4.2, 144, 8, "running shorts activewear", "apparel"],
    ["Rove Active", "Water Repellent Windbreaker", 4999, 4.6, 70, 16, "windbreaker jacket activewear", "apparel"],
    ["Dusk Edit", "Satin Evening Top", 3299, 4.4, 86, 10, "satin evening top fashion", "apparel"],
    ["Dusk Edit", "Velvet Party Blazer", 6999, 4.7, 49, 14, "velvet blazer fashion", "apparel"],
    ["Dusk Edit", "Metallic Clutch", 2999, 4.5, 91, 12, "metallic clutch bag", "bag"],
    ["Dusk Edit", "Crystal Drop Earrings", 1899, 4.3, 127, 7, "drop earrings jewelry", "jewelry"],
    ["Monsoon Craft", "Rain Trench Coat", 6299, 4.6, 68, 15, "trench coat fashion", "apparel"],
    ["Monsoon Craft", "Rubber Sole Rain Boots", 3999, 4.2, 103, 10, "rain boots footwear", "footwear"]
]

const products = catalog.map(([
    brandName,
    productName,
    price,
    rating,
    totalRatings,
    discount,
    imageSlug,
    variantType
]) => ({
    brandName,
    productName,
    price,
    rating,
    totalRatings,
    discount,
    images: [1, 2, 3].map((view) => publicImageUrl(brandName, productName, view)),
    variants: variantsByType[variantType],
    imageSubject: imageSlug,
    variantType
}))

const writeProductImages = async () => {
    await mkdir(imageDirectory, { recursive: true })

    for (const product of products) {
        for (const view of [1, 2, 3]) {
            const filePath = path.join(imageDirectory, fileNameForImage(product.brandName, product.productName, view))
            await writeFile(filePath, renderProductSvg(product, view), "utf8")
        }
    }
}

const productPayload = ({ imageSubject, variantType, ...product }) => product

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
    await writeProductImages()

    const seller = await findOrCreateSeedSeller()
    const created = []
    const updated = []

    for (const productData of products) {
        const data = productPayload(productData)
        const existing = await Product.findOne({
            productName: data.productName,
            brandName: data.brandName
        })

        if (existing) {
            existing.set({
                ...data,
                seller: existing.seller || seller._id
            })
            await existing.save()
            updated.push(`${data.brandName} ${data.productName}`)
            continue
        }

        const product = await createProductService(data, seller)
        created.push(`${product.brandName} ${product.productName}`)
    }

    console.log(JSON.stringify({
        seller: {
            id: seller._id,
            name: seller.name,
            storeName: seller.sellerInfo?.storeName
        },
        requested: products.length,
        created: created.length,
        updated: updated.length,
        imagesWritten: products.length * 3,
        createdProducts: created,
        updatedProducts: updated
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
