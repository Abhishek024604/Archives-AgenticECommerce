import Order from "../models/Order.model.js";
import Cart from "../models/Cart.model.js";
import Product from "../models/Product.model.js";
import Discount from "../models/Discount.model.js";

const validateShippingAddress = (shippingAddress) => {
    if (!shippingAddress) {
        throw new Error("Shipping address is required")
    }

    const { name, phone, addressLine, city, state, pincode } = shippingAddress

    if (!name || !phone || !addressLine || !city || !state || pincode == null) {
        throw new Error("Complete shipping address is required")
    }
}

export const placeOrderService = async (user, shippingAddress, paymentMethod = "CARD", discountCode = null) =>{
    validateShippingAddress(shippingAddress)

    const cart = await Cart.findOne({
        user:user._id
    }).populate("items.product")

    if(!cart || cart.items.length === 0){
        throw new Error("cart is empty")
    }

    let appliedDiscount = null;
    if (discountCode) {
        appliedDiscount = await Discount.findOne({ code: discountCode });
        if (!appliedDiscount) {
            throw new Error("Invalid discount code");
        }
        const now = new Date();
        if (appliedDiscount.status !== "Active" || appliedDiscount.validityStart > now || appliedDiscount.validityEnd < now) {
            throw new Error("Discount code is not active or has expired");
        }
        if (appliedDiscount.usage >= appliedDiscount.maxUsage) {
            throw new Error("Discount code usage limit reached");
        }
    }

    const orderItems = []
    let subtotal = 0;
    let eligibleSubtotal = 0;

    for (const item of cart.items) {
        const product = item.product

        if (!product) {
            throw new Error("Product not found in cart")
        }
        if (!product.seller) {
            throw new Error(`Seller not found for ${product.productName}`)
        }

        const variant = product.variants.find(v => v.size === item.size)

        if(!variant || variant.stock < item.quantity){
            throw new Error(`Insufficient stock for ${product.productName}`)
        }

        variant.stock -= item.quantity

        const itemTotal = product.price * item.quantity;

        if (appliedDiscount && product.seller.toString() === appliedDiscount.seller.toString()) {
            eligibleSubtotal += itemTotal;
        }

        orderItems.push({
            productId: product._id,
            sellerId: product.seller,
            brandName: product.brandName,
            productName: product.productName,
            image: product.images?.[0],
            price: product.price,
            size: item.size,
            quantity: item.quantity
        })

        subtotal += itemTotal
    }

    let discountAmount = 0;
    if (appliedDiscount && eligibleSubtotal > 0) {
        if (appliedDiscount.type === "Percentage") {
            discountAmount = (eligibleSubtotal * appliedDiscount.value) / 100;
        } else if (appliedDiscount.type === "Fixed Amount") {
            discountAmount = Math.min(appliedDiscount.value, eligibleSubtotal);
        }
        
        appliedDiscount.usage += 1;
        appliedDiscount.revenueGenerated += (eligibleSubtotal - discountAmount);
        await appliedDiscount.save();
    }

    const totalAmount = subtotal - discountAmount

    const order = await Order.create({
        user: user._id,
        items: orderItems,
        subtotal,
        discount: discountAmount,
        discountCode: discountCode || null,
        totalAmount,
        paymentMethod,
        shippingAddress,
        status: "CONFIRMED",
        orderId: `ORD-${Date.now()}`
    })

    for (let item of cart.items) {
        if (item.product && typeof item.product.salesCount === 'number') {
            item.product.salesCount += item.quantity;
        } else if (item.product) {
            item.product.salesCount = item.quantity;
        }
        await item.product.save();
    }

    cart.items = [];
    await cart.save();

    return order;
}

export const getMyOrdersService = async (userId) => {
    return await Order.find({ user: userId }).sort({ createdAt: -1 });
}

const getSellerProductIds = async (sellerId) => {
    const sellerProducts = await Product.find({ seller: sellerId }).select("_id").lean()
    return sellerProducts.map((product) => product._id)
}

const isSellerItem = (item, sellerId, sellerProductIdSet) => {
    if (item?.sellerId && item.sellerId.toString() === sellerId.toString()) {
        return true
    }

    return item?.productId && sellerProductIdSet.has(item.productId.toString())
}

const toSellerOrder = (order, sellerId, sellerProductIdSet) => {
    const sellerItems = (order.items || []).filter((item) =>
        isSellerItem(item, sellerId, sellerProductIdSet)
    )

    if (sellerItems.length === 0) {
        return null
    }

    const sellerTotalAmount = sellerItems.reduce(
        (sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 0),
        0
    )
    const isProcessed = sellerItems.every((item) => Boolean(item.dispatchedAt))

    return {
        ...order,
        items: sellerItems,
        sellerTotalAmount,
        sellerItemCount: sellerItems.reduce(
            (sum, item) => sum + (Number(item.quantity) || 0),
            0
        ),
        sellerStatus: isProcessed ? "PROCESSED" : "TO_BE_PROCESSED",
        processedAt: isProcessed ? sellerItems[0]?.dispatchedAt : null
    }
}

export const getSellerOrdersService = async (sellerId) => {
    const sellerProductIds = await getSellerProductIds(sellerId)
    const sellerProductIdSet = new Set(sellerProductIds.map((id) => id.toString()))

    const query = sellerProductIds.length
        ? {
            $or: [
                { "items.sellerId": sellerId },
                { "items.productId": { $in: sellerProductIds } }
            ]
        }
        : { "items.sellerId": sellerId }

    const orders = await Order.find(query)
        .populate("user", "name email")
        .sort({ createdAt: -1 })
        .lean()

    return orders
        .map((order) => toSellerOrder(order, sellerId, sellerProductIdSet))
        .filter(Boolean)
}

export const dispatchSellerOrderService = async (orderId, sellerId) => {
    const order = await Order.findById(orderId)

    if (!order) {
        throw new Error("Order not found")
    }

    const sellerProductIds = await getSellerProductIds(sellerId)
    const sellerProductIdSet = new Set(sellerProductIds.map((id) => id.toString()))
    const sellerItems = order.items.filter((item) =>
        isSellerItem(item, sellerId, sellerProductIdSet)
    )

    if (sellerItems.length === 0) {
        throw new Error("This order does not contain your products")
    }

    const dispatchedAt = new Date()
    sellerItems.forEach((item) => {
        if (!item.dispatchedAt) {
            item.dispatchedAt = dispatchedAt
        }
    })

    await order.save()
    await order.populate("user", "name email")

    return toSellerOrder(order.toObject(), sellerId, sellerProductIdSet)
}
export const getSellerOrderByIdService = async (orderId, sellerId) => {
    const order = await Order.findById(orderId).populate("user", "name email").lean();
    if (!order) {
        throw new Error("Order not found");
    }

    const sellerProductIds = await getSellerProductIds(sellerId);
    const sellerProductIdSet = new Set(sellerProductIds.map((id) => id.toString()));
    
    const sellerOrder = toSellerOrder(order, sellerId, sellerProductIdSet);
    if (!sellerOrder) {
        throw new Error("Order not found or access denied");
    }

    return sellerOrder;
};
