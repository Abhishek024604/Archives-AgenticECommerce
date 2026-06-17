import React from "react";

function Top({image, rating, ratings}){
    return(
        <div className="h-[280px] w-full bg-cover bg-center relative" style={{ backgroundImage: `url(${image})` }}>
            
            <div className = "bg-white h-[25px] w-[80px] absolute bottom-2 left-3 opacity-60 items-center flex p-1">
                <p className = "text-black text-[13px] font-bold">{rating} <span className="text-blue-500">★</span> | {ratings}</p>
            </div>
        
        </div>
    )
}

export default Top;