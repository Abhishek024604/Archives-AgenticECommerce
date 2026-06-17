import React from "react";
import { useContext } from "react";
import { BagContext } from "../../context/BagContext";

function ActionButtons({ product, selectedSize }) {
  const { addToBag } = useContext(BagContext);

  const handleAddToBag = () => {
    addToBag(product, selectedSize);
  };

  return (
    <div className="flex justify-center items-center">
      <button
        disabled={!selectedSize}
        className={`w-1/2 p-2 font-bold flex items-center justify-center gap-2
    ${
      !selectedSize
        ? "bg-gray-300 cursor-not-allowed"
        : "bg-pink-600 text-white"
    }
  `}
        onClick={handleAddToBag}
      >
        <img
          src="https://img.icons8.com/ios-filled/100/briefcase.png"
          alt="Briefcase Icon"
          width="20"
        />
        ADD TO BAG
      </button>
      <button className="border border-1 p-2 ml-2 w-1/2 font-bold cursor-pointer  flex items-center justify-center gap-2">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="black"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
        WISHLIST
      </button>
    </div>
  );
}

export default ActionButtons;
