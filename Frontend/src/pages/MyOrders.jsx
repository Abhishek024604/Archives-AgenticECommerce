import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { getMyOrders } from "../api/order";
import { formatPrice } from "../utils/currency";
import { resolveMediaUrl } from "../utils/media";
import HomeNavbar from "../components/home/HomeNavbar";
import HomeFooter from "../components/home/HomeFooter";

export default function MyOrders() {
  const location = useLocation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadOrders = async () => {
      try {
        setLoading(true);
        const res = await getMyOrders();
        setOrders(res.data || []);
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to load order history.");
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, []);

  return (
    <div className="min-h-screen bg-white text-stone-900 font-sans selection:bg-stone-900 selection:text-white flex flex-col justify-between">
      <HomeNavbar />

      <main className="mx-auto max-w-[1536px] w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8 flex-1">
        
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-[11px] font-medium text-stone-500 uppercase tracking-wider">
          <Link to="/" className="hover:text-stone-900 transition-colors">
            Home
          </Link>
          <span>›</span>
          <span className="text-stone-900 font-semibold">My Orders</span>
        </nav>

        {/* Page Header Title */}
        <div className="border-b border-stone-200 pb-6 flex items-baseline justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-headline text-3xl sm:text-5xl font-normal text-stone-950">
              Order History
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-stone-500 font-light">
              Review your past purchases, shipment statuses, and invoices.
            </p>
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
            {orders.length} {orders.length === 1 ? "Order" : "Orders"}
          </span>
        </div>

        {/* Order Placed Success Banner */}
        {location.state?.orderPlaced && (
          <div className="border border-emerald-300 bg-emerald-50 text-emerald-900 p-4 rounded-xl text-xs font-semibold flex items-center gap-3">
            <span className="material-symbols-outlined text-emerald-600">check_circle</span>
            <span>
              Order placed successfully! Order ID: {location.state?.orderId || "Confirmed"}.
            </span>
          </div>
        )}

        {/* Content Section */}
        {error ? (
          <div className="border border-red-200 bg-red-50 p-6 text-xs text-red-700 rounded-xl">
            {error}
          </div>
        ) : loading ? (
          <div className="py-20 text-center text-xs font-medium text-stone-500">
            Loading order history...
          </div>
        ) : orders.length === 0 ? (
          <div className="border border-stone-200 bg-[#FAFAFA] py-16 px-6 text-center rounded-xl">
            <span className="material-symbols-outlined text-4xl text-stone-400 mb-3">
              receipt_long
            </span>
            <h3 className="font-headline text-2xl text-stone-900">
              No orders placed yet
            </h3>
            <p className="mt-2 text-xs text-stone-500 max-w-sm mx-auto">
              When you complete a purchase, your order history and tracking info will appear here.
            </p>
            <Link
              to="/products"
              className="mt-6 inline-block bg-stone-950 text-white px-8 py-3 text-xs font-bold uppercase tracking-wider hover:bg-black transition-colors rounded-md"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const statusColor =
                order.status?.toLowerCase() === "delivered"
                  ? "bg-emerald-100 text-emerald-800"
                  : order.status?.toLowerCase() === "shipped"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-amber-100 text-amber-800";

              return (
                <div
                  key={order._id}
                  className="border border-stone-200 bg-[#FAFAFA] p-6 rounded-2xl space-y-6 transition-all hover:bg-white hover:shadow-xs"
                >
                  {/* Order Header Info */}
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-200 pb-4">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">
                        Order #{order.orderId || order._id?.slice(-8)}
                      </span>
                      <div className="mt-1 flex items-center gap-3">
                        <span className={`px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-full ${statusColor}`}>
                          {order.status || "Processing"}
                        </span>
                        <span className="text-xs text-stone-500">
                          Placed on {new Date(order.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">
                        Total Amount
                      </span>
                      <p className="font-headline text-xl font-medium text-stone-950">
                        {formatPrice(order.totalAmount)}
                      </p>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="space-y-4">
                    {order.items.map((item, index) => (
                      <div
                        key={`${order._id}-${index}`}
                        className="flex items-center gap-4 bg-white p-3.5 border border-stone-200/80 rounded-xl"
                      >
                        <div className="h-20 w-16 shrink-0 overflow-hidden rounded-lg bg-[#F5F4F0] border border-stone-200">
                          {item.image ? (
                            <img
                              src={resolveMediaUrl(item.image)}
                              alt={item.productName}
                              className="h-full w-full object-cover object-top"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-stone-300">
                              <span className="material-symbols-outlined text-xl">image</span>
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div>
                            <span className="text-[9px] font-bold uppercase tracking-widest text-stone-400">
                              {item.brandName || "Archivist"}
                            </span>
                            <h4 className="font-headline text-base font-medium text-stone-950 truncate">
                              {item.productName}
                            </h4>
                          </div>

                          <div className="mt-2 flex items-center justify-between text-xs text-stone-600">
                            <span>Size: <strong className="text-stone-900">{item.size}</strong> • Qty: <strong className="text-stone-900">{item.quantity}</strong></span>
                            <span className="font-semibold text-stone-950">{formatPrice(item.price)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Footer Actions */}
                  <div className="pt-2 flex items-center justify-between text-xs">
                    <span className="text-stone-500">
                      Standard Express Shipping
                    </span>
                    <button
                      type="button"
                      onClick={() => alert(`Tracking details for ${order.orderId || order._id}`)}
                      className="border border-stone-300 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-stone-800 hover:bg-stone-950 hover:text-white rounded-md transition-colors"
                    >
                      Track Package
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </main>

      <HomeFooter />
    </div>
  );
}
