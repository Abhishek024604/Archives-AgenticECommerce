import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function SellerDashboardButton() {
  const { user } = useAuth();
  const location = useLocation();

  if (!user || user.role !== "seller") {
    return null;
  }

  // Don't show the button if we are already in a seller route
  if (location.pathname.startsWith("/seller")) {
    return null;
  }

  return (
    <Link
      to="/seller"
      className="group fixed bottom-6 left-6 z-[70] flex h-13 items-center gap-0 overflow-hidden rounded-full bg-stone-950 border border-stone-800 px-3 text-white shadow-[0_16px_40px_rgba(0,0,0,0.4)] transition-all duration-300 hover:border-stone-600 hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
      aria-label="Go to Seller Dashboard"
    >
      <span className="material-symbols-outlined text-white text-xl p-1">
        dashboard
      </span>

      <span className="w-0 overflow-hidden whitespace-nowrap text-[11px] font-bold uppercase tracking-[0.18em] text-white opacity-0 transition-all duration-300 group-hover:ml-3 group-hover:w-[150px] group-hover:opacity-100">
        Seller Dashboard
      </span>
    </Link>
  );
}
