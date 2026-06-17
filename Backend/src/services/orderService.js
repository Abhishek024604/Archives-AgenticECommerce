import Order from "../models/Order.model.js";
import Cart from "../models/Cart.model.js";
import Product from "../models/Product.model.js";

const validateShippingAddress = (shippingAddress) => {
    if (!shippingAddress) {
        throw new Error("Shipping address is required")
    }

    const { name, phone, addressLine, city, state, pincode } = shippingAddress

    if (!name || !phone || !addressLine || !city || !state || pincode == null) {
        throw new Error("Complete shipping address is required")
    }
}

export const placeOrderService = async (user, shippingAddress, paymentMethod = "CARD") =>{
    validateShippingAddress(shippingAddress)

    const cart = await Cart.findOne({
        user:user._id
    }).populate("items.product")

    if(!cart || cart.items.length === 0){
        throw new Error("cart is empty")
    }

    const orderItems = []
    let subtotal = 0;

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

        subtotal += product.price * item.quantity
    }

    const discount = 0
    const totalAmount = subtotal - discount

    const order = await Order.create({
        user: user._id,
        items: orderItems,
        subtotal,
        discount,
        totalAmount,
        paymentMethod,
        shippingAddress,
        status: "CONFIRMED",
        orderId: `ORD-${Date.now()}`
    })

    for (let item of cart.items) {
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
