export const validateProductInput = (data) => {

    if (!data.productName || !data.price || !data.brandName) {
        throw new Error("Missing required fields");
    }

    if (data.price < 0) {
        throw new Error("Price cannot be negative");
    }

    if (data.discount && (data.discount < 0 || data.discount > 100)) {
        throw new Error("Invalid discount value");
    }

};

export const validateProductUpdate = (data) => {

    if (data.price != null && data.price < 0) {
        throw new Error("Invalid price");
    }

    if (data.discount != null && (data.discount < 0 || data.discount > 100)) {
        throw new Error("Invalid discount");
    }

    if (data.variants) {
        data.variants.forEach(v => {
            if (v.stock != null && v.stock < 0) {
                throw new Error("Invalid stock");
            }
        });
    }
};