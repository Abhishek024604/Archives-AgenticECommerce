const VALID_CATEGORIES = ["women", "men", "shoes", "bags", "perfumes", "accessories", "lifestyle", "home"];

export const validateProductInput = (data) => {

    if (!data.productName || !data.price || !data.brandName) {
        throw new Error("Missing required fields");
    }

    if (data.category && !VALID_CATEGORIES.includes(String(data.category).toLowerCase())) {
        throw new Error(`Invalid category. Must be one of: ${VALID_CATEGORIES.join(", ")}`);
    }

    if (data.price < 0) {
        throw new Error("Price cannot be negative");
    }

    if (data.discount && (data.discount < 0 || data.discount > 100)) {
        throw new Error("Invalid discount value");
    }

};

export const validateProductUpdate = (data) => {

    if (data.category && !VALID_CATEGORIES.includes(String(data.category).toLowerCase())) {
        throw new Error(`Invalid category. Must be one of: ${VALID_CATEGORIES.join(", ")}`);
    }

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