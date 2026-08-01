import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getSellerOrderById, dispatchSellerOrder } from "../api/order";
import { formatPrice } from "../utils/currency";
import SellerLayout from "./components/SellerLayout";

export default function SellerOrderDetail() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const res = await getSellerOrderById(orderId);
        if (!cancelled) setOrder(res.data);
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || "Failed to load order details");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchOrder();
    return () => { cancelled = true; };
  }, [orderId]);

  const handleMarkProcessed = async () => {
    try {
      setProcessing(true);
      const res = await dispatchSellerOrder(orderId);
      setOrder(res.data);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update order status");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <SellerLayout activeTab="orders">
        <div className="py-20 text-center text-sm text-stone-500">Loading order details...</div>
      </SellerLayout>
    );
  }

  if (error || !order) {
    return (
      <SellerLayout activeTab="orders">
        <div className="m-6 rounded-lg border border-red-200 bg-red-50 p-6 text-center text-red-600">
          <h2 className="font-headline text-2xl mb-2">Order Not Found</h2>
          <p className="text-sm mb-4">{error || "The requested order could not be found."}</p>
          <Link to="/seller/orders" className="text-sm font-bold underline">Back to Orders</Link>
        </div>
      </SellerLayout>
    );
  }

  const dt = new Date(order.createdAt);
  const isProcessed = order.sellerStatus === "PROCESSED" || order.sellerStatus === "DELIVERED";
  const isCancelled = order.sellerStatus === "CANCELLED";
  const isShipped = order.sellerStatus === "SHIPPED";

  let statusColor = "bg-orange-100 text-orange-700 border-orange-200";
  let statusText = "Processing";

  if (isProcessed) {
    statusColor = "bg-green-100 text-green-700 border-green-200";
    statusText = "Processed";
  } else if (isShipped) {
    statusColor = "bg-blue-100 text-blue-700 border-blue-200";
    statusText = "Shipped";
  } else if (isCancelled) {
    statusColor = "bg-red-100 text-red-700 border-red-200";
    statusText = "Cancelled";
  }

  const isPaid = order.paymentStatus === "PAID" || order.paymentMethod !== "COD";

  return (
    <SellerLayout activeTab="orders">
      <header className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link to="/seller/orders" className="text-stone-400 hover:text-stone-900 transition-colors">
              <span className="material-symbols-outlined text-sm">arrow_back</span>
            </Link>
            <span className="text-xs font-bold uppercase tracking-widest text-stone-500">Order Detail</span>
          </div>
          <h1 className="font-headline text-3xl font-bold text-stone-950 flex items-center gap-4">
            {order.orderId || `#${order._id.substring(0, 8).toUpperCase()}`}
            <span className={`inline-flex items-center rounded-sm px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest border ${statusColor}`}>
              {statusText}
            </span>
          </h1>
          <p className="mt-2 text-sm text-stone-500">
            Placed on {dt.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} at {dt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
        
        {!isProcessed && !isCancelled && (
          <button
            onClick={handleMarkProcessed}
            disabled={processing}
            className="flex items-center justify-center gap-2 rounded-lg bg-stone-950 px-6 py-3 text-[12px] font-bold uppercase tracking-widest text-white transition-colors hover:bg-black disabled:opacity-50"
          >
            {processing ? "Updating..." : "Mark as Processed"}
            <span className="material-symbols-outlined text-[16px]">check_circle</span>
          </button>
        )}
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          {/* Order Items */}
          <section className="rounded-2xl border border-stone-200 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-stone-100 bg-stone-50/50 px-6 py-4">
              <h2 className="font-headline text-lg font-bold text-stone-950">Products Ordered ({order.sellerItemCount})</h2>
            </div>
            <div className="divide-y divide-stone-100">
              {order.items?.map((item) => (
                <div key={`${item.productId}-${item.size}`} className="flex flex-col sm:flex-row gap-6 p-6">
                  <div className="h-24 w-20 shrink-0 overflow-hidden rounded-lg bg-stone-100 border border-stone-200">
                    {item.image ? (
                      <img src={item.image} alt={item.productName} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-stone-300">
                        <span className="material-symbols-outlined">image</span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-stone-500 mb-1">{item.brandName || "Brand"}</p>
                        <h3 className="font-headline text-lg font-medium text-stone-950">{item.productName}</h3>
                        <p className="mt-1 text-sm text-stone-500">Size: <span className="font-medium text-stone-900">{item.size}</span></p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-stone-950">{formatPrice(item.price)}</p>
                        <p className="mt-1 text-xs text-stone-500">Qty: {item.quantity}</p>
                      </div>
                    </div>
                    <div className="mt-4 flex justify-between items-center pt-4 border-t border-stone-100">
                      <span className="text-xs text-stone-500">Subtotal</span>
                      <span className="font-bold text-stone-950">{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Payment Summary */}
          <section className="rounded-2xl border border-stone-200 bg-white shadow-sm overflow-hidden">
             <div className="border-b border-stone-100 bg-stone-50/50 px-6 py-4">
              <h2 className="font-headline text-lg font-bold text-stone-950">Payment Summary</h2>
            </div>
            <div className="p-6">
              <div className="flex justify-between items-center py-2 text-sm text-stone-600">
                <span>Subtotal ({order.sellerItemCount} items)</span>
                <span>{formatPrice(order.sellerTotalAmount)}</span>
              </div>
              <div className="flex justify-between items-center py-2 text-sm text-stone-600">
                <span>Shipping</span>
                <span>{formatPrice(0)}</span>
              </div>
              <div className="flex justify-between items-center py-4 mt-2 border-t border-stone-100">
                <span className="font-bold text-stone-950">Total Earnings</span>
                <span className="font-headline text-2xl font-bold text-stone-950">{formatPrice(order.sellerTotalAmount)}</span>
              </div>
              
              <div className="mt-4 flex items-center justify-between rounded-lg bg-stone-50 p-4 border border-stone-200">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-stone-400">
                    {order.paymentMethod === "COD" ? "local_shipping" : "credit_card"}
                  </span>
                  <div>
                    <p className="text-xs font-bold text-stone-950">{order.paymentMethod === "COD" ? "Cash on Delivery" : "Online Payment"}</p>
                    <p className="text-[10px] text-stone-500">Method</p>
                  </div>
                </div>
                <div>
                  {isPaid ? (
                    <span className="inline-flex items-center rounded-sm bg-green-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-green-700 border border-green-200">
                      Paid
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-sm bg-stone-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-stone-600 border border-stone-200">
                      Pending
                    </span>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-8">
          <section className="rounded-2xl border border-stone-200 bg-white shadow-sm overflow-hidden">
             <div className="border-b border-stone-100 bg-stone-50/50 px-6 py-4">
              <h2 className="font-headline text-lg font-bold text-stone-950">Customer Details</h2>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1">Contact</p>
                <p className="text-sm font-medium text-stone-950">{order.shippingAddress?.name || "Customer"}</p>
                <p className="text-sm text-stone-500">{order.user?.email}</p>
                <p className="text-sm text-stone-500">{order.shippingAddress?.phone}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1">Shipping Address</p>
                <p className="text-sm text-stone-900">{order.shippingAddress?.name}</p>
                <p className="text-sm text-stone-500 mt-1">{order.shippingAddress?.addressLine}</p>
                <p className="text-sm text-stone-500">{order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.pincode}</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </SellerLayout>
  );
}

