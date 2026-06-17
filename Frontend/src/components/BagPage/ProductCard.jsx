import React, { useContext } from "react";
import QtySelector from "./QtySelector";
import { BagContext } from "../../context/BagContext";

function ProductCard({ product }) {
  const { updateQty } = useContext(BagContext);

  return (
    <div className="border p-4 mb-3 flex gap-4">
      <img src={product.image} className="w-20" alt="" />

      <div className="space-y-">
        <h1 className="font-bold text-sm">{product.title}</h1>
        <h1 className="text-l">{product.subtitle}</h1>
        <div className="flex gap-5 items-center mt-3 mb-3"><p className="border px-1 bg-gray-200 ">Size: {product.size}</p>
        <QtySelector
          qty={product.qty}
          onChange={(newQty) => updateQty(product.id, product.size, newQty)}
        /></div>
        
        <p className="font-bold">₹ {product.price}</p>
        <p className="text-sm">14 days return available</p>
      </div>
    </div>
  );
}

export default ProductCard;
