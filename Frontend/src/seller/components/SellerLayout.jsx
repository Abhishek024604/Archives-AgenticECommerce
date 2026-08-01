import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const SIDEBAR_LINKS = [
  { id: "dashboard", label: "Dashboard", icon: "dashboard", href: "/seller" },
  { id: "orders", label: "Orders", icon: "receipt_long", href: "/seller/orders" },
  { id: "inventory", label: "Inventory", icon: "warehouse", href: "/seller/my-products" },
  { id: "customers", label: "Customers", icon: "group", href: "/seller/customers" },
  { id: "analytics", label: "Analytics", icon: "bar_chart", href: "/seller/analytics" },
  { id: "payouts", label: "Payouts", icon: "payments", href: "/seller/payouts" },
  { id: "discounts", label: "Discounts", icon: "sell", href: "/seller/discounts" },
  { id: "reviews", label: "Reviews", icon: "reviews", href: "/seller/reviews" },
];

export default function SellerLayout({ children, activeTab = "dashboard" }) {
  const { user } = useAuth();
  const storeName = user?.sellerInfo?.storeName || "Your Store";

  if (user && user.role !== "seller") {
    return (
      <main className="mx-auto max-w-4xl px-6 py-16 md:px-12">
        <div className="border border-outline-variant/15 bg-white p-10 text-center rounded-2xl">
          <h1 className="font-headline text-3xl text-stone-950">Seller access only</h1>
          <p className="mt-4 text-sm leading-relaxed text-stone-600">This dashboard is available only to accounts with the seller role.</p>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F9F8]">
      <div className="mx-auto flex max-w-[1400px]">
        {/* Sidebar */}
        <aside className="hidden w-64 flex-col border-r border-stone-200 bg-white py-8 lg:flex shrink-0">
          <div className="px-6 mb-8">
            <span className="text-[9px] font-bold uppercase tracking-widest text-stone-500">MERCHANT</span>
            <div className="mt-4 flex flex-col items-center">
              <div className="h-16 w-16 overflow-hidden rounded-full border border-stone-200">
                <img
                  src={`https://api.dicebear.com/7.x/initials/svg?seed=${user?.name}&backgroundColor=f0ede6&textColor=2f3430`}
                  alt="Avatar"
                  className="h-full w-full object-cover"
                />
              </div>
              <h2 className="mt-3 font-headline text-lg font-bold text-stone-950">{storeName}</h2>
              <p className="text-[10px] text-stone-500 mt-0.5">Seller ID: {user?._id ? user._id.substring(0, 8).toUpperCase() : ""}</p>
              <div className="mt-2 flex items-center gap-1.5 rounded-full bg-green-50 px-2 py-0.5 border border-green-100">
                <span className="material-symbols-outlined text-[10px] text-green-600">verified</span>
                <span className="text-[9px] font-bold text-green-700">Verified Seller</span>
              </div>
            </div>
          </div>

          <nav className="flex-1 space-y-0.5 px-4">
            {SIDEBAR_LINKS.map((link) => {
              const isActive = link.id === activeTab;
              return (
                <Link
                  key={link.id}
                  to={link.href}
                  className={`flex items-center gap-3 rounded-lg px-4 py-2.5 text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-[#F6F4F0] text-stone-950"
                      : "text-stone-600 hover:bg-stone-50 hover:text-stone-950"
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">{link.icon}</span>
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="px-6 mt-8">
            <div className="rounded-xl border border-stone-200 p-4">
              <h4 className="font-headline font-bold text-stone-950">Need Help?</h4>
              <p className="mt-2 text-[10px] leading-relaxed text-stone-500">Our support team is here to help you 24/7.</p>
              <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-stone-200 bg-white py-2 text-[10px] font-bold text-stone-700 hover:bg-stone-50 transition-colors">
                <span className="material-symbols-outlined text-sm">support_agent</span>
                Contact Support
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 px-4 py-8 sm:px-8 md:py-12 overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
