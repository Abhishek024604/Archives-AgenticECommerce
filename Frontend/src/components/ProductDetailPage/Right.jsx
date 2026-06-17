import React, { useState } from "react";
import ProductName from "./ProductName";
import Rating from "./Rating";
import ProductPrice from "./ProductPrice";
import SizeSelector from "./SizeSelector";
import ActionButtons from "./ActionButtons";

function Right({product}){
    const [selectedSize, setSelectedSize] = useState(null);

    return(
        <div className="flex flex-col gap-4 w-1/2 space-y-2">
            <ProductName product={product} />
            <Rating product={product}/>
            <hr />
            <ProductPrice product={product} />
            <SizeSelector product={product}
  selectedSize={selectedSize}
  setSelectedSize={setSelectedSize}/>
            <ActionButtons product={product} selectedSize={selectedSize}/>
        </div>
    )
}

export default Right