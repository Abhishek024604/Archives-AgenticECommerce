import React, { useContext } from "react";
import PriceDetails from "../components/BagPage/PriceDetails";
import ProductCard from "../components/BagPage/ProductCard";
import { BagContext } from "../context/BagContext";
import PlaceOrderButton from "../components/BagPage/PlaceOrderButton";

function Bag(){
    const { bag } = useContext(BagContext);
    return(
        <div className="flex gap-10 p-10">

      {/* LEFT SIDE */}
      <div className="w-2/3 space-y-4">

        {bag.map(item => (
          <ProductCard key={item.id} product={item} />
        ))}

      </div>

      {/* RIGHT SIDE */}
      <div className="w-1/3">
        <PriceDetails bagItems={bag} />
      </div>


    </div>
    )
}

export default Bag