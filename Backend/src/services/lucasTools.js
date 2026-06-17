import Community from "../models/Community.model.js";
import Product from "../models/Product.model.js";
import User from "../models/User.model.js";
import { getSellerOrdersService } from "./orderService.js";

const money = (value) => Math.round((Number(value) || 0) * 100) / 100;
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const summarizeProduct = (product) => {
    const variants = (product.variants || []).map((variant) => ({
        size: variant.size,
        stock: Number(variant.stock) || 0
    }));

    return {
        id: product._id.toString(),
        productName: product.productName,
        brandName: product.brandName,
        price: money(product.price),
        rating: Number(product.rating) || 0,
        totalRatings: Number(product.totalRatings) || 0,
        totalStock: variants.reduce((sum, variant) => sum + variant.stock, 0),
        variants
    };
};

const loadSellerOrders = (sellerId) => getSellerOrdersService(sellerId);

const calculateRevenue = (orders) => {
    const processed = orders.filter((order) => order.sellerStatus === "PROCESSED");
    const pending = orders.filter((order) => order.sellerStatus !== "PROCESSED");

    return {
        totalRevenue: money(
            orders.reduce((sum, order) => sum + (Number(order.sellerTotalAmount) || 0), 0)
        ),
        processedRevenue: money(
            processed.reduce(
                (sum, order) => sum + (Number(order.sellerTotalAmount) || 0),
                0
            )
        ),
        revenueToBeProcessed: money(
            pending.reduce(
                (sum, order) => sum + (Number(order.sellerTotalAmount) || 0),
                0
            )
        ),
        processedOrders: processed.length,
        ordersToBeProcessed: pending.length
    };
};

export const lucasToolDefinitions = [
    {
        type: "function",
        function: {
            name: "getSellerOverview",
            description: "Get a current high-level seller operations summary.",
            parameters: { type: "object", properties: {}, additionalProperties: false }
        }
    },
    {
        type: "function",
        function: {
            name: "searchProducts",
            description: "Search this seller's products by product or brand name.",
            parameters: {
                type: "object",
                properties: {
                    query: { type: "string", description: "Product or brand search text." }
                },
                required: ["query"],
                additionalProperties: false
            }
        }
    },
    {
        type: "function",
        function: {
            name: "getInventory",
            description: "Get current inventory and size-level stock for this seller.",
            parameters: {
                type: "object",
                properties: {
                    stockStatus: {
                        type: "string",
                        enum: ["all", "in_stock", "low_stock", "sold_out"],
                        description: "Optional inventory status filter."
                    }
                },
                additionalProperties: false
            }
        }
    },
    {
        type: "function",
        function: {
            name: "getOrders",
            description: "Get this seller's recent orders and seller-specific dispatch status.",
            parameters: {
                type: "object",
                properties: {
                    status: {
                        type: "string",
                        enum: ["all", "processed", "to_be_processed"]
                    },
                    limit: { type: "integer", minimum: 1, maximum: 25 }
                },
                additionalProperties: false
            }
        }
    },
    {
        type: "function",
        function: {
            name: "getRevenue",
            description: "Get current processed and pending seller revenue.",
            parameters: { type: "object", properties: {}, additionalProperties: false }
        }
    },
    {
        type: "function",
        function: {
            name: "getCustomers",
            description: "Get customers who ordered this seller's products and their order totals.",
            parameters: {
                type: "object",
                properties: {
                    limit: { type: "integer", minimum: 1, maximum: 25 }
                },
                additionalProperties: false
            }
        }
    },
    {
        type: "function",
        function: {
            name: "getCommunities",
            description: "Get communities joined or created by this seller.",
            parameters: { type: "object", properties: {}, additionalProperties: false }
        }
    }
];

const getSellerOverview = async (sellerId) => {
    const [seller, products, orders] = await Promise.all([
        User.findById(sellerId).select("name sellerInfo").lean(),
        Product.find({ seller: sellerId }).lean(),
        loadSellerOrders(sellerId)
    ]);
    const inventory = products.map(summarizeProduct);

    return {
        seller: {
            name: seller?.name || "",
            storeName: seller?.sellerInfo?.storeName || ""
        },
        products: products.length,
        unitsInStock: inventory.reduce((sum, product) => sum + product.totalStock, 0),
        lowStockProducts: inventory.filter(
            (product) => product.totalStock > 0 && product.totalStock <= 5
        ).length,
        soldOutProducts: inventory.filter((product) => product.totalStock === 0).length,
        orders: orders.length,
        unitsOrdered: orders.reduce(
            (sum, order) => sum + (Number(order.sellerItemCount) || 0),
            0
        ),
        uniqueCustomers: new Set(
            orders.map((order) => order.user?._id?.toString()).filter(Boolean)
        ).size,
        ...calculateRevenue(orders)
    };
};

const searchProducts = async (sellerId, args) => {
    const query = String(args.query || "").trim();
    if (!query) {
        return { query, products: [] };
    }
    const safeQuery = escapeRegex(query);

    const products = await Product.find({
        seller: sellerId,
        $or: [
            { productName: { $regex: safeQuery, $options: "i" } },
            { brandName: { $regex: safeQuery, $options: "i" } }
        ]
    })
        .limit(20)
        .lean();

    return { query, products: products.map(summarizeProduct) };
};

const getInventory = async (sellerId, args) => {
    const stockStatus = args.stockStatus || "all";
    const products = (await Product.find({ seller: sellerId }).lean()).map(
        summarizeProduct
    );
    const filtered = products.filter((product) => {
        if (stockStatus === "sold_out") return product.totalStock === 0;
        if (stockStatus === "low_stock") {
            return product.totalStock > 0 && product.totalStock <= 5;
        }
        if (stockStatus === "in_stock") return product.totalStock > 0;
        return true;
    });

    return {
        stockStatus,
        productCount: filtered.length,
        totalUnits: filtered.reduce((sum, product) => sum + product.totalStock, 0),
        products: filtered.slice(0, 50)
    };
};

const getOrders = async (sellerId, args) => {
    const status = args.status || "all";
    const limit = Math.min(Math.max(Number(args.limit) || 10, 1), 25);
    const orders = await loadSellerOrders(sellerId);
    const filtered = orders.filter((order) => {
        if (status === "processed") return order.sellerStatus === "PROCESSED";
        if (status === "to_be_processed") {
            return order.sellerStatus !== "PROCESSED";
        }
        return true;
    });

    return {
        status,
        totalMatching: filtered.length,
        orders: filtered.slice(0, limit).map((order) => ({
            id: order._id.toString(),
            orderId: order.orderId,
            createdAt: order.createdAt,
            customer: {
                name: order.user?.name || "Customer",
                email: order.user?.email || ""
            },
            status: order.sellerStatus,
            processedAt: order.processedAt,
            paymentMethod: order.paymentMethod,
            amount: money(order.sellerTotalAmount),
            units: Number(order.sellerItemCount) || 0,
            items: (order.items || []).map((item) => ({
                productName: item.productName,
                brandName: item.brandName,
                size: item.size,
                quantity: Number(item.quantity) || 0,
                price: money(item.price)
            })),
            shippingCity: order.shippingAddress?.city || "",
            shippingState: order.shippingAddress?.state || ""
        }))
    };
};

const getCustomers = async (sellerId, args) => {
    const limit = Math.min(Math.max(Number(args.limit) || 10, 1), 25);
    const orders = await loadSellerOrders(sellerId);
    const customers = new Map();

    orders.forEach((order) => {
        const id = order.user?._id?.toString();
        if (!id) return;

        const current = customers.get(id) || {
            name: order.user?.name || "Customer",
            email: order.user?.email || "",
            orders: 0,
            unitsOrdered: 0,
            totalValue: 0,
            lastOrderAt: order.createdAt
        };

        current.orders += 1;
        current.unitsOrdered += Number(order.sellerItemCount) || 0;
        current.totalValue = money(
            current.totalValue + (Number(order.sellerTotalAmount) || 0)
        );
        if (new Date(order.createdAt) > new Date(current.lastOrderAt)) {
            current.lastOrderAt = order.createdAt;
        }
        customers.set(id, current);
    });

    return {
        uniqueCustomers: customers.size,
        customers: [...customers.values()]
            .sort((a, b) => b.totalValue - a.totalValue)
            .slice(0, limit)
    };
};

const getCommunities = async (sellerId) => {
    const communities = await Community.find({
        $or: [{ createdBy: sellerId }, { members: sellerId }]
    })
        .select("name description createdBy memberCount members")
        .lean();

    return {
        communities: communities.map((community) => ({
            name: community.name,
            description: community.description,
            role:
                community.createdBy?.toString() === sellerId.toString()
                    ? "creator"
                    : "member",
            memberCount:
                Number(community.memberCount) || community.members?.length || 0
        }))
    };
};

export const executeLucasTool = async (name, args, sellerId) => {
    switch (name) {
        case "getSellerOverview":
            return getSellerOverview(sellerId);
        case "searchProducts":
            return searchProducts(sellerId, args);
        case "getInventory":
            return getInventory(sellerId, args);
        case "getOrders":
            return getOrders(sellerId, args);
        case "getRevenue":
            return calculateRevenue(await loadSellerOrders(sellerId));
        case "getCustomers":
            return getCustomers(sellerId, args);
        case "getCommunities":
            return getCommunities(sellerId);
        default:
            throw new Error(`Unknown Lucas tool: ${name}`);
    }
};
