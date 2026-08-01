import { z } from "zod";
import { getAllProductsService, getProductByIdService, createProductService, updateProductService, deleteProductService } from "../services/productService.js";
import { getCartService, addToCartService, removeCartItemService } from "../services/cartService.js";
import { getMyOrdersService, placeOrderService, dispatchSellerOrderService } from "../services/orderService.js";
import { executeLucasTool } from "../services/lucasTools.js";

export const registerTools = (server) => {
    // 1. Search Products
    server.tool(
        "search_products",
        "Search the e-commerce catalog for products",
        {
            q: z.string().optional().describe("Search query for product name or brand"),
            limit: z.number().optional().describe("Maximum number of products to return (default 20)")
        },
        async ({ q, limit }) => {
            try {
                const products = await getAllProductsService({ q, limit: limit || 20 });
                return {
                    content: [{ type: "text", text: JSON.stringify(products, null, 2) }]
                };
            } catch (error) {
                return {
                    isError: true,
                    content: [{ type: "text", text: `Error fetching products: ${error.message}` }]
                };
            }
        }
    );

    // 2. Get Product Details
    server.tool(
        "get_product",
        "Get detailed information about a specific product by its ID",
        {
            productId: z.string().describe("The unique MongoDB ObjectId of the product")
        },
        async ({ productId }) => {
            try {
                const product = await getProductByIdService(productId);
                return {
                    content: [{ type: "text", text: JSON.stringify(product, null, 2) }]
                };
            } catch (error) {
                return {
                    isError: true,
                    content: [{ type: "text", text: `Error fetching product details: ${error.message}` }]
                };
            }
        }
    );

    // 3. Get Cart
    server.tool(
        "get_cart",
        "Retrieve the current user's shopping cart",
        {
            userId: z.string().describe("The user ID requesting their cart")
        },
        async ({ userId }) => {
            try {
                const cart = await getCartService(userId);
                return {
                    content: [{ type: "text", text: JSON.stringify(cart, null, 2) }]
                };
            } catch (error) {
                return {
                    isError: true,
                    content: [{ type: "text", text: `Error fetching cart: ${error.message}` }]
                };
            }
        }
    );

    // 4. Add To Cart
    server.tool(
        "add_to_cart",
        "Add a product to the user's shopping cart",
        {
            userId: z.string().describe("The user ID"),
            productId: z.string().describe("The unique MongoDB ObjectId of the product"),
            quantity: z.number().min(1).describe("Number of items to add"),
            size: z.string().describe("Size variant selected by user (e.g., 'S', 'M', 'L', 'XL')")
        },
        async ({ userId, productId, quantity, size }) => {
            try {
                await addToCartService(userId, productId, quantity, size);
                const updatedCart = await getCartService(userId);
                return {
                    content: [{ type: "text", text: `Successfully added to cart. Current cart: ${JSON.stringify(updatedCart, null, 2)}` }]
                };
            } catch (error) {
                return {
                    isError: true,
                    content: [{ type: "text", text: `Error adding to cart: ${error.message}` }]
                };
            }
        }
    );

    // 5. Remove From Cart
    server.tool(
        "remove_from_cart",
        "Remove a specific product variant from the cart",
        {
            userId: z.string().describe("The user ID"),
            productId: z.string().describe("The unique MongoDB ObjectId of the product"),
            size: z.string().describe("The size variant to remove")
        },
        async ({ userId, productId, size }) => {
            try {
                await removeCartItemService(userId, productId, size);
                const updatedCart = await getCartService(userId);
                return {
                    content: [{ type: "text", text: `Successfully removed item. Current cart: ${JSON.stringify(updatedCart, null, 2)}` }]
                };
            } catch (error) {
                return {
                    isError: true,
                    content: [{ type: "text", text: `Error removing from cart: ${error.message}` }]
                };
            }
        }
    );

    // 6. Get Orders
    server.tool(
        "get_orders",
        "Retrieve the order history for the current user",
        {
            userId: z.string().describe("The user ID")
        },
        async ({ userId }) => {
            try {
                const orders = await getMyOrdersService(userId);
                return {
                    content: [{ type: "text", text: JSON.stringify(orders, null, 2) }]
                };
            } catch (error) {
                return {
                    isError: true,
                    content: [{ type: "text", text: `Error fetching orders: ${error.message}` }]
                };
            }
        }
    );

    // 7. Place Order
    server.tool(
        "place_order",
        "Place an order using the items in the current user's cart",
        {
            userId: z.string().describe("The user ID"),
            paymentMethod: z.enum(["CARD", "COD"]).describe("Payment method chosen by the user"),
            shippingAddress: z.object({
                name: z.string(),
                phone: z.string(),
                addressLine: z.string(),
                city: z.string(),
                state: z.string(),
                pincode: z.number()
            }).describe("Shipping address details")
        },
        async ({ userId, paymentMethod, shippingAddress }) => {
            try {
                const user = { _id: userId }; 
                const order = await placeOrderService(user, shippingAddress, paymentMethod);
                return {
                    content: [{ type: "text", text: `Successfully placed order. Order details: ${JSON.stringify(order, null, 2)}` }]
                };
            } catch (error) {
                return {
                    isError: true,
                    content: [{ type: "text", text: `Error placing order: ${error.message}` }]
                };
            }
        }
    );

    // ==========================================
    // SELLER TOOLS
    // ==========================================

    // 8. Seller Get Overview
    server.tool(
        "seller_get_overview",
        "Get a current high-level seller operations summary (revenue, stock, products, orders).",
        {
            sellerId: z.string().describe("The authenticated seller ID")
        },
        async ({ sellerId }) => {
            try {
                const data = await executeLucasTool("getSellerOverview", {}, sellerId);
                return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
            } catch (error) {
                return { isError: true, content: [{ type: "text", text: error.message }] };
            }
        }
    );

    // 9. Seller Search Products
    server.tool(
        "seller_search_products",
        "Search this seller's specific products by product or brand name.",
        {
            sellerId: z.string().describe("The authenticated seller ID"),
            query: z.string().describe("Product or brand search text")
        },
        async ({ sellerId, query }) => {
            try {
                const data = await executeLucasTool("searchProducts", { query }, sellerId);
                return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
            } catch (error) {
                return { isError: true, content: [{ type: "text", text: error.message }] };
            }
        }
    );

    // 10. Seller Get Inventory
    server.tool(
        "seller_get_inventory",
        "Get current inventory and size-level stock for this seller.",
        {
            sellerId: z.string().describe("The authenticated seller ID"),
            stockStatus: z.enum(["all", "in_stock", "low_stock", "sold_out"]).optional()
        },
        async ({ sellerId, stockStatus }) => {
            try {
                const data = await executeLucasTool("getInventory", { stockStatus }, sellerId);
                return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
            } catch (error) {
                return { isError: true, content: [{ type: "text", text: error.message }] };
            }
        }
    );

    // 11. Seller Get Orders
    server.tool(
        "seller_get_orders",
        "Get this seller's recent orders and seller-specific dispatch status.",
        {
            sellerId: z.string().describe("The authenticated seller ID"),
            status: z.enum(["all", "processed", "to_be_processed"]).optional(),
            limit: z.number().optional()
        },
        async ({ sellerId, status, limit }) => {
            try {
                const data = await executeLucasTool("getOrders", { status, limit }, sellerId);
                return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
            } catch (error) {
                return { isError: true, content: [{ type: "text", text: error.message }] };
            }
        }
    );

    // 12. Seller Get Revenue
    server.tool(
        "seller_get_revenue",
        "Get current processed and pending seller revenue.",
        {
            sellerId: z.string().describe("The authenticated seller ID")
        },
        async ({ sellerId }) => {
            try {
                const data = await executeLucasTool("getRevenue", {}, sellerId);
                return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
            } catch (error) {
                return { isError: true, content: [{ type: "text", text: error.message }] };
            }
        }
    );

    // 13. Seller Get Customers
    server.tool(
        "seller_get_customers",
        "Get customers who ordered this seller's products and their order totals.",
        {
            sellerId: z.string().describe("The authenticated seller ID"),
            limit: z.number().optional()
        },
        async ({ sellerId, limit }) => {
            try {
                const data = await executeLucasTool("getCustomers", { limit }, sellerId);
                return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
            } catch (error) {
                return { isError: true, content: [{ type: "text", text: error.message }] };
            }
        }
    );

    // 14. Seller Get Communities
    server.tool(
        "seller_get_communities",
        "Get communities joined or created by this seller.",
        {
            sellerId: z.string().describe("The authenticated seller ID")
        },
        async ({ sellerId }) => {
            try {
                const data = await executeLucasTool("getCommunities", {}, sellerId);
                return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
            } catch (error) {
                return { isError: true, content: [{ type: "text", text: error.message }] };
            }
        }
    );

    // 15. Seller Dispatch Order
    server.tool(
        "seller_dispatch_order",
        "Mark an order as PROCESSED/dispatched.",
        {
            sellerId: z.string().describe("The authenticated seller ID"),
            orderId: z.string().describe("The MongoDB ObjectId of the order to dispatch")
        },
        async ({ sellerId, orderId }) => {
            try {
                const data = await dispatchSellerOrderService(orderId, sellerId);
                return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
            } catch (error) {
                return { isError: true, content: [{ type: "text", text: error.message }] };
            }
        }
    );

    // 16. Seller Create Product
    server.tool(
        "seller_create_product",
        "Create a new product listing in the catalog.",
        {
            sellerId: z.string().describe("The authenticated seller ID"),
            productName: z.string(),
            brandName: z.string(),
            price: z.number(),
            discount: z.number().optional(),
            category: z.string().optional(),
            description: z.string().optional(),
            variants: z.array(z.object({
                size: z.string(),
                stock: z.number()
            })).optional()
        },
        async ({ sellerId, ...productData }) => {
            try {
                const user = { _id: sellerId, role: "seller" };
                const data = await createProductService(productData, user);
                return { content: [{ type: "text", text: `Product created: ${JSON.stringify(data, null, 2)}` }] };
            } catch (error) {
                return { isError: true, content: [{ type: "text", text: error.message }] };
            }
        }
    );

    // 17. Seller Update Product
    server.tool(
        "seller_update_product",
        "Update an existing product listing.",
        {
            sellerId: z.string().describe("The authenticated seller ID"),
            productId: z.string().describe("The MongoDB ObjectId of the product"),
            price: z.number().optional(),
            discount: z.number().optional(),
            description: z.string().optional()
        },
        async ({ sellerId, productId, ...updateData }) => {
            try {
                const user = { _id: sellerId, role: "seller" };
                const data = await updateProductService(productId, updateData, user);
                return { content: [{ type: "text", text: `Product updated: ${JSON.stringify(data, null, 2)}` }] };
            } catch (error) {
                return { isError: true, content: [{ type: "text", text: error.message }] };
            }
        }
    );

    // 18. Seller Delete Product
    server.tool(
        "seller_delete_product",
        "Delete a product from the catalog.",
        {
            sellerId: z.string().describe("The authenticated seller ID"),
            productId: z.string().describe("The MongoDB ObjectId of the product to delete")
        },
        async ({ sellerId, productId }) => {
            try {
                const user = { _id: sellerId, role: "seller" };
                await deleteProductService(productId, user);
                return { content: [{ type: "text", text: `Product ${productId} deleted successfully.` }] };
            } catch (error) {
                return { isError: true, content: [{ type: "text", text: error.message }] };
            }
        }
    );
};
