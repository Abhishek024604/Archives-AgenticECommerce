import { useRef } from "react";
import { Link } from "react-router-dom";
import { formatPrice } from "../../utils/currency";

export default function ProductCarouselSection({
  title,
  viewAllLink = "/products",
  products = [],
  wishlist = [],
  onToggleWishlist,
}) {
  const scrollRef = useRef(null);

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -320, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 320, behavior: "smooth" });
    }
  };

  return (
    <section className="bg-white py-12 border-b border-stone-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg sm:text-xl font-bold tracking-[0.18em] uppercase text-stone-900 font-headline">
            {title}
          </h2>

          <div className="flex items-center gap-4">
            <Link
              to={viewAllLink}
              className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-700 hover:text-black transition-colors"
            >
              View All
            </Link>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={scrollLeft}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-stone-300 text-stone-700 transition-colors hover:border-black hover:bg-stone-900 hover:text-white"
                aria-label="Scroll left"
              >
                <span className="material-symbols-outlined text-sm">chevron_left</span>
              </button>
              <button
                type="button"
                onClick={scrollRight}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-stone-300 text-stone-700 transition-colors hover:border-black hover:bg-stone-900 hover:text-white"
                aria-label="Scroll right"
              >
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </button>
            </div>
          </div>
        </div>

        {/* Carousel / Responsive Products List */}
        <div
          ref={scrollRef}
          className="flex gap-5 overflow-x-auto scrollbar-none pb-4 scroll-smooth snap-x snap-mandatory"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {products.map((product) => {
            const isWishlisted = wishlist.includes(product.id || product.name);

            return (
              <div
                key={product.id || product.name}
                className="w-[230px] sm:w-[260px] shrink-0 snap-start flex flex-col group"
              >
                {/* Product Image Box */}
                <div className="relative aspect-[4/5] w-full overflow-hidden rounded-md bg-[#F5F4F0]">
                  <Link to={`/product/${product.id}`}>
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </Link>

                  {/* Wishlist Heart Toggle */}
                  <button
                    type="button"
                    onClick={() => onToggleWishlist && onToggleWishlist(product.id || product.name)}
                    className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-stone-800 backdrop-blur-xs transition-transform hover:scale-110 hover:bg-white"
                    aria-label="Add to wishlist"
                  >
                    <span className={`material-symbols-outlined text-base ${isWishlisted ? "text-red-600" : ""}`}>
                      {isWishlisted ? "favorite" : "favorite_border"}
                    </span>
                  </button>
                </div>

                {/* Product Meta */}
                <div className="mt-3 flex flex-col">
                  <h3 className="text-[11px] font-bold tracking-[0.08em] uppercase text-stone-900 line-clamp-1">
                    {product.name}
                  </h3>
                  <span className="mt-1 text-xs font-medium text-stone-700">
                    {formatPrice(product.price)}
                  </span>

                  {/* Color Swatch Dots */}
                  {product.colors && product.colors.length > 0 && (
                    <div className="mt-2 flex items-center gap-1.5">
                      {product.colors.map((colorHex, idx) => (
                        <span
                          key={idx}
                          className="h-2.5 w-2.5 rounded-full border border-stone-300"
                          style={{ backgroundColor: colorHex }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
