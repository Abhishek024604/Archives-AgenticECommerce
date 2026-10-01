/**
 * Store Tools for Tau Harness
 * Reference: https://twotimespi.dev/reference/tools/
 * 
 * Bridges domain logic directly into Tau's AgentTool format with error isolation.
 * Avoids fragile local HTTP-over-SSE loops while maintaining full capability.
 */

import { AgentTool, AgentToolResult, ToolRegistry } from './tauToolRegistry.js';
import { executeLucasTool } from '../services/lucasTools.js';
import { getAllProductsService, getProductByIdService } from '../services/productService.js';
import { getCartService, addToCartService, removeCartItemService } from '../services/cartService.js';
import { getMyOrdersService, placeOrderService } from '../services/orderService.js';
import Product from '../models/Product.model.js';

// ==========================================
// 1. SELLER TOOLS (LUCAS AGENT)
// ==========================================

export const createSellerToolRegistry = () => {
    const registry = new ToolRegistry();

    // 1. Overview
    registry.registerTool(new AgentTool({
        name: 'getSellerOverview',
        description: 'Get current high-level business metrics and inventory summary for this seller.',
        parameters: { type: 'object', properties: {} },
        category: 'seller',
        executeFn: async (args, context) => {
            const sellerId = context.sellerId || context.user?._id?.toString();
            if (!sellerId) return AgentToolResult.error('Seller ID required');
            const data = await executeLucasTool('getSellerOverview', args, sellerId);
            return AgentToolResult.success(JSON.stringify(data, null, 2));
        }
    }));

    // 2. Search Products
    registry.registerTool(new AgentTool({
        name: 'searchProducts',
        description: "Search this seller's products by product name, brand, or category.",
        parameters: {
            type: 'object',
            properties: {
                query: { type: 'string', description: 'Search term' }
            }
        },
        category: 'seller',
        executeFn: async (args, context) => {
            const sellerId = context.sellerId || context.user?._id?.toString();
            if (!sellerId) return AgentToolResult.error('Seller ID required');
            const data = await executeLucasTool('searchProducts', args, sellerId);
            return AgentToolResult.success(JSON.stringify(data, null, 2));
        }
    }));

    // 3. Inventory
    registry.registerTool(new AgentTool({
        name: 'getInventory',
        description: "Retrieve seller's inventory, optionally filtered by stock status (ALL, LOW, OUT).",
        parameters: {
            type: 'object',
            properties: {
                stockStatus: { type: 'string', enum: ['ALL', 'LOW', 'OUT'], description: 'Filter stock status' }
            }
        },
        category: 'seller',
        executeFn: async (args, context) => {
            const sellerId = context.sellerId || context.user?._id?.toString();
            if (!sellerId) return AgentToolResult.error('Seller ID required');
            const data = await executeLucasTool('getInventory', args, sellerId);
            return AgentToolResult.success(JSON.stringify(data, null, 2));
        }
    }));

    // 4. Orders
    registry.registerTool(new AgentTool({
        name: 'getOrders',
        description: "Fetch seller orders, optionally filtered by sellerStatus (ALL, PENDING, PROCESSED).",
        parameters: {
            type: 'object',
            properties: {
                status: { type: 'string', enum: ['ALL', 'PENDING', 'PROCESSED'] },
                limit: { type: 'number', description: 'Number of orders to retrieve' }
            }
        },
        category: 'seller',
        executeFn: async (args, context) => {
            const sellerId = context.sellerId || context.user?._id?.toString();
            if (!sellerId) return AgentToolResult.error('Seller ID required');
            const data = await executeLucasTool('getOrders', args, sellerId);
            return AgentToolResult.success(JSON.stringify(data, null, 2));
        }
    }));

    // 5. Revenue
    registry.registerTool(new AgentTool({
        name: 'getRevenue',
        description: 'Calculate gross sales, processed revenue, and pending payout figures for the seller.',
        parameters: { type: 'object', properties: {} },
        category: 'seller',
        executeFn: async (args, context) => {
            const sellerId = context.sellerId || context.user?._id?.toString();
            if (!sellerId) return AgentToolResult.error('Seller ID required');
            const data = await executeLucasTool('getRevenue', args, sellerId);
            return AgentToolResult.success(JSON.stringify(data, null, 2));
        }
    }));

    // 6. Customers
    registry.registerTool(new AgentTool({
        name: 'getCustomers',
        description: 'Retrieve unique customer profiles and purchase frequency for this seller.',
        parameters: {
            type: 'object',
            properties: {
                limit: { type: 'number' }
            }
        },
        category: 'seller',
        executeFn: async (args, context) => {
            const sellerId = context.sellerId || context.user?._id?.toString();
            if (!sellerId) return AgentToolResult.error('Seller ID required');
            const data = await executeLucasTool('getCustomers', args, sellerId);
            return AgentToolResult.success(JSON.stringify(data, null, 2));
        }
    }));

    // 7. Communities
    registry.registerTool(new AgentTool({
        name: 'getCommunities',
        description: 'View active Archivist Guild communities relevant to fashion & lifestyle.',
        parameters: { type: 'object', properties: {} },
        category: 'seller',
        executeFn: async (args, context) => {
            const sellerId = context.sellerId || context.user?._id?.toString();
            const data = await executeLucasTool('getCommunities', args, sellerId);
            return AgentToolResult.success(JSON.stringify(data, null, 2));
        }
    }));

    return registry;
};

// ==========================================
// 2. CHECKOUT & VISUAL COPILOT TOOLS
// ==========================================

const escapeRegex = (value) => String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const executeAdvancedProductSearch = async ({
    q,
    category,
    subCategory,
    brandName,
    minPrice,
    maxPrice,
    minRating,
    minDiscount,
    size,
    sortBy = "rating_desc",
    limit = 10
} = {}) => {
    const filter = {};

    // 1. Category filter (women, men, footwear, bags, perfumes, accessories, home & lifestyle)
    if (category && String(category).toLowerCase() !== 'all') {
        filter.category = String(category).toLowerCase().trim();
    }

    // 2. Subcategory filter
    if (subCategory && String(subCategory).trim()) {
        const subCatRegex = new RegExp(escapeRegex(String(subCategory).trim()), "i");
        filter.$or = [
            { subCategory: subCatRegex },
            { productName: subCatRegex }
        ];
    }

    // 3. Brand name filter
    if (brandName && String(brandName).trim()) {
        filter.brandName = new RegExp(escapeRegex(String(brandName).trim()), "i");
    }

    // 4. Price filters - exactly preserve user's price constraints
    if (minPrice != null || maxPrice != null) {
        filter.price = {};
        if (minPrice != null && !isNaN(Number(minPrice))) {
            filter.price.$gte = Number(minPrice);
        }
        if (maxPrice != null && !isNaN(Number(maxPrice))) {
            filter.price.$lte = Number(maxPrice);
        }
    }

    // 5. Rating filter
    if (minRating != null && !isNaN(Number(minRating))) {
        filter.rating = { $gte: Number(minRating) };
    }

    // 6. Discount filter
    if (minDiscount != null && !isNaN(Number(minDiscount))) {
        filter.discount = { $gte: Number(minDiscount) };
    }

    // 7. Size filter
    if (size && String(size).trim()) {
        filter.variants = {
            $elemMatch: {
                size: new RegExp(`^${escapeRegex(String(size).trim())}$`, "i"),
                stock: { $gt: 0 }
            }
        };
    }

    // 8. Keyword / Free-text query
    if (q && String(q).trim()) {
        const qRegex = new RegExp(escapeRegex(String(q).trim()), "i");
        if (filter.$or) {
            filter.$and = [
                { $or: filter.$or },
                {
                    $or: [
                        { productName: qRegex },
                        { brandName: qRegex },
                        { subCategory: qRegex }
                    ]
                }
            ];
            delete filter.$or;
        } else {
            filter.$or = [
                { productName: qRegex },
                { brandName: qRegex },
                { subCategory: qRegex }
            ];
        }
    }

    // 9. Sorting
    const sortObj = {};
    switch (sortBy) {
        case "price_asc":
            sortObj.price = 1;
            break;
        case "price_desc":
            sortObj.price = -1;
            break;
        case "rating_desc":
            sortObj.rating = -1;
            sortObj.totalRatings = -1;
            break;
        case "newest":
            sortObj.createdAt = -1;
            break;
        case "discount_desc":
            sortObj.discount = -1;
            break;
        default:
            sortObj.rating = -1;
            sortObj.totalRatings = -1;
            sortObj.createdAt = -1;
    }

    const maxLimit = Math.min(Math.max(Number(limit) || 10, 1), 30);

    const products = await Product.find(filter)
        .sort(sortObj)
        .limit(maxLimit)
        .populate("seller", "name")
        .lean();

    return {
        totalFound: products.length,
        appliedFilters: {
            category: category || "all",
            subCategory: subCategory || null,
            brandName: brandName || null,
            minPrice: minPrice ?? null,
            maxPrice: maxPrice ?? null,
            minRating: minRating ?? null,
            minDiscount: minDiscount ?? null,
            size: size || null,
            sortBy
        },
        products: products.map(p => ({
            id: p._id.toString(),
            _id: p._id.toString(),
            productName: p.productName,
            brandName: p.brandName,
            category: p.category,
            subCategory: p.subCategory,
            price: p.price,
            rating: p.rating || 0,
            totalRatings: p.totalRatings || 0,
            discount: p.discount || 0,
            image: p.images?.[0] || "",
            images: p.images || [],
            inStock: (p.variants || []).some(v => v.stock > 0),
            availableSizes: (p.variants || []).filter(v => v.stock > 0).map(v => v.size)
        }))
    };
};

export const createCheckoutToolRegistry = () => {
    const registry = new ToolRegistry();

    // 1. Search Catalog
    registry.registerTool(new AgentTool({
        name: 'search_products',
        description: `Search products in the e-commerce catalog. Use this when the user wants to find products, filter products, compare products, or browse products. Available product categories: women, men, footwear, bags, perfumes, accessories, home & lifestyle.`,
        parameters: {
            type: 'object',
            properties: {
                q: { type: 'string', description: 'Free-text search keyword or title phrase' },
                category: { 
                    type: 'string', 
                    enum: ['women', 'men', 'footwear', 'bags', 'perfumes', 'accessories', 'home & lifestyle', 'all'],
                    description: 'High-level department or product category'
                },
                subCategory: { 
                    type: 'string', 
                    description: 'Sub-category or garment type (e.g. shirt, t-shirt, blazer, jeans, jacket, dress, boots, sneakers, heels, sunglasses, belt, perfume)' 
                },
                brandName: { 
                    type: 'string', 
                    description: 'Brand name to filter by (e.g. Roadster, HRX, PETER ENGLAND, Zara, Gucci, Nike, Archivist)' 
                },
                minPrice: { 
                    type: 'number', 
                    description: 'Minimum price constraint in INR (preserve user constraint exactly)' 
                },
                maxPrice: { 
                    type: 'number', 
                    description: 'Maximum price constraint in INR (preserve user constraint exactly)' 
                },
                minRating: { 
                    type: 'number', 
                    description: 'Minimum rating threshold (0.0 to 5.0)' 
                },
                minDiscount: { 
                    type: 'number', 
                    description: 'Minimum discount percentage (0 to 100)' 
                },
                size: { 
                    type: 'string', 
                    description: 'Garment or shoe size to check in stock (e.g. S, M, L, XL, UK 7, UK 8, UK 9, 30, 32)' 
                },
                sortBy: { 
                    type: 'string', 
                    enum: ['price_asc', 'price_desc', 'rating_desc', 'newest', 'discount_desc', 'relevance'],
                    description: 'Sort criteria for matching products'
                },
                limit: { 
                    type: 'number', 
                    description: 'Maximum number of products to return (default 10)' 
                }
            }
        },
        category: 'checkout',
        executeFn: async (args) => {
            const result = await executeAdvancedProductSearch(args);
            return AgentToolResult.success(JSON.stringify(result, null, 2), {
                totalFound: result.totalFound,
                products: result.products
            });
        }
    }));

    // 2. Product Detail
    registry.registerTool(new AgentTool({
        name: 'get_product',
        description: 'Get product details, sizes, colors, and stock for a given product ID.',
        parameters: {
            type: 'object',
            properties: {
                productId: { type: 'string', description: 'MongoDB ObjectId of the product' }
            },
            required: ['productId']
        },
        category: 'checkout',
        executeFn: async (args) => {
            const product = await getProductByIdService(args.productId);
            return AgentToolResult.success(JSON.stringify(product, null, 2));
        }
    }));

    // 3. Get Cart
    registry.registerTool(new AgentTool({
        name: 'get_cart',
        description: "Retrieve user's shopping bag contents and total amount.",
        parameters: {
            type: 'object',
            properties: {
                userId: { type: 'string', description: 'User ID' }
            }
        },
        category: 'checkout',
        executeFn: async (args, context) => {
            const uid = args.userId || context.userId || context.user?._id?.toString();
            if (!uid) return AgentToolResult.error('User authentication required to fetch cart');
            const cart = await getCartService(uid);
            return AgentToolResult.success(JSON.stringify(cart || { items: [] }, null, 2));
        }
    }));

    // 4. UI Add To Cart
    registry.registerTool(new AgentTool({
        name: 'ui_add_to_cart',
        description: 'Add an item to the shopping cart with size and quantity.',
        parameters: {
            type: 'object',
            properties: {
                productId: { type: 'string' },
                size: { type: 'string' },
                quantity: { type: 'number' }
            },
            required: ['productId', 'size']
        },
        category: 'checkout',
        executeFn: async (args, context) => {
            const uid = context.userId || context.user?._id?.toString();
            if (!uid) return AgentToolResult.error('User authentication required to add to bag');
            const cart = await addToCartService(uid, args.productId, args.quantity || 1, args.size);
            return AgentToolResult.success(JSON.stringify({ status: 'success', cart }));
        }
    }));

    // 5. Place Order
    registry.registerTool(new AgentTool({
        name: 'place_order',
        description: 'Place an order for items in the cart with address and payment method.',
        parameters: {
            type: 'object',
            properties: {
                shippingAddress: {
                    type: 'object',
                    properties: {
                        name: { type: 'string' },
                        phone: { type: 'string' },
                        addressLine: { type: 'string' },
                        city: { type: 'string' },
                        state: { type: 'string' },
                        pincode: { type: 'string' }
                    },
                    required: ['name', 'phone', 'addressLine', 'city', 'state', 'pincode']
                },
                paymentMethod: { type: 'string', enum: ['CARD', 'COD'] },
                discountCode: { type: 'string' }
            },
            required: ['shippingAddress']
        },
        category: 'checkout',
        executeFn: async (args, context) => {
            const user = context.user;
            if (!user) return AgentToolResult.error('User authentication required to place order');
            const order = await placeOrderService(user, args.shippingAddress, args.paymentMethod || 'CARD', args.discountCode);
            return AgentToolResult.success(JSON.stringify({ status: 'success', order }));
        }
    }));

    // 6. UI Navigation Visual Actions (Simulated visually in the frontend)
    registry.registerTool(new AgentTool({
        name: 'ui_navigate',
        description: 'Visually navigate the customer browser to another page (e.g. /cart, /checkout, /products).',
        parameters: {
            type: 'object',
            properties: {
                target: { type: 'string', description: 'Route path (e.g. /cart)' }
            },
            required: ['target']
        },
        category: 'ui',
        executeFn: async (args) => {
            return AgentToolResult.success(JSON.stringify({ navigatedTo: args.target }));
        }
    }));

    registry.registerTool(new AgentTool({
        name: 'ui_search',
        description: 'Type a query in the frontend search bar and execute product search on-screen.',
        parameters: {
            type: 'object',
            properties: {
                query: { type: 'string' }
            },
            required: ['query']
        },
        category: 'ui',
        executeFn: async (args) => {
            return AgentToolResult.success(JSON.stringify({ searchedFor: args.query }));
        }
    }));

    registry.registerTool(new AgentTool({
        name: 'ui_click_product',
        description: 'Click on a specific product card to open its detail page.',
        parameters: {
            type: 'object',
            properties: {
                productId: { type: 'string' }
            },
            required: ['productId']
        },
        category: 'ui',
        executeFn: async (args) => {
            return AgentToolResult.success(JSON.stringify({ clickedProduct: args.productId }));
        }
    }));

    registry.registerTool(new AgentTool({
        name: 'ui_select_size',
        description: 'Click and select a clothing or shoe size on a product page.',
        parameters: {
            type: 'object',
            properties: {
                size: { type: 'string' }
            },
            required: ['size']
        },
        category: 'ui',
        executeFn: async (args) => {
            return AgentToolResult.success(JSON.stringify({ selectedSize: args.size }));
        }
    }));

    registry.registerTool(new AgentTool({
        name: 'ui_checkout',
        description: 'Click the proceed to checkout button in the shopping bag.',
        parameters: { type: 'object', properties: {} },
        category: 'ui',
        executeFn: async () => {
            return AgentToolResult.success(JSON.stringify({ clickedCheckout: true }));
        }
    }));

    return registry;
};
