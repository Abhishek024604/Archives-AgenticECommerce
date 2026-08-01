import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getSellerOrders } from "../api/order";
import { useAuth } from "../context/AuthContext";
import SellerLayout from "./components/SellerLayout";

export default function SellerCustomers() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const customersPerPage = 8;

  useEffect(() => {
    if (!user?._id || user.role !== "seller") return;

    let cancelled = false;

    const loadOrders = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await getSellerOrders();
        if (!cancelled) setOrders(res.data || []);
      } catch (err) {
        if (!cancelled) setError(err?.response?.data?.message || "Failed to load orders");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadOrders();

    return () => {
      cancelled = true;
    };
  }, [user?._id, user?.role]);

  // Aggregate orders into unique customers
  const customers = useMemo(() => {
    const customerMap = {};

    orders.forEach(order => {
      // Use email as unique identifier, fallback to user id if email not available, or just a mock if neither
      const customerKey = order.shippingAddress?.email || order.user?._id || `unknown-${order._id}`;
      
      if (!customerMap[customerKey]) {
        customerMap[customerKey] = {
          id: customerKey,
          name: order.user?.name || order.shippingAddress?.fullName || "Customer",
          email: order.shippingAddress?.email || "No email provided",
          phone: order.shippingAddress?.phone || "No phone provided",
          totalOrders: 0,
          totalSpend: 0,
          firstOrderDate: order.createdAt,
          lastOrderDate: order.createdAt,
          orders: []
        };
      }
      
      const c = customerMap[customerKey];
      c.totalOrders++;
      c.totalSpend += (Number(order.sellerTotalAmount) || 0);
      c.orders.push(order);
      
      if (new Date(order.createdAt) < new Date(c.firstOrderDate)) {
        c.firstOrderDate = order.createdAt;
      }
      if (new Date(order.createdAt) > new Date(c.lastOrderDate)) {
        c.lastOrderDate = order.createdAt;
      }
    });

    // Assign Segments
    const now = new Date();
    return Object.values(customerMap).map(c => {
      let segment = "New";
      let segmentColor = "bg-purple-100 text-purple-700";

      const daysSinceLastOrder = (now - new Date(c.lastOrderDate)) / (1000 * 60 * 60 * 24);

      if (daysSinceLastOrder > 90) {
        segment = "Inactive";
        segmentColor = "bg-orange-100 text-orange-700";
      } else if (c.totalOrders >= 4) {
        segment = "Loyal";
        segmentColor = "bg-green-100 text-green-700";
      } else if (c.totalOrders > 1) {
        segment = "Repeat";
        segmentColor = "bg-blue-100 text-blue-700";
      }

      return { ...c, segment, segmentColor };
    }).sort((a, b) => new Date(b.lastOrderDate) - new Date(a.lastOrderDate));
  }, [orders]);

  // Top Metrics
  const { totalCustomers, newCustomers, repeatCustomers, avgOrdersPerCustomer } = useMemo(() => {
    const total = customers.length;
    let newCust = 0;
    let repeatCust = 0;

    const now = new Date();
    const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));

    customers.forEach(c => {
      if (new Date(c.firstOrderDate) >= thirtyDaysAgo) {
        newCust++;
      }
      if (c.totalOrders > 1) {
        repeatCust++;
      }
    });

    const avg = total > 0 ? (orders.length / total).toFixed(1) : "0.0";

    return { totalCustomers: total, newCustomers: newCust, repeatCustomers: repeatCust, avgOrdersPerCustomer: avg };
  }, [customers, orders.length]);

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery)
    );
  }, [customers, searchQuery]);

  const currentCustomers = useMemo(() => {
    const start = (currentPage - 1) * customersPerPage;
    return filteredCustomers.slice(start, start + customersPerPage);
  }, [filteredCustomers, currentPage]);

  const totalPages = Math.ceil(filteredCustomers.length / customersPerPage);

  const formatPrice = (value) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value || 0);
  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <SellerLayout activeTab="customers">
      {/* Header */}
      <header className="mb-10 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
        <div>
          <h1 className="font-headline text-4xl font-bold leading-tight tracking-tight text-stone-950 md:text-5xl">
            Customers
          </h1>
          <p className="mt-3 text-sm text-stone-500">
            View and manage your customers, their orders and insights.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button className="flex items-center justify-center gap-2 rounded-lg bg-stone-950 px-5 py-2.5 text-[11px] font-bold text-white transition-colors hover:bg-black">
            <span className="material-symbols-outlined text-sm">download</span>
            Export Customers
          </button>
          <button className="flex items-center justify-center gap-2 rounded-lg border border-stone-300 bg-white px-5 py-2.5 text-[11px] font-bold text-stone-700 transition-colors hover:bg-stone-50">
            Customer Segments
            <span className="material-symbols-outlined text-sm">group_add</span>
          </button>
        </div>
      </header>

      {/* Metrics Row */}
      <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          icon="group"
          title="TOTAL CUSTOMERS"
          value={totalCustomers.toLocaleString()}
          hint="All time"
          actionLabel="View all customers"
        />
        <MetricCard
          icon="person_add"
          title="NEW CUSTOMERS"
          value={newCustomers.toLocaleString()}
          hint="This Month"
          actionLabel="View new customers"
          valueColor="text-stone-950"
          iconColor="text-green-600"
          iconBg="bg-green-50 border-green-100"
          actionColor="text-green-600"
        />
        <MetricCard
          icon="shopping_bag"
          title="REPEAT CUSTOMERS"
          value={repeatCustomers.toLocaleString()}
          hint={`${totalCustomers > 0 ? ((repeatCustomers/totalCustomers)*100).toFixed(1) : 0}% of total`}
          actionLabel="View repeat customers"
          valueColor="text-stone-950"
          iconColor="text-blue-600"
          iconBg="bg-blue-50 border-blue-100"
          actionColor="text-blue-600"
        />
        <MetricCard
          icon="favorite_border"
          title="AVG. ORDERS / CUSTOMER"
          value={avgOrdersPerCustomer}
          hint="All time"
          actionLabel="View analytics"
          valueColor="text-stone-950"
          iconColor="text-orange-500"
          iconBg="bg-orange-50 border-orange-100"
          actionColor="text-orange-500"
        />
      </section>

      {/* Data Table Section */}
      <section className="mb-8 rounded-2xl border border-stone-200 bg-white">
        {/* Filters Row */}
        <div className="flex flex-col items-center justify-between gap-4 border-b border-stone-200 p-4 md:flex-row">
          <div className="flex w-full flex-wrap items-center gap-3 md:w-auto">
            <div className="flex flex-1 items-center gap-2 rounded-lg border border-stone-300 bg-stone-50 px-3 py-2 focus-within:border-stone-950 focus-within:bg-white md:w-64">
              <span className="material-symbols-outlined text-stone-400 text-sm">search</span>
              <input
                type="text"
                placeholder="Search by name, email or phone..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-transparent text-xs text-stone-950 outline-none placeholder:text-stone-400"
              />
            </div>
            <FilterSelect label="Segment" />
            <FilterSelect label="Location" />
            <FilterSelect label="Total Orders" />
            <button className="flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-medium text-stone-700 hover:bg-stone-50">
              <span className="material-symbols-outlined text-sm">filter_list</span>
              More Filters
            </button>
          </div>
          
          <div className="flex shrink-0 items-center gap-1 rounded-lg border border-stone-300 bg-stone-50 p-1">
            <button className="flex h-8 w-8 items-center justify-center rounded-md bg-white text-stone-950 shadow-sm border border-stone-200">
              <span className="material-symbols-outlined text-sm">grid_view</span>
            </button>
            <button className="flex h-8 w-8 items-center justify-center rounded-md text-stone-400 hover:text-stone-950">
              <span className="material-symbols-outlined text-sm">format_list_bulleted</span>
            </button>
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
              <tr className="border-b border-stone-100 text-[9px] font-bold uppercase tracking-widest text-stone-400 bg-stone-50/50">
                <th className="px-6 py-4 w-12"><input type="checkbox" className="rounded border-stone-300 text-stone-900 focus:ring-stone-900" /></th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4 text-center">Total Orders</th>
                <th className="px-6 py-4">Total Spend</th>
                <th className="px-6 py-4">Last Order</th>
                <th className="px-6 py-4">Segment</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-700">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-stone-400">Loading customers...</td>
                </tr>
              ) : currentCustomers.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-stone-400">No customers found.</td>
                </tr>
              ) : (
                currentCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-stone-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <input type="checkbox" className="rounded border-stone-300 text-stone-900 focus:ring-stone-900" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-stone-100 border border-stone-200">
                          <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${customer.name}&backgroundColor=f0ede6&textColor=2f3430`} alt={customer.name} className="h-full w-full object-cover" />
                        </div>
                        <div>
                          <p className="text-[11px] font-bold text-stone-950">{customer.name}</p>
                          <p className="mt-0.5 text-[9px] text-stone-500">Joined on {formatDate(customer.firstOrderDate)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-[11px] text-stone-600 font-medium">{customer.email}</p>
                      <p className="mt-0.5 text-[10px] text-stone-500">{customer.phone}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <p className="text-xs font-medium text-stone-950">{customer.totalOrders}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs font-medium text-stone-950">{formatPrice(customer.totalSpend)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-[11px] font-medium text-stone-600">{formatDate(customer.lastOrderDate)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-sm px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest ${customer.segmentColor}`}>
                        {customer.segment}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2 text-stone-400">
                        <button className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-stone-100 hover:text-stone-950 transition-colors" title="More Actions">
                          <span className="material-symbols-outlined text-[16px]">more_vert</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {!loading && filteredCustomers.length > 0 && (
          <div className="flex items-center justify-between border-t border-stone-100 px-6 py-4">
            <p className="text-xs text-stone-500">
              Showing {(currentPage - 1) * customersPerPage + 1} to {Math.min(currentPage * customersPerPage, filteredCustomers.length)} of {filteredCustomers.length} customers
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

      {/* Bottom Banner */}
      <section className="relative overflow-hidden rounded-2xl bg-[#EFE9E0] flex items-center shadow-sm">
        <div className="p-8 md:p-10 w-full max-w-lg z-10">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-stone-700 shadow-sm mb-6">
            <span className="material-symbols-outlined text-2xl">mail</span>
          </div>
          <h4 className="font-headline text-xl font-bold text-stone-950">Grow customer relationships</h4>
          <p className="mt-3 text-sm text-stone-600 leading-relaxed max-w-sm">
            Send personalized offers and updates to your customers and keep them coming back.
          </p>
          <Link to="#" className="mt-6 inline-flex items-center gap-1.5 text-xs font-bold text-stone-950 hover:underline">
            Create Campaign <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </Link>
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-90 hidden md:block">
          <img src="https://images.unsplash.com/photo-1445205170230-053b83016050?w=800&q=80" alt="Clothing Rack" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#EFE9E0] to-transparent"></div>
        </div>
      </section>
    </SellerLayout>
  );
}

function MetricCard({ icon, title, value, hint, actionLabel, valueColor = "text-stone-950", iconColor = "text-stone-500", iconBg = "bg-stone-50 border-stone-100", actionColor = "text-stone-600" }) {
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
        <Link to="#" className={`flex items-center gap-1 text-[11px] font-medium hover:underline ${actionColor}`}>
          {actionLabel} <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
        </Link>
      </div>
    </div>
  );
}

function FilterSelect({ label, icon = "expand_more" }) {
  return (
    <button className="flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-medium text-stone-700 hover:bg-stone-50">
      {label}
      <span className="material-symbols-outlined text-sm text-stone-400">{icon}</span>
    </button>
  );
}

function LocationRow({ city, count, percentage, color }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={`h-2.5 w-4 rounded-sm ${color} shadow-sm border border-stone-200`}></div>
        <span className="text-[11px] font-bold text-stone-950">{city}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-bold text-stone-950">{count}</span>
        <span className="text-[10px] text-stone-500 w-12 text-right">({percentage})</span>
      </div>
    </div>
  );
}
