import React from "react";

function ProductName({product}){
    return(
        <div className="space-y-2">
            <h1 className="text-3xl font-bold">{product.brandName}</h1>
            <h2 className="text-xl text-gray-500">{product.productName}</h2>
        </div>
    )
}

export default ProductName