import React from "react";
import PlaceOrderButton from "./PlaceOrderButton";

function PriceDetails({bagItems}){
    const totalPrice = bagItems.reduce(
                (acc, item) => acc + item.price * item.qty,
  0
       );

    const totalDiscount = totalPrice*0.1.toFixed(1)

    const itemCount = bagItems.reduce(
  (acc, item) => acc + item.qty,
  0
);

    return(
        <div className="space-y-20">
            <div className="border p-2 space-y-2">
                <h1 className="font-bold flex items-center justify-center">Price Details({itemCount} Items)</h1>
                <div className="flex flex-col gap-2">
                    
                        <div className="flex justify-between">
                        <span>Price</span>    <span>₹{totalPrice}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Discount</span>   <span className="text-green-500 ">₹{totalDiscount}</span>
                        </div>
                        <div className="flex justify-between space-y-2">
                            <span>Delivery Charges</span> <span className="text-green-500">FREE</span>
                        </div>
                        <hr />
                        <div className="flex justify-between font-bold">
                            <span>Total Amount</span>  <span>₹{totalPrice - totalPrice*0.1}</span>
                        </div>
                        
                    
                </div>
            </div>
            <div className="">
                <PlaceOrderButton/>
            </div>
            

        </div>
    )
}

export default PriceDetails