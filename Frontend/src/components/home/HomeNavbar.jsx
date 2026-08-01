import { useEffect, useRef, useState, useMemo } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useWishlist } from "../../context/WishlistContext";
import { fetchProductSuggestions } from "../../api/productApi";
import { formatPrice } from "../../utils/currency";
import { resolveMediaUrl } from "../../utils/media";
import { SUBCATEGORIES } from "../../utils/categories";

const CATEGORY_NAV_LINKS = [
  { label: "Women", to: "/products?category=women", key: "women" },
  { label: "Men", to: "/products?category=men", key: "men" },
  { label: "Accessories", to: "/products?category=accessories", key: "accessories" },
  { label: "Footwear", to: "/products?category=footwear", key: "footwear" },
  { label: "Bags", to: "/products?category=bags", key: "bags" },
  { label: "Perfumes", to: "/products?category=perfumes", key: "perfumes" },
  { label: "Home & Lifestyle", to: "/products?category=home%20%26%20lifestyle", key: "home & lifestyle" },
  { label: "Journal", to: "/archives", key: "journal" },
  { label: "Communities", to: "/communities", key: "communities" },
];

export default function HomeNavbar() {
  const { user, logout } = useAuth();
  const { wishlist } = useWishlist();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const currentCategory = (searchParams.get("category") || "").toLowerCase();
  const currentFilter = (searchParams.get("filter") || "").toLowerCase();

  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const menuRef = useRef(null);
  const searchContainerRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    let active = true;
    if (debouncedSearchQuery.length < 2) {
      setSuggestions([]);
      return;
    }
    
    (async () => {
      setIsLoadingSuggestions(true);
      try {
        const res = await fetchProductSuggestions({ q: debouncedSearchQuery, limit: 5 });
        if (active) {
          setSuggestions(res.data || []);
        }
      } catch (err) {
        if (active) setSuggestions([]);
      } finally {
        if (active) setIsLoadingSuggestions(false);
      }
    })();

    return () => { active = false; };
  }, [debouncedSearchQuery]);

  const termSuggestions = useMemo(() => {
    if (!debouncedSearchQuery) return [];
    const queryLower = debouncedSearchQuery.toLowerCase();
    const terms = new Set();
    
    CATEGORY_NAV_LINKS.forEach(link => {
      if (link.key !== "journal" && link.key !== "communities") {
        if (link.label.toLowerCase().includes(queryLower)) {
          terms.add(link.label);
        }
      }
    });

    SUBCATEGORIES.forEach(sub => {
      if (sub.toLowerCase().includes(queryLower)) {
        terms.add(sub);
      }
    });
    
    if (suggestions && suggestions.length > 0) {
      suggestions.forEach(p => {
        const nameTokens = (p.productName || "").toLowerCase().split(/[\s-]+/);
        nameTokens.forEach(token => {
          if (token.startsWith(queryLower) && token.length > queryLower.length) {
            terms.add(token);
          }
        });
        const brandTokens = (p.brandName || "").toLowerCase().split(/[\s-]+/);
        brandTokens.forEach(token => {
          if (token.startsWith(queryLower) && token.length > queryLower.length) {
            terms.add(token);
          }
        });
      });
    }

    return Array.from(terms).slice(0, 5);
  }, [debouncedSearchQuery, suggestions]);

  useEffect(() => {
    const handleClickOutsideSearch = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setIsSearchOpen(false);
      }
    };
    if (isSearchOpen) {
      document.addEventListener("mousedown", handleClickOutsideSearch);
    }
    return () => document.removeEventListener("mousedown", handleClickOutsideSearch);
  }, [isSearchOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsAccountOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    setIsAccountOpen(false);
    navigate("/");
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
    }
  };

  const isLinkActive = (link) => {
    if (location.pathname === "/products") {
      return currentCategory === link.key;
    }
    if (link.key === "journal") return location.pathname.startsWith("/archives");
    if (link.key === "communities") return location.pathname.startsWith("/communities");
    return false;
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-stone-200 text-stone-900 shadow-xs">
      <div className="mx-auto flex max-w-[1536px] items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        
        {/* Brand Logo & Mobile Menu Toggle */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="flex items-center text-stone-800 lg:hidden"
            aria-label="Toggle Navigation Menu"
          >
            <span className="material-symbols-outlined text-2xl">
              {isMobileMenuOpen ? "close" : "menu"}
            </span>
          </button>

          <Link
            to="/"
            className="font-headline text-2xl tracking-[0.25em] font-normal uppercase text-stone-900 transition-opacity hover:opacity-80"
          >
            ARCHIVIST
          </Link>
        </div>

        {/* Center Desktop Category Navigation */}
        <nav className="hidden items-center gap-4 xl:gap-6 lg:flex text-[11px] font-semibold tracking-[0.14em] uppercase text-stone-700">
          {CATEGORY_NAV_LINKS.map((link) => {
            const active = isLinkActive(link);

            return (
              <Link
                key={link.label}
                to={link.to}
                className={`py-1.5 border-b-2 transition-all ${
                  active
                    ? "border-stone-950 font-bold text-stone-950"
                    : "border-transparent text-stone-600 hover:text-stone-950 hover:border-stone-400"
                } ${link.label === "Sale" ? "text-red-700 font-bold" : ""}`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Actions (Search, Wishlist, Account, Cart) */}
        <div className="flex items-center gap-4 sm:gap-5">
          {/* Search Toggle / Input */}
          <div className="relative" ref={searchContainerRef}>
            {isSearchOpen ? (
              <div className="relative">
                <form onSubmit={handleSearchSubmit} className="flex items-center gap-1">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search products..."
                    autoFocus
                    className="w-48 sm:w-64 border-b border-stone-800 bg-stone-50 px-2 py-1 text-xs outline-none text-stone-900"
                  />
                  <button
                    type="button"
                    onClick={() => setIsSearchOpen(false)}
                    className="text-stone-500 hover:text-stone-900"
                  >
                    <span className="material-symbols-outlined text-lg">close</span>
                  </button>
                </form>

                {/* Suggestions Dropdown */}
                {searchQuery.trim().length >= 2 && (
                  <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-white border border-stone-200 shadow-xl z-50">
                    {isLoadingSuggestions ? (
                      <div className="p-4 text-xs text-stone-500 text-center">Loading suggestions...</div>
                    ) : (
                      <>
                        {/* Term Suggestions */}
                        {termSuggestions.length > 0 && (
                          <div className="border-b border-stone-100 p-2">
                            {termSuggestions.map((term, idx) => (
                              <button
                                key={idx}
                                onClick={() => {
                                  navigate(`/products?q=${encodeURIComponent(term)}`);
                                  setIsSearchOpen(false);
                                }}
                                className="flex w-full items-center gap-3 px-2 py-1.5 text-xs text-stone-700 hover:bg-stone-50 transition-colors text-left"
                              >
                                <span className="material-symbols-outlined text-sm text-stone-400">search</span>
                                <span className="font-medium">{term}</span>
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Product Suggestions */}
                        {suggestions.length > 0 ? (
                          <div className="p-2">
                            <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1">
                              Products
                            </div>
                            {suggestions.map((p) => (
                              <Link
                                key={p._id}
                                to={`/product/${p._id}`}
                                onClick={() => setIsSearchOpen(false)}
                                className="flex items-center gap-3 px-2 py-1.5 hover:bg-stone-50 transition-colors"
                              >
                                <div className="h-10 w-8 shrink-0 overflow-hidden bg-[#F5F4F0]">
                                  <img 
                                    src={resolveMediaUrl(p.images?.[0] || p.image)} 
                                    alt={p.productName}
                                    className="h-full w-full object-cover"
                                  />
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <span className="truncate text-xs font-semibold text-stone-900">
                                    {p.productName}
                                  </span>
                                  <span className="text-[10px] font-bold tracking-[0.1em] uppercase text-stone-500">
                                    {formatPrice(p.price)}
                                  </span>
                                </div>
                              </Link>
                            ))}
                          </div>
                        ) : (
                          <div className="p-4 text-xs text-stone-500 text-center">
                            No products found for "{searchQuery}"
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsSearchOpen(true)}
                className="flex items-center text-stone-800 transition-colors hover:text-black"
                aria-label="Search"
              >
                <span className="material-symbols-outlined text-xl">search</span>
              </button>
            )}
          </div>

          {/* Wishlist Icon */}
          <Link
            to="/wishlist"
            className="relative flex items-center text-stone-800 transition-colors hover:text-black"
            aria-label="Wishlist"
          >
            <span className="material-symbols-outlined text-xl">favorite</span>
            {wishlist && wishlist.length > 0 && (
              <span className="absolute -right-2 -top-2 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-red-600 text-[9px] font-bold text-white shadow-xs">
                {wishlist.length}
              </span>
            )}
          </Link>

          {/* Account Icon & Dropdown */}
          <div className="relative" ref={menuRef}>
            {user ? (
              <button
                type="button"
                onClick={() => setIsAccountOpen(!isAccountOpen)}
                className="flex items-center text-stone-800 transition-colors hover:text-black"
                aria-label="Account Menu"
              >
                <span className="material-symbols-outlined text-xl">person</span>
              </button>
            ) : (
              <Link
                to="/login"
                className="flex items-center text-stone-800 transition-colors hover:text-black"
                aria-label="Sign In"
              >
                <span className="material-symbols-outlined text-xl">person</span>
              </Link>
            )}

            {isAccountOpen && user && (
              <div className="absolute right-0 top-full mt-3 w-56 border border-stone-200 bg-white p-2 text-stone-900 shadow-xl z-50">
                <div className="border-b border-stone-100 px-3 py-3">
                  <p className="font-headline text-sm font-semibold text-stone-950">
                    {user.name}
                  </p>
                  <p className="text-[10px] font-bold tracking-widest uppercase text-stone-500">
                    {user.role}
                  </p>
                </div>
                <div className="py-1">
                  {user.role === "seller" && (
                    <Link
                      to="/seller"
                      onClick={() => setIsAccountOpen(false)}
                      className="flex items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wider text-stone-700 hover:bg-stone-100"
                    >
                      Dashboard
                      <span className="material-symbols-outlined text-base">dashboard</span>
                    </Link>
                  )}
                  <Link
                    to="/orders"
                    onClick={() => setIsAccountOpen(false)}
                    className="flex items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wider text-stone-700 hover:bg-stone-100"
                  >
                    My Orders
                    <span className="material-symbols-outlined text-base">receipt_long</span>
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wider text-stone-700 hover:bg-stone-100"
                  >
                    Logout
                    <span className="material-symbols-outlined text-base">logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Cart Icon */}
          <Link
            to="/cart"
            className="flex items-center text-stone-800 transition-colors hover:text-black"
            aria-label="Cart"
          >
            <span className="material-symbols-outlined text-xl">shopping_bag</span>
          </Link>
        </div>
      </div>

      {/* Mobile Category Dropdown Menu */}
      {isMobileMenuOpen && (
        <div className="border-t border-stone-200 bg-stone-50 px-6 py-4 lg:hidden">
          <div className="flex flex-col space-y-3 text-xs font-semibold tracking-widest uppercase text-stone-800">
            {CATEGORY_NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                to={link.to}
                onClick={() => setIsMobileMenuOpen(false)}
                className="py-1 transition-colors hover:text-black"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
