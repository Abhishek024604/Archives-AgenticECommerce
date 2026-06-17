import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-inverse-surface/92 text-white backdrop-blur-xl">
      <div className="flex justify-between items-center w-full px-5 py-5 md:px-10 mx-auto">
        <div className="flex items-center gap-8">
          <Link
            to="/"
            className="font-headline text-xl font-normal uppercase tracking-[0.34em] text-white md:text-2xl"
          >
            ARCHIVIST
          </Link>
          <div className="hidden md:flex gap-8 lg:gap-10">
            <Link
              to="/products"
              className="pb-1 text-[10px] font-bold uppercase tracking-[0.22em] text-white"
            >
              Shop
            </Link>
            <Link
              to="/communities"
              className="pb-1 text-[10px] font-bold uppercase tracking-[0.22em] text-white/75 transition-opacity hover:opacity-70"
            >
              Communities
            </Link>
            <Link
              to="/archives"
              className="pb-1 text-[10px] font-bold uppercase tracking-[0.22em] text-white/75 transition-opacity hover:opacity-70"
            >
              Journal
            </Link>
            <Link
              to="/about"
              className="pb-1 text-[10px] font-bold uppercase tracking-[0.22em] text-white/75 transition-opacity hover:opacity-70"
            >
              About
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-6 text-white">
          <Link
            to="/products"
            aria-label="Search products"
            className="hover:opacity-70 transition-opacity duration-300 active:scale-95 ease-in-out"
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
            <button
              onClick={logout}
              aria-label="Logout"
              className="hover:opacity-70 transition-opacity duration-300 active:scale-95 ease-in-out"
            >
              <span className="material-symbols-outlined">person</span>
            </button>
          ) : (
            <Link
              to="/login"
              aria-label="Login"
              className="hover:opacity-70 transition-opacity duration-300 active:scale-95 ease-in-out"
            >
              <span className="material-symbols-outlined">person</span>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
