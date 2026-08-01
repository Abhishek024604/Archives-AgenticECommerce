import Cart from "../models/Cart.model.js";

export const addToCartService = async (userId, productId, quantity, size) => {

    let cart = await Cart.findOne({ user: userId })

    if (!cart) {
        cart = await Cart.create({
            user: userId,
            items: []
        })
    }

    const existingItem = cart.items.find(
        item => item.product.toString() === productId && item.size === size
    )

    if (existingItem) {
        existingItem.quantity += quantity
    } else {
        cart.items.push({ product: productId, quantity, size })
    }

    await cart.save()

    return cart
}

export const getCartService = async (userId) => {
    return await Cart.findOne({ user: userId }).populate("items.product")
}

export const updateCartItemService = async (userId, productId, quantity, size) => {

    const cart = await Cart.findOne({
        user: userId
    })

    if (!cart) throw new Error("Cart not found")

    const item = cart.items.find(
        item => item.product.toString() === productId && item.size === size
    )

    if (!item) throw new Error("Cart item not found")

    item.quantity = quantity

    await cart.save()

    return cart
}

export const updateCartItemSizeService = async (userId, productId, oldSize, newSize) => {
    const cart = await Cart.findOne({ user: userId });
    if (!cart) throw new Error("Cart not found");

    const existingItemIndex = cart.items.findIndex(
        item => item.product.toString() === productId && item.size === oldSize
    );

    if (existingItemIndex === -1) throw new Error("Cart item not found");
    const existingItem = cart.items[existingItemIndex];

    const newItemIndex = cart.items.findIndex(
        item => item.product.toString() === productId && item.size === newSize
    );

    if (newItemIndex !== -1 && newItemIndex !== existingItemIndex) {
        // Merge quantities
        cart.items[newItemIndex].quantity += existingItem.quantity;
        // Remove old item
        cart.items.splice(existingItemIndex, 1);
    } else {
        existingItem.size = newSize;
    }

    await cart.save();
    return cart;
};

export const removeCartItemService = async (userId, productId, size) =>{
    const cart = await Cart.findOne({ user: userId });

    if (!cart) throw new Error("Cart not found");

    cart.items = cart.items.filter(
        item => !(item.product.toString() === productId && item.size === size)
    );

    await cart.save();

    return cart;
}

export const clearCartService = async (userId) => {

    const cart = await Cart.findOne({ user: userId });

    if (!cart) throw new Error("Cart not found");

    cart.items = [];

    await cart.save();

    return cart;
};
