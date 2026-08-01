import * as cartService from "../services/cartService.js"

export const addToCart = async (req, res) =>{
    try{
        const { productId, quantity, size } = req.body

        const cart = await cartService.addToCartService(
            req.userId,
            productId,
            quantity, size
        )

        res.status(200).json(cart)
    } catch (err){
        res.status(500).json({
            message: err.message
        })
    }
}

export const getCart = async (req, res) => {
    try {
        const cart = await cartService.getCartService(req.userId);
        res.status(200).json(cart);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const updateCartItem = async (req, res) => {
    try {
        const { productId, quantity, size } = req.body;

        const cart = await cartService.updateCartItemService(
            req.userId,
            productId,
            quantity,
            size
        );

        res.status(200).json(cart);

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const updateCartItemSize = async (req, res) => {
    try {
        const { productId, oldSize, newSize } = req.body;
        
        const cart = await cartService.updateCartItemSizeService(
            req.userId,
            productId,
            oldSize,
            newSize
        );
        
        res.status(200).json(cart);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const removeCartItem = async (req, res) => {
    try {
        const { productId, size } = req.body;

        const cart = await cartService.removeCartItemService(
            req.userId,
            productId,
            size
        );

        res.status(200).json(cart);

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const clearCart = async (req, res) => {
    try {
        const cart = await cartService.clearCartService(req.userId);
        res.status(200).json(cart);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
