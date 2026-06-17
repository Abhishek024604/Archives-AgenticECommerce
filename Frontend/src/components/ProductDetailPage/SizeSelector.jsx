import React from "react";

function SizeSelector({ product, selectedSize, setSelectedSize }) {
  return (
    <div className="space-y-3">

      <h1 className="font-bold">SELECT SIZE</h1>

      <div className="flex">

        {product.sizes.map((size, index) => (
          <div
            key={index}
            onClick={() => setSelectedSize(size)}
            className={`border h-12 w-12 flex justify-center items-center mr-2 cursor-pointer rounded-full
              ${selectedSize === size
                ? "border-pink-600 text-pink-600"
                : "hover:border-pink-700"}
            `}
          >
            <h1 className="font-bold">{size}</h1>
          </div>
        ))}

      </div>

    </div>
  );
}

export default SizeSelector;