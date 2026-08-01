import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getSellerOrders, dispatchSellerOrder } from "../api/order";
import { API } from "../api/axios";
import { useAuth } from "../context/AuthContext";
import SellerLayout from "./components/SellerLayout";

export default function SellerOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Filters
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState("ALL");
  const [paymentFilter, setPaymentFilter] = useState("ALL");

  const [currentPage, setCurrentPage] = useState(1);
  const [processingOrderId, setProcessingOrderId] = useState(null);
  const ordersPerPage = 10;

  useEffect(() => {
    if (!user?._id || user.role !== "seller") return;

    let cancelled = false;

    const loadData = async () => {
      try {
        setLoading(true);
        setError("");
        const [ordersRes, reviewsRes] = await Promise.all([
          getSellerOrders(),
          API.get("/reviews/seller").catch(() => ({ data: [] }))
        ]);
        if (!cancelled) {
          setOrders(ordersRes.data || []);
          setReviews(reviewsRes.data || []);
        }
      } catch (err) {
        if (!cancelled) setError(err?.response?.data?.message || "Failed to load data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadData();

    return () => {
      cancelled = true;
    };
  }, [user?._id, user?.role]);

  const { totalOrders, delivered, shipped, processing, cancelledOrders } = useMemo(() => {
    const total = orders.length;
    let del = 0;
    let ship = 0;
    let proc = 0;
    let canc = 0;

    orders.forEach(order => {
      if (order.sellerStatus === "PROCESSED" || order.sellerStatus === "DELIVERED") del++;
      else if (order.sellerStatus === "SHIPPED") ship++;
      else if (order.sellerStatus === "CANCELLED") canc++;
      else proc++; // default/processing
    });

    return { totalOrders: total, delivered: del, shipped: ship, processing: proc, cancelledOrders: canc };
  }, [orders]);

  const calculatePercentage = (count, total) => {
    if (total === 0) return "0%";
    return ((count / total) * 100).toFixed(1) + "%";
  };

  const topSellingProduct = useMemo(() => {
    const productSales = {};
    orders.forEach((order) => {
      (order.items || []).forEach((item) => {
        if (!productSales[item.productId]) {
          productSales[item.productId] = {
            id: item.productId,
            name: item.productName,
            image: item.image,
            unitsSold: 0,
          };
        }
        productSales[item.productId].unitsSold += (Number(item.quantity) || 0);
      });
    });

    const sorted = Object.values(productSales).sort((a, b) => b.unitsSold - a.unitsSold);
    return sorted[0] || null;
  }, [orders]);

  const averageOrderValue = useMemo(() => {
    if (orders.length === 0) return 0;
    const totalRevenue = orders.reduce((sum, order) => sum + (Number(order.sellerTotalAmount) || 0), 0);
    return totalRevenue / orders.length;
  }, [orders]);

  const customerSatisfaction = useMemo(() => {
    if (reviews.length === 0) return { average: 0, count: 0 };
    const total = reviews.reduce((sum, r) => sum + r.rating, 0);
    return {
      average: (total / reviews.length).toFixed(1),
      count: reviews.length
    };
  }, [reviews]);

  const filteredOrders = useMemo(() => {
    let filtered = orders;

    // Search Filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(o => 
        o.orderId?.toLowerCase().includes(q) || 
        o.user?.name?.toLowerCase().includes(q) ||
        o.shippingAddress?.name?.toLowerCase().includes(q)
      );
    }

    // Status Filter
    if (statusFilter !== "ALL") {
      filtered = filtered.filter(o => {
        const isProcessed = o.sellerStatus === "PROCESSED" || o.sellerStatus === "DELIVERED";
        if (statusFilter === "PROCESSED" && isProcessed) return true;
        if (statusFilter === "SHIPPED" && o.sellerStatus === "SHIPPED") return true;
        if (statusFilter === "CANCELLED" && o.sellerStatus === "CANCELLED") return true;
        if (statusFilter === "PROCESSING" && !isProcessed && o.sellerStatus !== "SHIPPED" && o.sellerStatus !== "CANCELLED") return true;
        return false;
      });
    }

    // Date Filter
    if (dateFilter !== "ALL") {
      const now = new Date();
      filtered = filtered.filter(o => {
        const orderDate = new Date(o.createdAt);
        const diffTime = Math.abs(now - orderDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (dateFilter === "TODAY") return diffDays <= 1;
        if (dateFilter === "WEEK") return diffDays <= 7;
        if (dateFilter === "MONTH") return diffDays <= 30;
        return true;
      });
    }

    // Payment Filter
    if (paymentFilter !== "ALL") {
      filtered = filtered.filter(o => {
        const isPaid = o.paymentStatus === "PAID" || o.paymentMethod !== "COD";
        if (paymentFilter === "PAID") return isPaid;
        if (paymentFilter === "COD") return !isPaid;
        return true;
      });
    }

    return filtered;
  }, [orders, searchQuery, statusFilter, dateFilter, paymentFilter]);

  const currentOrders = useMemo(() => {
    const start = (currentPage - 1) * ordersPerPage;
    return filteredOrders.slice(start, start + ordersPerPage);
  }, [filteredOrders, currentPage]);

  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

  const handleMarkProcessed = async (orderId) => {
    try {
      setProcessingOrderId(orderId);
      const res = await dispatchSellerOrder(orderId);
      setOrders(orders.map(o => o._id === orderId ? res.data : o));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to mark as processed");
    } finally {
      setProcessingOrderId(null);
    }
  };

  const formatPrice = (value) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value || 0);
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return {
      date: date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      time: date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
    };
  };

  const exportToCSV = () => {
    if (filteredOrders.length === 0) {
      alert("No orders to export.");
      return;
    }

    const headers = ["Order ID", "Date", "Customer Name", "Phone", "Amount", "Payment", "Status", "Items"];
    const rows = filteredOrders.map(order => {
      const dt = formatDate(order.createdAt);
      const isPaid = order.paymentStatus === "PAID" || order.paymentMethod !== "COD";
      
      let statusText = "Processing";
      if (order.sellerStatus === "PROCESSED" || order.sellerStatus === "DELIVERED") statusText = "Processed";
      else if (order.sellerStatus === "SHIPPED") statusText = "Shipped";
      else if (order.sellerStatus === "CANCELLED") statusText = "Cancelled";

      const itemsStr = order.items?.map(i => `${i.productName} (x${i.quantity})`).join("; ") || "";

      return [
        order.orderId || order._id,
        `${dt.date} ${dt.time}`,
        `"${order.shippingAddress?.name || "Customer"}"`,
        `"${order.shippingAddress?.phone || ""}"`,
        order.sellerTotalAmount,
        isPaid ? "Paid" : "COD",
        statusText,
        `"${itemsStr}"`
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `orders_export_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <SellerLayout activeTab="orders">
      {/* Header */}
      <header className="mb-10 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
        <div>
          <h1 className="font-headline text-4xl font-bold leading-tight tracking-tight text-stone-950 md:text-5xl">
            Orders
          </h1>
          <p className="mt-3 text-sm text-stone-500">
            Track and manage all customer orders from one place.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button onClick={exportToCSV} className="flex items-center justify-center gap-2 rounded-lg bg-stone-950 px-5 py-2.5 text-[11px] font-bold text-white transition-colors hover:bg-black">
            <span className="material-symbols-outlined text-sm">download</span>
            Export Orders
          </button>
        </div>
      </header>

      {/* Metrics Row */}
      <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard
          icon="shopping_bag"
          title="TOTAL ORDERS"
          value={totalOrders}
          hint="All Time"
          actionLabel="View all orders"
          onActionClick={() => setStatusFilter("ALL")}
        />
        <MetricCard
          icon="local_shipping"
          title="DELIVERED"
          value={delivered}
          hint={`${calculatePercentage(delivered, totalOrders)} of total`}
          actionLabel="View delivered"
          valueColor="text-stone-950"
          iconColor="text-green-600"
          iconBg="bg-green-50 border-green-100"
          actionColor="text-green-600"
          onActionClick={() => setStatusFilter("PROCESSED")}
        />
        <MetricCard
          icon="inventory_2"
          title="SHIPPED"
          value={shipped}
          hint={`${calculatePercentage(shipped, totalOrders)} of total`}
          actionLabel="View shipped"
          valueColor="text-stone-950"
          iconColor="text-blue-600"
          iconBg="bg-blue-50 border-blue-100"
          actionColor="text-blue-600"
          onActionClick={() => setStatusFilter("SHIPPED")}
        />
        <MetricCard
          icon="schedule"
          title="PROCESSING"
          value={processing}
          hint={`${calculatePercentage(processing, totalOrders)} of total`}
          actionLabel="View processing"
          valueColor="text-stone-950"
          iconColor="text-orange-500"
          iconBg="bg-orange-50 border-orange-100"
          actionColor="text-orange-500"
          onActionClick={() => setStatusFilter("PROCESSING")}
        />
        <MetricCard
          icon="close"
          title="CANCELLED"
          value={cancelledOrders}
          hint={`${calculatePercentage(cancelledOrders, totalOrders)} of total`}
          actionLabel="View cancelled"
          valueColor="text-stone-950"
          iconColor="text-stone-400"
          iconBg="bg-stone-50 border-stone-200"
          actionColor="text-stone-500"
          onActionClick={() => setStatusFilter("CANCELLED")}
        />
      </section>

      {/* Data Table Section */}
      <section className="mb-8 rounded-2xl border border-stone-200 bg-white">
        {/* Filters Row */}
        <div className="flex flex-col items-center justify-between gap-4 border-b border-stone-200 p-4 md:flex-row">
          <div className="flex w-full flex-wrap items-center gap-3">
            <div className="flex flex-1 items-center gap-2 rounded-lg border border-stone-300 bg-stone-50 px-3 py-2 focus-within:border-stone-950 focus-within:bg-white md:max-w-xs">
              <span className="material-symbols-outlined text-stone-400 text-sm">search</span>
              <input
                type="text"
                placeholder="Search by order ID, customer..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-transparent text-xs text-stone-950 outline-none placeholder:text-stone-400"
              />
            </div>
            
            <FilterSelect 
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              options={[
                { value: "ALL", label: "All Statuses" },
                { value: "PROCESSING", label: "Processing" },
                { value: "PROCESSED", label: "Processed" },
                { value: "SHIPPED", label: "Shipped" },
                { value: "CANCELLED", label: "Cancelled" },
              ]}
            />

            <FilterSelect 
              value={dateFilter}
              onChange={(e) => { setDateFilter(e.target.value); setCurrentPage(1); }}
              options={[
                { value: "ALL", label: "All Time" },
                { value: "TODAY", label: "Today" },
                { value: "WEEK", label: "Last 7 Days" },
                { value: "MONTH", label: "Last 30 Days" },
              ]}
            />

            <FilterSelect 
              value={paymentFilter}
              onChange={(e) => { setPaymentFilter(e.target.value); setCurrentPage(1); }}
              options={[
                { value: "ALL", label: "All Payments" },
                { value: "PAID", label: "Paid" },
                { value: "COD", label: "Cash on Delivery" },
              ]}
            />
          </div>
        </div>

        {error && (
          <div className="m-4 rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-600">
            {error}
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-stone-100 text-[10px] font-bold uppercase tracking-widest text-stone-400 bg-stone-50/50">
                <th className="px-6 py-4 w-12"><input type="checkbox" className="rounded border-stone-300 text-stone-900 focus:ring-stone-900" /></th>
                <th className="px-6 py-4">Order</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Payment</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-700">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-stone-400">Loading orders...</td>
                </tr>
              ) : currentOrders.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-stone-400">No orders found.</td>
                </tr>
              ) : (
                currentOrders.map((order) => {
                  const isProcessed = order.sellerStatus === "PROCESSED" || order.sellerStatus === "DELIVERED";
                  const isCancelled = order.sellerStatus === "CANCELLED";
                  const isShipped = order.sellerStatus === "SHIPPED";
                  
                  let statusColor = "bg-orange-100 text-orange-700";
                  let statusText = "Processing";

                  if (isProcessed) {
                    statusColor = "bg-green-100 text-green-700";
                    statusText = "Processed";
                  } else if (isShipped) {
                    statusColor = "bg-blue-100 text-blue-700";
                    statusText = "Shipped";
                  } else if (isCancelled) {
                    statusColor = "bg-red-100 text-red-700";
                    statusText = "Cancelled";
                  }

                  const firstItem = order.items?.[0] || {};
                  const totalItems = order.items?.length || 1;
                  const dt = formatDate(order.createdAt);
                  const isPaid = order.paymentStatus === "PAID" || order.paymentMethod !== "COD";

                  return (
                    <tr key={order._id} className="hover:bg-stone-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <input type="checkbox" className="rounded border-stone-300 text-stone-900 focus:ring-stone-900" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md bg-stone-100 border border-stone-200">
                            {firstItem.image ? (
                              <img src={firstItem.image} alt="Product" className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-stone-300">
                                <span className="material-symbols-outlined text-lg">image</span>
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-stone-950">{order.orderId || `#${order._id.substring(0, 8).toUpperCase()}`}</p>
                            <p className="mt-0.5 text-[10px] text-stone-500">{totalItems} {totalItems === 1 ? "Item" : "Items"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs font-bold text-stone-950">{order.shippingAddress?.name || "Customer"}</p>
                        <p className="mt-0.5 text-[10px] text-stone-500">{order.shippingAddress?.phone || "+91 XXXXXXXXXX"}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs font-medium text-stone-950">{dt.date}</p>
                        <p className="mt-0.5 text-[10px] text-stone-500">{dt.time}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs font-medium text-stone-950">{formatPrice(order.sellerTotalAmount)}</p>
                        <p className="mt-0.5 text-[10px] text-stone-500">{order.paymentMethod === "COD" ? "COD" : "Online"}</p>
                      </td>
                      <td className="px-6 py-4">
                        {isPaid ? (
                          <span className="inline-flex items-center rounded-sm bg-green-50 px-2 py-0.5 text-[9px] font-bold text-green-700 border border-green-200">
                            Paid ✓
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-sm bg-stone-100 px-2 py-0.5 text-[9px] font-bold text-stone-600 border border-stone-200">
                            COD
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center rounded-sm px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest ${statusColor}`}>
                          {statusText}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2 text-stone-400">
                          {!isProcessed && !isCancelled && (
                            <button
                              onClick={() => handleMarkProcessed(order._id)}
                              disabled={processingOrderId === order._id}
                              className="rounded border border-stone-300 bg-white px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-stone-700 hover:bg-stone-50 hover:text-stone-950 disabled:opacity-50 transition-colors"
                            >
                              {processingOrderId === order._id ? "..." : "Process"}
                            </button>
                          )}
                          <Link to={`/seller/orders/${order._id}`} className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-stone-100 hover:text-stone-950 transition-colors" title="View Order">
                            <span className="material-symbols-outlined text-[16px]">visibility</span>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {!loading && filteredOrders.length > 0 && (
          <div className="flex items-center justify-between border-t border-stone-100 px-6 py-4">
            <p className="text-xs text-stone-500">
              Showing {(currentPage - 1) * ordersPerPage + 1} to {Math.min(currentPage * ordersPerPage, filteredOrders.length)} of {filteredOrders.length} orders
            </p>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex h-8 w-8 items-center justify-center rounded-md text-stone-500 hover:bg-stone-50 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[16px]">chevron_left</span>
              </button>
              
              {Array.from({ length: Math.min(totalPages, 5) }).map((_, idx) => {
                const pageNum = idx + 1;
                return (
                  <button 
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`flex h-8 w-8 items-center justify-center rounded-md text-xs font-bold ${
                      currentPage === pageNum ? "bg-[#EFE9E0] text-stone-950 border border-[#E5DFD6]" : "text-stone-500 hover:bg-stone-50"
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              })}
              
              {totalPages > 5 && <span className="px-2 text-xs text-stone-400">...</span>}
              {totalPages > 5 && (
                <button 
                  onClick={() => setCurrentPage(totalPages)}
                  className={`flex h-8 w-8 items-center justify-center rounded-md text-xs font-bold ${
                    currentPage === totalPages ? "bg-[#EFE9E0] text-stone-950 border border-[#E5DFD6]" : "text-stone-500 hover:bg-stone-50"
                  }`}
                >
                  {totalPages}
                </button>
              )}

              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="flex h-8 w-8 items-center justify-center rounded-md text-stone-500 hover:bg-stone-50 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Bottom Widgets Row */}
      <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Top Selling Product */}
        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <h4 className="font-headline text-[15px] font-bold text-stone-950">Top Selling Product</h4>
          {topSellingProduct ? (
            <div className="mt-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs text-stone-600 font-medium">{topSellingProduct.name}</p>
                <p className="mt-1 text-[10px] text-stone-500">{topSellingProduct.unitsSold} orders</p>
                <Link to="/seller/my-products" className="mt-6 flex items-center gap-1.5 text-[11px] font-bold text-stone-950 hover:underline">
                  View all products <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </Link>
              </div>
              <div className="h-24 w-20 shrink-0 overflow-hidden rounded-lg bg-stone-100">
                {topSellingProduct.image ? (
                  <img src={topSellingProduct.image} alt={topSellingProduct.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-stone-300">
                    <span className="material-symbols-outlined text-xl">image</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="mt-4 text-xs text-stone-400">No sales data yet.</p>
          )}
        </div>

        {/* Average Order Value */}
        <div className="relative overflow-hidden rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <h4 className="font-headline text-[15px] font-bold text-stone-950">Average Order Value</h4>
          <div className="mt-2 flex items-center gap-2">
            <span className="font-headline text-2xl font-bold text-stone-950">{formatPrice(averageOrderValue)}</span>
          </div>
          <p className="mt-1 text-[10px] text-stone-500">Based on processed orders</p>
          
          <Link to="/seller/analytics" className="mt-4 flex items-center gap-1.5 text-[11px] font-bold text-stone-950 hover:underline">
            View analytics <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </Link>

          <div className="absolute -bottom-2 -right-4 h-16 w-32 opacity-40">
            <svg viewBox="0 0 100 40" className="h-full w-full" preserveAspectRatio="none">
              <path d="M0,30 Q10,10 20,25 T40,20 T60,35 T80,15 T100,5" fill="none" stroke="#B4966E" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* Customer Satisfaction */}
        <div className="relative overflow-hidden rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <h4 className="font-headline text-[15px] font-bold text-stone-950">Customer Satisfaction</h4>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="font-headline text-2xl font-bold text-stone-950">{customerSatisfaction.average}</span>
            <span className="text-[11px] font-bold text-stone-500">/ 5</span>
          </div>
          <div className="mt-1 flex text-amber-400 text-sm">
            {"★".repeat(Math.round(customerSatisfaction.average || 0))}{"☆".repeat(5 - Math.round(customerSatisfaction.average || 0))}
          </div>
          <p className="mt-1 text-[10px] text-stone-500">Based on {customerSatisfaction.count} reviews</p>
          
          <Link to="/seller/reviews" className="mt-4 flex items-center gap-1.5 text-[11px] font-bold text-stone-950 hover:underline">
            View reviews <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </Link>

          <div className="absolute bottom-6 right-6 flex h-12 w-12 items-center justify-center rounded-full bg-[#EFE9E0] text-stone-700">
            <span className="material-symbols-outlined text-2xl">sentiment_very_satisfied</span>
          </div>
        </div>
      </section>
    </SellerLayout>
  );
}

function MetricCard({ icon, title, value, hint, actionLabel, onActionClick, valueColor = "text-stone-950", iconColor = "text-stone-500", iconBg = "bg-stone-50 border-stone-100", actionColor = "text-stone-600" }) {
  return (
    <div className="flex flex-col justify-between rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
      <div>
        <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-full border ${iconBg} ${iconColor}`}>
          <span className="material-symbols-outlined text-[18px]">{icon}</span>
        </div>
        <p className={`text-[9px] font-bold uppercase tracking-widest text-stone-500`}>{title}</p>
        <p className={`mt-1 font-headline text-3xl font-bold ${valueColor}`}>{value}</p>
        <p className="mt-2 text-[11px] text-stone-500">{hint}</p>
      </div>
      <div className="mt-6 pt-4 border-t border-stone-100">
        <button onClick={onActionClick} className={`flex items-center gap-1 text-[11px] font-medium hover:underline ${actionColor}`}>
          {actionLabel} <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
        </button>
      </div>
    </div>
  );
}

function FilterSelect({ value, options, onChange }) {
  return (
    <div className="relative shrink-0">
      <select
        value={value}
        onChange={onChange}
        className="appearance-none flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-3 py-2 pr-8 text-xs font-medium text-stone-700 hover:bg-stone-50 focus:outline-none focus:border-stone-950"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 material-symbols-outlined text-[16px] text-stone-400">
        expand_more
      </span>
    </div>
  );
}
