import { z } from "zod";
import { getAllProductsService, getProductByIdService, createProductService, updateProductService, deleteProductService } from "../services/productService.js";
import { getCartService, addToCartService, removeCartItemService } from "../services/cartService.js";
import { getMyOrdersService, placeOrderService, dispatchSellerOrderService } from "../services/orderService.js";
import { executeLucasTool } from "../services/lucasTools.js";
import { executeAdvancedProductSearch } from "../harness/storeTools.js";

export const registerTools = (server) => {
    // 1. Search Products
    server.tool(
        "search_products",
        "Search products in the e-commerce catalog. Available categories: women, men, footwear, bags, perfumes, accessories, home & lifestyle.",
        {
            q: z.string().optional().describe("Free-text search keyword or title phrase"),
            category: z.enum(["women", "men", "footwear", "bags", "perfumes", "accessories", "home & lifestyle", "all"]).optional().describe("Category filter"),
            subCategory: z.string().optional().describe("Subcategory or garment type (e.g. shirt, blazer, boots, sneakers, jeans, dress)"),
            brandName: z.string().optional().describe("Brand name filter"),
            minPrice: z.number().optional().describe("Minimum price in INR"),
            maxPrice: z.number().optional().describe("Maximum price in INR"),
            minRating: z.number().optional().describe("Minimum average rating (0.0 to 5.0)"),
            minDiscount: z.number().optional().describe("Minimum discount percentage"),
            size: z.string().optional().describe("Size in stock (e.g. S, M, L, UK 8, 32)"),
            sortBy: z.enum(["price_asc", "price_desc", "rating_desc", "newest", "discount_desc", "relevance"]).optional().describe("Sort order"),
            limit: z.number().optional().describe("Maximum number of products to return (default 10)")
        },
        async (args) => {
            try {
                const result = await executeAdvancedProductSearch(args);
                return {
                    content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
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
    // UI AUTOMATION (VISUAL) TOOLS
    // ==========================================

    server.tool(
        "ui_navigate",
        "Visually navigate the user to a specific page or category. The cursor will move and click the link.",
        {
            path: z.string().describe("The URL path to navigate to (e.g., '/', '/products', '/cart')"),
            target: z.string().describe("The internal target key for the nav link (e.g., 'men', 'women', 'home')")
        },
        async ({ path, target }) => {
            return { content: [{ type: "text", text: `Cursor moved and clicked ${target}. Navigating to ${path}.` }] };
        }
    );

    server.tool(
        "ui_search",
        "Visually search for a product. The cursor will move to the search bar, type the query, and press enter.",
        {
            query: z.string().describe("The search text to type"),
            category: z.enum(["women", "men", "footwear", "bags", "perfumes", "accessories", "home & lifestyle", "all"]).optional().describe("Category filter to apply alongside the query")
        },
        async ({ query, category }) => {
            // Also return the search results so the LLM knows what will appear on screen
            try {
                const products = await getAllProductsService({ q: query, category, limit: 10 });
                return { content: [{ type: "text", text: `Typed "${query}" in search. Found products: ${JSON.stringify(products.map(p => ({id: p._id, name: p.productName, price: p.price})), null, 2)}` }] };
            } catch (e) {
                return { content: [{ type: "text", text: `Typed "${query}".` }] };
            }
        }
    );

    server.tool(
        "ui_click_product",
        "Visually click on a product card to open its detail page. Use this after a search to select a specific item.",
        {
            productId: z.string().describe("The unique MongoDB ObjectId of the product to click")
        },
        async ({ productId }) => {
            try {
                const product = await getProductByIdService(productId);
                return { content: [{ type: "text", text: `Clicked product. Viewing details for: ${JSON.stringify(product, null, 2)}` }] };
            } catch (e) {
                return { content: [{ type: "text", text: `Clicked product ${productId}.` }] };
            }
        }
    );

    server.tool(
        "ui_select_size",
        "Visually click a size bubble on the product details page.",
        {
            size: z.string().describe("The size to select (e.g., 'S', 'M', '8', '10')")
        },
        async ({ size }) => {
            return { content: [{ type: "text", text: `Clicked size ${size}.` }] };
        }
    );

    server.tool(
        "ui_add_to_cart",
        "Visually click the 'Add to Bag' button on the product details page. Note: Also requires calling this tool to actually add it to the backend cart.",
        {
            userId: z.string().describe("The user ID"),
            productId: z.string().describe("The unique MongoDB ObjectId of the product"),
            quantity: z.number().min(1).describe("Number of items to add"),
            size: z.string().describe("Size variant selected by user")
        },
        async ({ userId, productId, quantity, size }) => {
            try {
                await addToCartService(userId, productId, quantity, size);
                const updatedCart = await getCartService(userId);
                return { content: [{ type: "text", text: `Clicked Add to Bag. Cart updated: ${JSON.stringify(updatedCart, null, 2)}` }] };
            } catch (error) {
                return { isError: true, content: [{ type: "text", text: `Failed to add to cart: ${error.message}` }] };
            }
        }
    );

    server.tool(
        "ui_checkout",
        "Visually click the 'Proceed to Checkout' button on the Cart page.",
        {},
        async () => {
            return { content: [{ type: "text", text: `Clicked Proceed to Checkout. Navigating to checkout page.` }] };
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
