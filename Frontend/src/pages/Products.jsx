import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { fetchProducts } from "../api/productApi";
import { API } from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useWishlist } from "../context/WishlistContext";
import { useNavigate } from "react-router-dom";
import { formatPrice } from "../utils/currency";
import { resolveMediaUrl } from "../utils/media";
import AnnouncementBar from "../components/home/AnnouncementBar";
import HomeNavbar from "../components/home/HomeNavbar";
import LucasStylistBanner from "../components/home/LucasStylistBanner";
import ValueBadges from "../components/home/ValueBadges";
import HomeFooter from "../components/home/HomeFooter";
import { SUBCATEGORIES } from "../utils/categories";

const FILTER_CATEGORIES = [
  { label: "Women", id: "women" },
  { label: "Men", id: "men" },
  { label: "Footwear", id: "footwear" },
  { label: "Bags", id: "bags" },
  { label: "Perfumes", id: "perfumes" },
  { label: "Accessories", id: "accessories" },
  { label: "Home & Lifestyle", id: "home & lifestyle" },
];

export default function Products() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const initialCategory = searchParams.get("category") || "";
  const initialSubCategories = searchParams.get("subCategory") ? searchParams.get("subCategory").split(",") : [];
  const initialMinPrice = searchParams.get("minPrice") || "";
  const initialMaxPrice = searchParams.get("maxPrice") || "";

  const [items, setItems] = useState([]);
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [category, setCategory] = useState(initialCategory);
  const [subCategories, setSubCategories] = useState(initialSubCategories);
  const [minPrice, setMinPrice] = useState(initialMinPrice);
  const [maxPrice, setMaxPrice] = useState(initialMaxPrice);
  const [sortBy, setSortBy] = useState("newest");
  const [showFilters, setShowFilters] = useState(true);
  const [isSubcategoriesOpen, setIsSubcategoriesOpen] = useState(true);

  const { wishlist, toggleWishlist } = useWishlist();

  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    const nextQuery = searchParams.get("q") || "";
    const nextCategory = searchParams.get("category") || "";
    const nextSubCategory = searchParams.get("subCategory") || "";
    setQuery(nextQuery);
    setDebouncedQuery(nextQuery);
    setCategory(nextCategory);
    setSubCategories(nextSubCategory ? nextSubCategory.split(",") : []);
    setMinPrice(searchParams.get("minPrice") || "");
    setMaxPrice(searchParams.get("maxPrice") || "");
  }, [searchParams]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 500);

    return () => window.clearTimeout(timer);
  }, [query]);

  // handleClickOutside removed

  useEffect(() => {
    const params = {};

    if (debouncedQuery) params.q = debouncedQuery;
    if (category) params.category = category;
    if (subCategories.length > 0) params.subCategory = subCategories.join(",");
    if (minPrice) params.minPrice = minPrice;
    if (maxPrice) params.maxPrice = maxPrice;

    setSearchParams(params, { replace: true });
  }, [debouncedQuery, category, subCategories, maxPrice, minPrice, setSearchParams]);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        setLoading(true);
        const apiParams = {};
        if (debouncedQuery) apiParams.q = debouncedQuery;
        if (category) apiParams.category = category;
        if (subCategories.length > 0) apiParams.subCategory = subCategories.join(",");

        const res = await fetchProducts(Object.keys(apiParams).length ? apiParams : undefined);

        if (active) {
          setItems(res.data || []);
        }
      } catch {
        if (active) {
          // ignore error
        }
      } finally {
        if (active) {
          setLoading(false);
          setHasLoaded(true);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [debouncedQuery, category, subCategories, user]);

  /* useEffect for suggestions removed since suggestions aren't used here */

  const handleWishlistToggle = async (id) => {
    if (!user) {
      navigate("/login");
      return;
    }
    await toggleWishlist(id);
  };

  const clearAllFilters = () => {
    setMinPrice("");
    setMaxPrice("");
    setCategory("");
    setSubCategories([]);
    setQuery("");
    setDebouncedQuery("");
  };

  const sortedAndFilteredItems = useMemo(() => {
    const minimum = minPrice === "" ? 0 : Number(minPrice);
    const maximum = maxPrice === "" ? Number.POSITIVE_INFINITY : Number(maxPrice);

    let list = items.filter((item) => {
      const price = Number(item.price) || 0;
      const matchesCategory =
        !category || String(item.category || "").toLowerCase() === category.toLowerCase();
      const matchesSubCategory =
        subCategories.length === 0 || subCategories.includes(String(item.subCategory || "").toLowerCase());
      return price >= minimum && price <= maximum && matchesCategory && matchesSubCategory;
    });

    if (sortBy === "price-asc") {
      list = list.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (sortBy === "price-desc") {
      list = list.sort((a, b) => (b.price || 0) - (a.price || 0));
    } else if (sortBy === "rating") {
      list = list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    return list;
  }, [items, category, subCategories, maxPrice, minPrice, sortBy]);

  // min/max placeholder calculation removed since it is no longer used

  return (
    <div className="min-h-screen bg-white text-stone-900 font-sans selection:bg-stone-900 selection:text-white">
      {/* 1. Announcement Bar */}
      <AnnouncementBar />

      {/* 2. Main Navbar with Communities link */}
      <HomeNavbar />

      <div className="mx-auto max-w-[1536px] px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-[11px] font-medium text-stone-500 uppercase tracking-wider mb-4">
          <Link to="/" className="flex items-center gap-1 hover:text-stone-900 transition-colors">
            <span className="material-symbols-outlined text-sm">home</span>
            <span>Home</span>
          </Link>
          <span>›</span>
          <Link to="/products" onClick={() => setCategory("")} className={`hover:text-stone-900 transition-colors ${!category ? 'text-stone-900 font-semibold' : ''}`}>
            All Products
          </Link>
          {category && (
            <>
              <span>›</span>
              <span className="text-stone-900 font-semibold">{category}</span>
            </>
          )}
        </nav>

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-stone-200 pb-8 mb-6 gap-4">
          <div>
            <h1 className="font-headline text-4xl sm:text-5xl lg:text-6xl font-normal leading-none text-stone-950">
              The Archive
            </h1>
          </div>
          <p className="max-w-md text-xs sm:text-sm text-stone-500 font-light leading-relaxed">
            Discover timeless pieces and modern icons. Curated for those who value style that lasts beyond seasons.
          </p>
        </div>

        {/* Filter & Controls Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-200 pb-4 mb-8">
          
          {/* Left Controls (Hide Filters & Filter Dropdowns) */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center gap-2 border border-stone-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wider text-stone-800 transition-colors hover:border-stone-900"
            >
              <span className="material-symbols-outlined text-base">tune</span>
              <span>{showFilters ? "Hide Filters" : "Show Filters"}</span>
            </button>

            {/* Sorting Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-stone-300 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-wider text-stone-800 outline-none hover:border-stone-900"
            >
              <option value="newest">Sort: Newest</option>
              <option value="price-asc">Sort: Price Low to High</option>
              <option value="price-desc">Sort: Price High to Low</option>
              <option value="rating">Sort: Top Rated</option>
            </select>
          </div>

          {/* Right Controls (Count) */}
          <div className="flex items-center gap-5 text-xs font-medium text-stone-600">
            <span>{sortedAndFilteredItems.length} Products</span>
          </div>
        </div>

        {/* Main Content Area (Sidebar Filter + Product Grid) */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          
          {/* Collapsible Left Filter Sidebar */}
          {showFilters && (
            <aside className="w-full lg:w-56 shrink-0 space-y-8 border border-stone-200/80 bg-[#FAFAFA] p-5 rounded-md">
              
              {/* Filters List (Main Categories) */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-stone-900 mb-3">
                  Filters
                </h3>
                <div className="space-y-2 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer text-stone-600 hover:text-black">
                    <input
                      type="radio"
                      name="mainCategory"
                      value=""
                      checked={category === ""}
                      onChange={() => setCategory("")}
                      className="accent-stone-900"
                    />
                    <span>All</span>
                  </label>
                  {FILTER_CATEGORIES.map((catItem) => (
                    <label
                      key={catItem.id}
                      className="flex items-center gap-2 cursor-pointer text-stone-600 hover:text-black"
                    >
                      <input
                        type="radio"
                        name="mainCategory"
                        value={catItem.id}
                        checked={category === catItem.id}
                        onChange={() => setCategory(catItem.id)}
                        className="accent-stone-900"
                      />
                      <span>{catItem.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Categories List (Subcategories) */}
              <div className="border-t border-stone-200 pt-6 mt-6">
                <button
                  type="button"
                  onClick={() => setIsSubcategoriesOpen(!isSubcategoriesOpen)}
                  className="flex w-full items-center justify-between mb-3 text-xs font-bold uppercase tracking-[0.16em] text-stone-900"
                >
                  <span>Categories</span>
                  <span className="material-symbols-outlined text-sm">
                    {isSubcategoriesOpen ? "expand_less" : "expand_more"}
                  </span>
                </button>
                {isSubcategoriesOpen && (
                  <div className="space-y-2 text-xs max-h-[216px] overflow-y-auto pr-2 custom-scrollbar">
                    {SUBCATEGORIES.map((subItem) => {
                      const lower = subItem.toLowerCase();
                      const isSelected = subCategories.includes(lower);
                      return (
                        <label
                          key={subItem}
                          className="flex items-center gap-2 cursor-pointer text-stone-600 hover:text-black"
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSubCategories([...subCategories, lower]);
                              } else {
                                setSubCategories(subCategories.filter(s => s !== lower));
                              }
                            }}
                            className="accent-stone-900"
                          />
                          <span>{subItem}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Price Range Filter */}
              <div className="border-t border-stone-200 pt-6">
                <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-stone-900 mb-3">
                  Price Range
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs font-semibold text-stone-800">
                    <span>{minPrice ? formatPrice(minPrice) : formatPrice(0)}</span>
                    <span>{maxPrice && maxPrice < 10000 ? formatPrice(maxPrice) : formatPrice(10000) + "+"}</span>
                  </div>

                  <div className="relative h-5 flex items-center mt-2 px-2">
                    {/* Background Track */}
                    <div className="absolute left-2 right-2 h-1 bg-stone-200 rounded-full"></div>
                    <div 
                      className="absolute h-1 bg-stone-900 rounded-full"
                      style={{
                        left: `calc(0.5rem + ${((minPrice === "" ? 0 : Number(minPrice)) / 10000) * 100}% - ${((minPrice === "" ? 0 : Number(minPrice)) / 10000)}rem)`,
                        right: `calc(0.5rem + ${100 - ((maxPrice === "" ? 10000 : Math.min(Number(maxPrice), 10000)) / 10000) * 100}% - ${1 - ((maxPrice === "" ? 10000 : Math.min(Number(maxPrice), 10000)) / 10000)}rem)`
                      }}
                    ></div>
                    {/* Min Slider */}
                    <input
                      type="range"
                      min="0"
                      max="10000"
                      step="100"
                      value={minPrice === "" ? 0 : Number(minPrice)}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        const currentMax = maxPrice === "" ? 10000 : Number(maxPrice);
                        if (val >= currentMax) return;
                        setMinPrice(val === 0 ? "" : val.toString());
                      }}
                      className="absolute left-0 w-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-stone-900 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-stone-900 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:cursor-pointer z-10"
                    />
                    {/* Max Slider */}
                    <input
                      type="range"
                      min="0"
                      max="10000"
                      step="100"
                      value={maxPrice === "" ? 10000 : Math.min(Number(maxPrice), 10000)}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        const currentMin = minPrice === "" ? 0 : Number(minPrice);
                        if (val <= currentMin) return;
                        setMaxPrice(val === 10000 ? "" : val.toString());
                      }}
                      className="absolute left-0 w-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-stone-900 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-stone-900 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:cursor-pointer z-20"
                    />
                  </div>
                </div>
              </div>

              {/* Clear All Filters Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="w-full border border-stone-300 bg-white py-2.5 text-xs font-bold uppercase tracking-[0.16em] text-stone-800 transition-colors hover:bg-stone-900 hover:text-white"
                >
                  Clear All Filters
                </button>
              </div>

            </aside>
          )}

          {/* Product Grid Area */}
          <div className="flex-1 min-w-0 w-full">
            
            {loading && !hasLoaded ? (
              <div className="py-20 text-center text-sm font-medium text-stone-500">
                Loading luxury collection...
              </div>
            ) : sortedAndFilteredItems.length === 0 ? (
              <div className="border border-stone-200 bg-[#FAFAFA] py-16 px-6 text-center rounded-md">
                <h3 className="font-headline text-2xl text-stone-900">
                  No products match your criteria
                </h3>
                <p className="mt-2 text-xs text-stone-500 max-w-sm mx-auto">
                  Try adjusting the price range or clear filters to discover more items.
                </p>
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="mt-5 inline-flex bg-stone-950 text-white px-6 py-2.5 text-xs font-bold uppercase tracking-wider"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div
                className={`grid gap-4 sm:gap-5 ${
                  showFilters
                    ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
                    : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
                }`}
              >
                {sortedAndFilteredItems.map((p, idx) => {
                  const isWishlisted = wishlist.some(w => w._id === (p._id || p.id));
                  const hasDiscount = p.discount && p.discount > 0;
                  const originalPrice = hasDiscount
                    ? Math.round((p.price * 100) / (100 - p.discount))
                    : null;

                  return (
                    <div
                      key={p._id || p.id || idx}
                      className="group relative flex flex-col rounded-md overflow-hidden bg-white border border-stone-100 transition-all hover:shadow-md"
                    >
                      {/* Product Image Container */}
                      <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#F5F4F0]">
                        <Link to={`/product/${p._id || p.id}`}>
                          <img
                            src={resolveMediaUrl(p.images?.[0] || p.image)}
                            alt={p.productName || p.name}
                            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                        </Link>

                        {/* Top Left Badge (NEW or Discount) */}
                        <div className="absolute top-3 left-3 flex flex-col gap-1 z-10">
                          {hasDiscount ? (
                            <span className="bg-red-700 text-white px-2 py-0.5 text-[9px] font-bold tracking-widest uppercase">
                              -{p.discount}%
                            </span>
                          ) : (
                            <span className="bg-stone-950 text-white px-2 py-0.5 text-[9px] font-bold tracking-widest uppercase">
                              NEW
                            </span>
                          )}
                        </div>

                        {/* Top Right Wishlist Toggle */}
                        <button
                          type="button"
                          onClick={() => handleWishlistToggle(p._id || p.id)}
                          className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-stone-800 backdrop-blur-xs transition-transform hover:scale-110 hover:bg-white"
                          aria-label="Wishlist"
                        >
                          <span className={`material-symbols-outlined text-base ${isWishlisted ? "text-red-600" : ""}`}>
                            {isWishlisted ? "favorite" : "favorite_border"}
                          </span>
                        </button>
                      </div>

                      {/* Product Info Box */}
                      <div className="p-4 flex flex-col flex-1 justify-between bg-white border-t border-stone-100">
                        <div>
                          {/* Color Swatches */}
                          <div className="flex items-center gap-1.5 mb-2">
                            <span className="h-2.5 w-2.5 rounded-full bg-stone-900 border border-stone-300" />
                            <span className="h-2.5 w-2.5 rounded-full bg-stone-300 border border-stone-300" />
                            <span className="h-2.5 w-2.5 rounded-full bg-amber-900/60 border border-stone-300" />
                          </div>

                          <Link to={`/product/${p._id || p.id}`}>
                            <h3 className="font-headline text-base font-medium text-stone-950 line-clamp-1 group-hover:text-stone-600 transition-colors">
                              {p.productName || p.name}
                            </h3>
                          </Link>
                          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-stone-400 mt-0.5">
                            {p.brandName || "Archivist"}
                          </p>
                        </div>

                        <div className="mt-3 flex items-center justify-between pt-2 border-t border-stone-100">
                          <div className="flex items-center gap-2">
                            {originalPrice && (
                              <span className="text-xs text-stone-400 line-through">
                                {formatPrice(originalPrice)}
                              </span>
                            )}
                            <span className="text-xs font-semibold text-stone-950">
                              {formatPrice(p.price)}
                            </span>
                          </div>

                          {/* Quick Add Button */}
                          <Link
                            to={`/product/${p._id || p.id}`}
                            className="flex h-7 w-7 items-center justify-center rounded-full border border-stone-300 text-stone-800 transition-colors hover:bg-stone-950 hover:border-stone-950 hover:text-white"
                            aria-label="View product"
                          >
                            <span className="material-symbols-outlined text-base">add</span>
                          </Link>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}

          </div>

        </div>

        {/* Embedded Meet Lucas AI Stylist Banner */}
        <div className="mt-16">
          <LucasStylistBanner />
        </div>

        {/* Value Propositions & Trust Badges */}
        <div className="mt-12">
          <ValueBadges />
        </div>

      </div>

      {/* Footer */}
      <HomeFooter />
    </div>
  );
}
