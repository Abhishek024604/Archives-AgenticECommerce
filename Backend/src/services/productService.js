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

const tokenize = (value) =>
    normalizeSearchTerm(value)
        .toLowerCase()
        .split(" ")
        .filter(Boolean);

const getEditDistance = (left, right) => {
    const rows = left.length + 1;
    const columns = right.length + 1;
    const distances = Array.from({ length: rows }, () => Array(columns).fill(0));

    for (let row = 0; row < rows; row += 1) {
        distances[row][0] = row;
    }

    for (let column = 0; column < columns; column += 1) {
        distances[0][column] = column;
    }

    for (let row = 1; row < rows; row += 1) {
        for (let column = 1; column < columns; column += 1) {
            const substitutionCost = left[row - 1] === right[column - 1] ? 0 : 1;
            distances[row][column] = Math.min(
                distances[row - 1][column] + 1,
                distances[row][column - 1] + 1,
                distances[row - 1][column - 1] + substitutionCost
            );
        }
    }

    return distances[left.length][right.length];
};

const scoreFallbackProduct = (product, query) => {
    const queryTokens = tokenize(query);
    const searchable = `${product.brandName} ${product.productName}`.toLowerCase();
    const productTokens = tokenize(searchable);

    if (searchable.includes(query.toLowerCase())) {
        return 100;
    }

    let score = 0;

    for (const queryToken of queryTokens) {
        let bestTokenScore = 0;

        for (const productToken of productTokens) {
            if (productToken.startsWith(queryToken) || queryToken.startsWith(productToken)) {
                bestTokenScore = Math.max(bestTokenScore, 12);
                continue;
            }

            const distance = getEditDistance(queryToken, productToken);
            const sharedPrefixLength = [...queryToken].findIndex((char, index) => char !== productToken[index]);
            const commonPrefixLength = sharedPrefixLength === -1
                ? Math.min(queryToken.length, productToken.length)
                : sharedPrefixLength;
            const allowedEdits = queryToken.length <= 4 && commonPrefixLength < 2 ? 1 : 2;

            if (distance <= allowedEdits) {
                bestTokenScore = Math.max(bestTokenScore, 10 - distance * 2);
            }
        }

        score += bestTokenScore;
    }

    return score;
};

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

const fallbackProductSearch = async (query, limit) => {
    const pattern = new RegExp(escapeRegex(query), "i");
    const minimumFallbackScore = tokenize(query).length > 1 ? tokenize(query).length * 8 : 8;
    const products = await Product.find()
        .populate(productPopulate);

    return products
        .map((product) => ({
            product,
            fallbackScore: pattern.test(product.productName) || pattern.test(product.brandName)
                ? 100
                : scoreFallbackProduct(product, query)
        }))
        .filter(({ fallbackScore }) => fallbackScore >= minimumFallbackScore)
        .sort((left, right) => {
            if (right.fallbackScore !== left.fallbackScore) {
                return right.fallbackScore - left.fallbackScore;
            }

            if ((right.product.rating || 0) !== (left.product.rating || 0)) {
                return (right.product.rating || 0) - (left.product.rating || 0);
            }

            return (right.product.totalRatings || 0) - (left.product.totalRatings || 0);
        })
        .slice(0, limit)
        .map(({ product }) => product);
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

export const getAllProductsService = async ({ q, limit = 80 } = {}) => {
    const query = normalizeSearchTerm(q);
    const resultLimit = Math.min(Math.max(Number(limit) || 80, 1), 120);

    if (!query) {
        return await Product.find()
            .sort({ createdAt: -1 })
            .limit(resultLimit)
            .populate(productPopulate);
    }

    try {
        const products = await Product.aggregate(buildProductSearchPipeline(query, resultLimit));

        if (products.length === 0 && !ATLAS_SEARCH_STRICT) {
            return fallbackProductSearch(query, resultLimit);
        }

        return await hydrateProductSellers(products);
    } catch (error) {
        if (ATLAS_SEARCH_STRICT) {
            throw error;
        }

        return fallbackProductSearch(query, resultLimit);
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
