import { Link } from "react-router-dom";

const CATEGORIES = [
  {
    name: "Women",
    image: "/assets/categoryImages/women.png",
    to: "/products?category=women",
  },
  {
    name: "Men",
    image: "/assets/categoryImages/men.png",
    to: "/products?category=men",
  },
  {
    name: "Footwear",
    image: "/assets/categoryImages/footwear.png",
    to: "/products?category=footwear",
  },
  {
    name: "Bags",
    image: "/assets/categoryImages/bag.png",
    to: "/products?category=bags",
  },
  {
    name: "Perfumes",
    image: "/assets/categoryImages/perfume.png",
    to: "/products?category=perfumes",
  },
  {
    name: "Accessories",
    image: "/assets/categoryImages/accessories.png",
    to: "/products?category=accessories",
  },
  {
    name: "Home & Lifestyle",
    image: "/assets/categoryImages/homeAndLifestyle.png",
    to: "/products?category=home%20%26%20lifestyle",
  },
];

export default function CategoryGrid() {
  return (
    <section className="bg-white py-10 border-b border-stone-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div
          className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        >
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.name}
              to={cat.to}
              className="flex flex-col flex-shrink-0 w-36 sm:w-44 md:w-52 lg:w-60 items-center bg-white text-center snap-start"
            >
              <div className="aspect-square w-full overflow-hidden bg-stone-200">
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="h-full w-full object-cover"
                />
              </div>
              <span className="mt-3 text-[12px] font-semibold uppercase tracking-[0.14em] text-stone-900">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
