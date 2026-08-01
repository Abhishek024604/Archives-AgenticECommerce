import mongoose from "mongoose";
import Product from "../models/Product.model.js";
import "../models/User.model.js";
import {
    validateProductInput,
    validateProductUpdate
} from "../utils/productValidation.js";

const PRODUCT_SEARCH_INDEX = process.env.PRODUCT_SEARCH_INDEX || "product_search";
const ATLAS_SEARCH_STRICT = process.env.ATLAS_SEARCH_STRICT === "true";

const normalizeSearchTerm = (value) =>
    String(value || "")
        .trim()
        .replace(/\s+/g, " ")
        .slice(0, 80);

const productPopulate = { path: "seller", select: "name email" };

const productProjection = {
    brandName: 1,
    productName: 1,
    category: 1,
    subCategory: 1,
    price: 1,
    rating: 1,
    totalRatings: 1,
    discount: 1,
    images: 1,
    variants: 1,
    seller: 1,
    createdAt: 1,
    updatedAt: 1
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");


const buildProductSearchPipeline = (query, limit) => [
    {
        $search: {
            index: PRODUCT_SEARCH_INDEX,
            compound: {
                should: [
                    {
                        phrase: {
                            query,
                            path: "productName",
                            slop: 1,
                            score: { boost: { value: 12 } }
                        }
                    },
                    {
                        autocomplete: {
                            query,
                            path: "productName",
                            tokenOrder: "sequential",
                            fuzzy: { maxEdits: 1, prefixLength: 2 },
                            score: { boost: { value: 9 } }
                        }
                    },
                    {
                        autocomplete: {
                            query,
                            path: "brandName",
                            tokenOrder: "sequential",
                            fuzzy: { maxEdits: 1, prefixLength: 2 },
                            score: { boost: { value: 6 } }
                        }
                    },
                    {
                        text: {
                            query,
                            path: "productName",
                            fuzzy: { maxEdits: 2, prefixLength: 2, maxExpansions: 50 },
                            score: { boost: { value: 5 } }
                        }
                    },
                    {
                        text: {
                            query,
                            path: "brandName",
                            fuzzy: { maxEdits: 1, prefixLength: 2, maxExpansions: 25 },
                            score: { boost: { value: 3 } }
                        }
                    }
                ],
                minimumShouldMatch: 1
            }
        }
    },
    {
        $addFields: {
            searchScore: { $meta: "searchScore" }
        }
    },
    {
        $sort: {
            searchScore: -1,
            rating: -1,
            totalRatings: -1,
            createdAt: -1
        }
    },
    { $limit: limit },
    { $project: { ...productProjection, searchScore: 1 } }
];

const hydrateProductSellers = async (products) => Product.populate(products, productPopulate);

const fallbackProductSearch = async (query, limit, category, subCategory) => {
    const filter = {};
    if (query) {
        const pattern = new RegExp(escapeRegex(query), "i");
        filter.$or = [
            { productName: pattern },
            { brandName: pattern }
        ];
    }
    if (category) {
        filter.category = String(category).toLowerCase();
    }
    if (subCategory) {
        const subCats = String(subCategory).toLowerCase().split(",").map(s => s.trim());
        filter.subCategory = { $in: subCats };
    }

    const products = await Product.find(filter)
    .sort({ rating: -1, totalRatings: -1, createdAt: -1 })
    .limit(limit)
    .populate(productPopulate);

    return products;
};

export const createProductService = async (data, user) => {

    if (user.role !== "seller") {
        throw new Error("Only sellers can create products");
    }

    validateProductInput(data);

    return await Product.create({
        ...data,
        seller: user._id
    });
};

export const getAllProductsService = async ({ q, category, subCategory, limit = 1000, filter: listFilter } = {}) => {
    const query = normalizeSearchTerm(q);
    const resultLimit = Math.min(Math.max(Number(limit) || 1000, 1), 5000);

    const filterObj = {};
    if (category) {
        filterObj.category = String(category).toLowerCase();
    }
    if (subCategory) {
        const subCats = String(subCategory).toLowerCase().split(",").map(s => s.trim());
        filterObj.subCategory = { $in: subCats };
    }

    if (!query) {
        if (listFilter === "bestsellers") {
            const bestSellers = await Product.aggregate([
                { $match: { ...filterObj, "variants.stock": { $gt: 0 } } }, // Must be in stock
                { $addFields: {
                    bestsellerScore: {
                        $add: [
                            { $multiply: [{ $ifNull: ["$salesCount", 0] }, 0.6] }, // 60% weight to sales
                            { $multiply: [ 
                                { $divide: [{ $ifNull: ["$rating", 0] }, 5] }, 
                                { $min: [{ $ifNull: ["$totalRatings", 0] }, 100] }, 
                                0.3 
                            ]}, // 30% weight to rating momentum
                            { $multiply: [{ $ifNull: ["$discount", 0] }, 0.1] } // 10% weight to discount offering
                        ]
                    }
                }},
                { $sort: { bestsellerScore: -1, createdAt: -1 } },
                { $limit: resultLimit }
            ]);
            
            return await hydrateProductSellers(bestSellers);
        }

        if (listFilter === "new") {
            const newArrivals = await Product.aggregate([
                { $match: { ...filterObj, "variants.stock": { $gt: 0 } } }, // Must be in stock
                { $addFields: {
                    newnessScore: {
                        $add: [
                            { $toLong: "$createdAt" }, // Primary driver: timestamp
                            { $multiply: [{ $ifNull: ["$rating", 0] }, 86400000] }, // Rating gives a time-equivalent boost (e.g. 1 rating point = 1 day boost)
                            { $multiply: [{ $ifNull: ["$discount", 0] }, 3600000] } // Discount gives a smaller time-equivalent boost (e.g. 1% discount = 1 hour boost)
                        ]
                    }
                }},
                { $sort: { newnessScore: -1 } },
                { $limit: resultLimit }
            ]);
            
            return await hydrateProductSellers(newArrivals);
        }
        
        return await Product.find(filterObj)
            .sort({ createdAt: -1 })
            .limit(resultLimit)
            .populate(productPopulate);
    }

    try {
        const products = await Product.aggregate(buildProductSearchPipeline(query, resultLimit));

        let filtered = products;
        if (category) {
            filtered = filtered.filter(p => String(p.category || "").toLowerCase() === String(category).toLowerCase());
        }
        if (subCategory) {
            const subCats = String(subCategory).toLowerCase().split(",").map(s => s.trim());
            filtered = filtered.filter(p => subCats.includes(String(p.subCategory || "").toLowerCase()));
        }

        if (filtered.length === 0 && !ATLAS_SEARCH_STRICT) {
            return fallbackProductSearch(query, resultLimit, category, subCategory);
        }

        return await hydrateProductSellers(filtered);
    } catch (error) {
        if (ATLAS_SEARCH_STRICT) {
            throw error;
        }

        return fallbackProductSearch(query, resultLimit, category, subCategory);
    }
};

export const getProductSuggestionsService = async ({ q, limit = 8 } = {}) => {
    const query = normalizeSearchTerm(q);
    const resultLimit = Math.min(Math.max(Number(limit) || 8, 1), 12);

    if (!query) {
        return [];
    }

    try {
        const suggestions = await Product.aggregate([
            {
                $search: {
                    index: PRODUCT_SEARCH_INDEX,
                    compound: {
                        should: [
                            {
                                autocomplete: {
                                    query,
                                    path: "productName",
                                    tokenOrder: "sequential",
                                    fuzzy: { maxEdits: 1, prefixLength: 2 },
                                    score: { boost: { value: 8 } }
                                }
                            },
                            {
                                autocomplete: {
                                    query,
                                    path: "brandName",
                                    tokenOrder: "sequential",
                                    fuzzy: { maxEdits: 1, prefixLength: 2 },
                                    score: { boost: { value: 4 } }
                                }
                            }
                        ],
                        minimumShouldMatch: 1
                    }
                }
            },
            {
                $project: {
                    _id: 1,
                    brandName: 1,
                    productName: 1,
                    images: 1,
                    price: 1,
                    totalRatings: 1,
                    searchScore: { $meta: "searchScore" }
                }
            },
            { $sort: { searchScore: -1, totalRatings: -1 } },
            { $limit: resultLimit }
        ]);

        if (suggestions.length === 0 && !ATLAS_SEARCH_STRICT) {
            const fallbackSuggestions = await fallbackProductSearch(query, resultLimit);
            return fallbackSuggestions.map((product) => ({
                _id: product._id,
                brandName: product.brandName,
                productName: product.productName,
                images: product.images,
                price: product.price
            }));
        }

        return suggestions;
    } catch (error) {
        if (ATLAS_SEARCH_STRICT) {
            throw error;
        }

        const suggestions = await fallbackProductSearch(query, resultLimit);
        return suggestions.map((product) => ({
            _id: product._id,
            brandName: product.brandName,
            productName: product.productName,
            images: product.images,
            price: product.price
        }));
    }
};

export const getProductByIdService = async (id) => {

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error("Invalid product ID");
    }

    const product = await Product.findById(id).populate("seller", "name");

    if (!product) throw new Error("Product not found");

    return product;
};

export const updateProductService = async (id, data, user) => {

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error("Invalid product ID");
    }

    const product = await Product.findById(id);

    if (!product) throw new Error("Product not found");

    if (product.seller.toString() !== user._id.toString()) {
        throw new Error("Unauthorized");
    }

    validateProductUpdate(data);

    const allowedFields = [
        "brandName",
        "productName",
        "category",
        "subCategory",
        "price",
        "discount",
        "images",
        "variants"
    ];

    allowedFields.forEach((field) => {
        if (data[field] !== undefined) {
            product[field] = data[field];
        }
    });

    await product.save();

    return product;
};

export const deleteProductService = async (id, user) => {

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error("Invalid product ID");
    }

    const product = await Product.findById(id);

    if (!product) throw new Error("Product not found");

    if (product.seller.toString() !== user._id.toString()) {
        throw new Error("Unauthorized");
    }

    await product.deleteOne();

    return { message: "Product deleted" };
};
