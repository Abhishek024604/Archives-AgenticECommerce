import React from "react";

function ProductPrice({product}){
    return(
        <div className="space-y-2">
            <p className="font-bold text-xl">MRP : ₹{product.price}&nbsp; <span className="text-orange-500">({product.discount}% OFF)</span></p>
            <p className="text-green-700 font-bold">Inclusive of all taxes</p>
        </div>
    )
}

export default ProductPrice