import React from "react";

function Rating({product}){
    return(
        <div className="border inline-flex self-start p-2">
            <p className = "text-black ">{product.rating} <span className="text-blue-500">★</span> | {product.ratings} Ratings</p>
        </div>
    )
}

export default Rating