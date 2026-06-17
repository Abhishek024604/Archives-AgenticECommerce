import React from "react";

function Bottom({title, subtitle, price, discount}){
    return(
        <div className="w-full bg-surface-container-lowest p-3 text-on-background">
            <p className="font-bold">{title}</p>
            <p className="text-sm">{subtitle}</p>
            <p className="text-sm">{price} <span>({discount}% OFF)</span></p>
        </div>
    )
}

export default Bottom
