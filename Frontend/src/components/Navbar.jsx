import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const handleLogout = async () => {
    await logout();
    setIsMenuOpen(false);
    navigate("/");
  };

  const navClass = (path) => {
    const active =
      path === "/archives"
        ? location.pathname.startsWith("/archives")
        : location.pathname === path;

    return `pb-1 text-[10px] uppercase tracking-[0.22em] transition-opacity hover:opacity-70 ${
      active ? "font-bold text-white" : "font-normal text-white/65"
    }`;
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-inverse-surface/92 text-white backdrop-blur-xl">
      <div className="mx-auto flex w-full items-center justify-start gap-4 px-5 py-5 md:justify-between md:px-10">
        <div className="flex min-w-0 items-center gap-8">
          <Link
            to="/"
            className="font-headline text-xl font-normal uppercase tracking-[0.34em] text-white md:text-2xl"
          >
            ARCHIVIST
          </Link>
          <div className="hidden md:flex gap-8 lg:gap-10">
            <Link
              to="/products"
              className={navClass("/products")}
            >
              Shop
            </Link>
            <Link
              to="/communities"
              className={navClass("/communities")}
            >
              Communities
            </Link>
            <Link
              to="/archives"
              className={navClass("/archives")}
            >
              Journal
            </Link>
            <Link
              to="/about"
              className={navClass("/about")}
            >
              About
            </Link>
          </div>
        </div>
        <div className="ml-5 flex shrink-0 items-center gap-4 text-white md:ml-0 md:gap-6">
          <Link
            to="/products"
            aria-label="Search products"
            className="hidden transition-opacity duration-300 ease-in-out hover:opacity-70 active:scale-95 sm:inline-flex"
          >
            <span className="material-symbols-outlined">search</span>
          </Link>
          <Link
            to="/cart"
            aria-label="Open cart"
            className="hover:opacity-70 transition-opacity duration-300 active:scale-95 ease-in-out"
          >
            <span className="material-symbols-outlined">shopping_bag</span>
          </Link>
          {user ? (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                aria-label="Account menu"
                aria-expanded={isMenuOpen}
                onClick={() => setIsMenuOpen((open) => !open)}
                className="hover:opacity-70 transition-opacity duration-300 active:scale-95 ease-in-out"
              >
                <span className="material-symbols-outlined">person</span>
              </button>
              {isMenuOpen ? (
                <div className="absolute right-0 top-full mt-4 min-w-[220px] border border-white/10 bg-surface-container-lowest shadow-[0px_24px_48px_rgba(0,0,0,0.35)]">
                  <div className="border-b border-outline-variant/30 px-5 py-4">
                    <p className="font-headline text-lg text-on-background">
                      {user.name}
                    </p>
                    <p className="mt-1 text-[10px] uppercase tracking-[0.2em] font-bold text-on-surface-variant">
                      {user.role}
                    </p>
                  </div>
                  <div className="p-2">
                    {user.role === "seller" ? (
                      <Link
                        to="/seller"
                        onClick={() => setIsMenuOpen(false)}
                        className="flex w-full items-center justify-between px-3 py-3 text-left text-[11px] uppercase tracking-[0.2em] font-bold text-on-surface hover:bg-surface-container-low transition-colors"
                      >
                        Dashboard
                        <span className="material-symbols-outlined text-base">
                          dashboard
                        </span>
                      </Link>
                    ) : null}
                    <Link
                      to="/orders"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex w-full items-center justify-between px-3 py-3 text-left text-[11px] uppercase tracking-[0.2em] font-bold text-on-surface hover:bg-surface-container-low transition-colors"
                    >
                      My Orders
                      <span className="material-symbols-outlined text-base">
                        receipt_long
                      </span>
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center justify-between px-3 py-3 text-left text-[11px] uppercase tracking-[0.2em] font-bold text-on-surface hover:bg-surface-container-low transition-colors"
                    >
                      Logout
                      <span className="material-symbols-outlined text-base">
                        logout
                      </span>
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <Link
              to="/signup"
              aria-label="Account"
              className="inline-flex transition-opacity duration-300 hover:opacity-70 active:scale-95"
            >
              <span className="material-symbols-outlined">person</span>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
