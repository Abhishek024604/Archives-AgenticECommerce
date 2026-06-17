import React from "react";
import Top from "./top";
import Bottom from "./Bottom";
import products from "../data/mockData";
import { useNavigate } from "react-router-dom";

function Card({ data }) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/product/${data._id}`)}
      className="p-5 h-[410px] w-[250px]"
    >
      <Top
        image={data.image}
        rating={data.rating}
        ratings={data.totalRatings}
      />
      <Bottom
        title={data.brandName}
        subtitle={data.productName}
        price={data.price}
        discount={data.discount}
      />
    </div>
  );
}

export default Card;
