import * as productService from "../services/productService.js";

export const createProduct = async (req, res) => {
    try {
        const product = await productService.createProductService(
            req.body,
            req.user
        );

        res.status(201).json(product);

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


export const getAllProducts = async (req, res) => {
    try {
        const products = await productService.getAllProductsService(req.query);
        res.status(200).json(products);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const getProductSuggestions = async (req, res) => {
    try {
        const suggestions = await productService.getProductSuggestionsService(req.query);
        res.status(200).json(suggestions);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const getProductById = async (req, res) => {
    try {
        const product = await productService.getProductByIdService(req.params.id);
        res.status(200).json(product);
    } catch (err) {
        res.status(404).json({ message: err.message });
    }
};


export const updateProduct = async (req, res) => {
    try {
        const product = await productService.updateProductService(
            req.params.id,
            req.body,
            req.user
        );

        res.status(200).json(product);

    } catch (err) {
        res.status(403).json({ message: err.message });
    }
};


export const deleteProduct = async (req, res) => {
    try {
        const result = await productService.deleteProductService(
            req.params.id,
            req.user
        );

        res.status(200).json(result);

    } catch (err) {
        res.status(403).json({ message: err.message });
    }
};
