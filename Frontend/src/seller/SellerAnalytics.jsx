import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getSellerOrders } from "../api/order";
import { API } from "../api/axios";
import { useAuth } from "../context/AuthContext";
import SellerLayout from "./components/SellerLayout";

export default function SellerAnalytics() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user?._id || user.role !== "seller") return;

    let cancelled = false;

    const fetchData = async () => {
      try {
        setLoading(true);
        const [ordersRes, productsRes] = await Promise.all([
          getSellerOrders(),
          API.get("/products")
        ]);

        if (!cancelled) {
          setOrders(ordersRes.data || []);
          
          // Filter products to only this seller's products
          const myProducts = (productsRes.data || []).filter((p) => {
            const sellerId = typeof p.seller === "string" ? p.seller : p.seller?._id;
            return sellerId === user._id;
          });
          setProducts(myProducts);
        }
      } catch (err) {
        if (!cancelled) setError("Failed to load analytics data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [user?._id, user?.role]);

  // Aggregate Metrics
  const { 
    totalRevenue, 
    totalOrders, 
    unitsSold, 
    avgOrderValue, 
    returnRate,
    newCustomers,
    customerLifetimeValue,
    topSellingProducts,
    salesByCategory,
    topLocation,
    topTime,
    trends,
    weeklyData
  } = useMemo(() => {
    let rev = 0;
    let units = 0;
    let returned = 0;
    
    const productSales = {};
    const categorySales = {};
    const customerMap = {};
    const locations = {};
    const hours = {};

    // Map products for fast lookup (to get category)
    const productCategoryMap = {};
    products.forEach(p => {
      productCategoryMap[p._id] = p.category || "Uncategorized";
    });

    const now = new Date();
    const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));

    orders.forEach(order => {
      const orderTotal = Number(order.sellerTotalAmount) || 0;
      rev += orderTotal;
      
      if (order.sellerStatus === "CANCELLED") {
        returned++;
      }

      // Customer Tracking
      const customerKey = order.shippingAddress?.email || order.user?._id || `unknown-${order._id}`;
      if (!customerMap[customerKey]) {
        customerMap[customerKey] = {
          id: customerKey,
          firstOrderDate: order.createdAt,
          totalSpend: 0,
          city: order.shippingAddress?.city || "Unknown"
        };
      }
      
      const c = customerMap[customerKey];
      c.totalSpend += orderTotal;
      if (new Date(order.createdAt) < new Date(c.firstOrderDate)) {
        c.firstOrderDate = order.createdAt;
      }

      // Location Tracking
      const city = order.shippingAddress?.city || "Unknown";
      if (!locations[city]) locations[city] = 0;
      locations[city]++;

      // Time Tracking
      const hour = new Date(order.createdAt).getHours();
      let timeSlot = "Night";
      if (hour >= 6 && hour < 12) timeSlot = "6 AM - 12 PM";
      else if (hour >= 12 && hour < 18) timeSlot = "12 PM - 6 PM";
      else if (hour >= 18 && hour <= 23) timeSlot = "6 PM - 12 AM";
      
      if (!hours[timeSlot]) hours[timeSlot] = 0;
      hours[timeSlot]++;

      // Item Tracking
      (order.items || []).forEach(item => {
        const qty = Number(item.quantity) || 0;
        const itemRevenue = qty * (Number(item.price) || 0);
        units += qty;

        // Top Products
        if (!productSales[item.productId]) {
          productSales[item.productId] = {
            id: item.productId,
            name: item.productName,
            image: item.image,
            unitsSold: 0,
            revenue: 0
          };
        }
        productSales[item.productId].unitsSold += qty;
        productSales[item.productId].revenue += itemRevenue;

        // Category Sales
        const cat = productCategoryMap[item.productId] || "Other";
        if (!categorySales[cat]) categorySales[cat] = 0;
        categorySales[cat] += itemRevenue;
      });
    });

    const avg = orders.length > 0 ? (rev / orders.length) : 0;
    const rRate = orders.length > 0 ? ((returned / orders.length) * 100).toFixed(2) : "0.00";

    // Customers logic
    const customers = Object.values(customerMap);
    let newCustCount = 0;
    customers.forEach(c => {
      if (new Date(c.firstOrderDate) >= thirtyDaysAgo) {
        newCustCount++;
      }
    });

    const clv = customers.length > 0 ? (rev / customers.length) : 0;

    // Weekly Data for Chart (last 30 days divided into 5 buckets)
    const weeklyData = [
      { date: "May 1", new: 0, ret: 0 },
      { date: "May 8", new: 0, ret: 0 },
      { date: "May 15", new: 0, ret: 0 },
      { date: "May 22", new: 0, ret: 0 },
      { date: "May 31", new: 0, ret: 0 }
    ];
    
    orders.forEach(order => {
      const d = new Date(order.createdAt);
      if (d >= thirtyDaysAgo) {
        const daysDiff = Math.floor((now - d) / (1000 * 60 * 60 * 24));
        const bucket = Math.max(0, 4 - Math.floor(daysDiff / 6)); // 0 to 4
        
        const customerKey = order.shippingAddress?.email || order.user?._id || `unknown-${order._id}`;
        const c = customerMap[customerKey];
        if (c && new Date(c.firstOrderDate).getTime() === d.getTime()) {
          weeklyData[Math.min(4, bucket)].new++;
        } else {
          weeklyData[Math.min(4, bucket)].ret++;
        }
      }
    });

    const maxWeekly = Math.max(1, ...weeklyData.map(w => w.new + w.ret));
    // Scale factor so max height is 30
    const scale = 30 / maxWeekly;
    weeklyData.forEach(w => {
      w.newHeight = w.new * scale;
      w.retHeight = w.ret * scale;
    });

    // Sort Top Products
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    
    let revThisMonth = 0; let revLastMonth = 0;
    let ordersThisMonth = 0; let ordersLastMonth = 0;
    let unitsThisMonth = 0; let unitsLastMonth = 0;

    orders.forEach(order => {
      const d = new Date(order.createdAt);
      const amount = Number(order.sellerTotalAmount) || 0;
      const orderUnits = (order.items || []).reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
      
      if (d >= thisMonthStart) {
        revThisMonth += amount;
        ordersThisMonth++;
        unitsThisMonth += orderUnits;
      } else if (d >= lastMonthStart && d < thisMonthStart) {
        revLastMonth += amount;
        ordersLastMonth++;
        unitsLastMonth += orderUnits;
      }
    });

    const calcTrend = (current, previous) => {
      if (previous === 0) return current > 0 ? "100.0%" : "0.0%";
      const change = ((current - previous) / previous) * 100;
      return `${change > 0 ? "+" : ""}${change.toFixed(1)}%`;
    };

    const avgThisMonth = ordersThisMonth ? revThisMonth / ordersThisMonth : 0;
    const avgLastMonth = ordersLastMonth ? revLastMonth / ordersLastMonth : 0;

    const trends = {
      revenue: calcTrend(revThisMonth, revLastMonth),
      orders: calcTrend(ordersThisMonth, ordersLastMonth),
      units: calcTrend(unitsThisMonth, unitsLastMonth),
      avgOrderValue: calcTrend(avgThisMonth, avgLastMonth)
    };

    // Sort Top Products
    const sortedProducts = Object.values(productSales).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

    // Format Categories
    const totalCatRevenue = Object.values(categorySales).reduce((sum, val) => sum + val, 0);
    const sortedCategories = Object.entries(categorySales)
      .map(([name, val]) => ({ name, revenue: val, percentage: totalCatRevenue > 0 ? ((val / totalCatRevenue) * 100).toFixed(1) : 0 }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Insights
    const topLoc = Object.entries(locations).sort((a, b) => b[1] - a[1])[0] || ["Unknown", 0];
    const topLocPercentage = customers.length > 0 ? ((topLoc[1] / customers.length) * 100).toFixed(1) : 0;

    const topTimeSlot = Object.entries(hours).sort((a, b) => b[1] - a[1])[0] || ["Unknown", 0];
    const topTimePercentage = orders.length > 0 ? ((topTimeSlot[1] / orders.length) * 100).toFixed(1) : 0;

    return {
      totalRevenue: rev,
      totalOrders: orders.length,
      unitsSold: units,
      avgOrderValue: avg,
      returnRate: rRate,
      newCustomers: newCustCount,
      customerLifetimeValue: clv,
      topSellingProducts: sortedProducts,
      salesByCategory: sortedCategories,
      topLocation: { name: topLoc[0], percentage: topLocPercentage },
      topTime: { name: topTimeSlot[0], percentage: topTimePercentage },
      trends,
      weeklyData,
      maxWeekly
    };
  }, [orders, products]);

  const formatPrice = (value) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value || 0);

  if (loading) {
    return (
      <SellerLayout activeTab="analytics">
        <div className="flex h-64 items-center justify-center">
          <p className="text-stone-500">Loading analytics...</p>
        </div>
      </SellerLayout>
    );
  }

  if (error) {
    return (
      <SellerLayout activeTab="analytics">
        <div className="m-4 rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-600">
          {error}
        </div>
      </SellerLayout>
    );
  }

  return (
    <SellerLayout activeTab="analytics">
      {/* Header */}
      <header className="mb-10 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
        <div>
          <h1 className="font-headline text-4xl font-bold leading-tight tracking-tight text-stone-950 md:text-5xl">
            Analytics
          </h1>
          <p className="mt-3 text-sm text-stone-500">
            Track performance, identify trends and grow your business.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button className="flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-4 py-2 text-xs font-bold text-stone-700 hover:bg-stone-50">
            <span className="material-symbols-outlined text-sm">calendar_today</span>
            All Time
            <span className="material-symbols-outlined text-sm">expand_more</span>
          </button>
          <button className="flex items-center justify-center gap-2 rounded-lg border border-stone-300 bg-white px-5 py-2.5 text-[11px] font-bold text-stone-700 transition-colors hover:bg-stone-50">
            Export Report
            <span className="material-symbols-outlined text-sm">download</span>
          </button>
        </div>
      </header>

      {/* Top Metrics Row */}
      <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SparklineCard
          title="TOTAL REVENUE"
          icon="receipt_long"
          value={formatPrice(totalRevenue)}
          trend={trends.revenue}
          trendLabel="vs last month"
          color={trends.revenue.startsWith("-") ? "#ef4444" : "#B4966E"}
          sparklinePath="M0,20 Q10,10 20,25 T40,20 T60,35 T80,15 T100,20"
        />
        <SparklineCard
          title="TOTAL ORDERS"
          icon="shopping_bag"
          value={totalOrders.toString()}
          trend={trends.orders}
          trendLabel="vs last month"
          color={trends.orders.startsWith("-") ? "#ef4444" : "#16a34a"}
          sparklinePath="M0,25 Q15,30 25,15 T50,20 T75,5 T100,10"
        />
        <SparklineCard
          title="UNITS SOLD"
          icon="inventory_2"
          value={unitsSold.toString()}
          trend={trends.units}
          trendLabel="vs last month"
          color={trends.units.startsWith("-") ? "#ef4444" : "#2563eb"}
          sparklinePath="M0,35 Q20,10 40,25 T60,15 T80,20 T100,5"
        />
        <SparklineCard
          title="AVERAGE ORDER VALUE"
          icon="schedule"
          value={formatPrice(avgOrderValue)}
          trend={trends.avgOrderValue}
          trendLabel="vs last month"
          color={trends.avgOrderValue.startsWith("-") ? "#ef4444" : "#f97316"}
          sparklinePath="M0,15 Q25,25 50,10 T75,30 T100,20"

        />
      </section>



      {/* Tables Row */}
      <section className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top Selling Products */}
        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="font-headline text-[15px] font-bold text-stone-950">Top Selling Products</h3>
            <Link to="/seller/my-products" className="flex items-center gap-1 text-[10px] font-bold text-stone-950 hover:underline">
              View all <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>
          
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-stone-100 text-[9px] font-bold uppercase tracking-widest text-stone-400">
                <th className="pb-3 font-medium">PRODUCT</th>
                <th className="pb-3 text-right font-medium">UNITS SOLD</th>
                <th className="pb-3 text-right font-medium">REVENUE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {topSellingProducts.length > 0 ? (
                topSellingProducts.map((p, idx) => (
                  <tr key={idx} className="group">
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-8 shrink-0 overflow-hidden rounded bg-stone-100">
                          {p.image ? (
                            <img src={p.image} alt={p.name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-stone-300">
                              <span className="material-symbols-outlined text-sm">image</span>
                            </div>
                          )}
                        </div>
                        <p className="text-[11px] font-bold text-stone-950 line-clamp-1">{p.name}</p>
                      </div>
                    </td>
                    <td className="py-3 text-right text-[11px] font-medium text-stone-600">{p.unitsSold} units</td>
                    <td className="py-3 text-right text-[11px] font-bold text-stone-950">{formatPrice(p.revenue)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="py-6 text-center text-[11px] text-stone-400">No product sales yet.</td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="mt-4 pt-4 border-t border-stone-100">
            <Link to="/seller/my-products" className="flex items-center gap-1 text-[10px] font-bold text-stone-950 hover:underline">
              View all products <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>
        </div>

        {/* Sales by Category */}
        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="font-headline text-[15px] font-bold text-stone-950">Sales by Category</h3>
            <Link to="#" className="flex items-center gap-1 text-[10px] font-bold text-stone-950 hover:underline">
              View all <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>
          
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-stone-100 text-[9px] font-bold uppercase tracking-widest text-stone-400">
                <th className="pb-3 font-medium">CATEGORY</th>
                <th className="pb-3 text-right font-medium">REVENUE</th>
                <th className="pb-3 text-right font-medium">% OF TOTAL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {salesByCategory.length > 0 ? (
                salesByCategory.map((cat, idx) => (
                  <tr key={idx}>
                    <td className="py-3 text-[11px] font-medium text-stone-600">{cat.name}</td>
                    <td className="py-3 text-right text-[11px] font-bold text-stone-950">{formatPrice(cat.revenue)}</td>
                    <td className="py-3 pl-4">
                      <div className="flex items-center justify-end gap-2 text-[10px] font-medium text-stone-600">
                        <div className="h-1.5 w-16 rounded-full bg-stone-100 overflow-hidden">
                          <div className="h-full bg-[#B4966E] rounded-full" style={{ width: `${cat.percentage}%` }}></div>
                        </div>
                        <span className="w-8 text-right">{cat.percentage}%</span>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="py-6 text-center text-[11px] text-stone-400">No category sales yet.</td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="mt-4 pt-4 border-t border-stone-100">
            <Link to="#" className="flex items-center gap-1 text-[10px] font-bold text-stone-950 hover:underline">
              View category report <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Bottom Metrics Row (3 cards since Conversion Rate is removed) */}
      <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-orange-50 border border-orange-100 text-orange-500">
            <span className="material-symbols-outlined text-xl">restore</span>
          </div>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-stone-500">RETURN RATE</p>
            <p className="mt-1 font-headline text-2xl font-bold text-stone-950">{returnRate}%</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-green-50 border border-green-100 text-green-600">
            <span className="material-symbols-outlined text-xl">person_add</span>
          </div>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-stone-500">NEW CUSTOMERS</p>
            <p className="mt-1 font-headline text-2xl font-bold text-stone-950">{newCustomers}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#EFE9E0] border border-[#E5DFD6] text-stone-700">
            <span className="material-symbols-outlined text-xl">workspace_premium</span>
          </div>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-stone-500">CUSTOMER LIFETIME VALUE</p>
            <p className="mt-1 font-headline text-2xl font-bold text-stone-950">{formatPrice(customerLifetimeValue)}</p>
          </div>
        </div>
      </section>

      {/* Bottom Charts Section */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* New vs Returning Customers */}
        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <h3 className="mb-6 font-headline text-[15px] font-bold text-stone-950">New vs Returning Customers</h3>
          <div className="mb-4 flex gap-4">
            <div className="flex items-center gap-1.5 text-[10px] text-stone-600">
              <span className="h-2 w-2 rounded-full bg-[#16a34a]"></span>
              New Customers
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-stone-600">
              <span className="h-2 w-2 rounded-full bg-[#B4966E]"></span>
              Returning Customers
            </div>
          </div>
          
          <div className="relative h-48 w-full">
            <svg viewBox="0 0 100 40" className="h-full w-full overflow-visible" preserveAspectRatio="none">
              {/* Y-axis labels */}
              <text x="-2" y="5" fontSize="3" fill="#a8a29e" textAnchor="end">160</text>
              <text x="-2" y="15" fontSize="3" fill="#a8a29e" textAnchor="end">120</text>
              <text x="-2" y="25" fontSize="3" fill="#a8a29e" textAnchor="end">80</text>
              <text x="-2" y="35" fontSize="3" fill="#a8a29e" textAnchor="end">40</text>
              <text x="-2" y="40" fontSize="3" fill="#a8a29e" textAnchor="end">0</text>
              
              {/* Grid lines */}
              <line x1="0" y1="5" x2="100" y2="5" stroke="#f5f5f4" strokeWidth="0.2" />
              <line x1="0" y1="15" x2="100" y2="15" stroke="#f5f5f4" strokeWidth="0.2" />
              <line x1="0" y1="25" x2="100" y2="25" stroke="#f5f5f4" strokeWidth="0.2" />
              <line x1="0" y1="35" x2="100" y2="35" stroke="#f5f5f4" strokeWidth="0.2" />
              <line x1="0" y1="40" x2="100" y2="40" stroke="#e5e5e4" strokeWidth="0.5" />

              {/* Bar Groups (Dynamic) */}
              {weeklyData.map((w, i) => (
                <g key={i}>
                  <rect x={10 + i * 20} y={40 - w.newHeight} width="3" height={Math.max(0, w.newHeight)} fill="#16a34a" rx="0.5" />
                  <rect x={14 + i * 20} y={40 - w.retHeight} width="3" height={Math.max(0, w.retHeight)} fill="#B4966E" rx="0.5" />
                  <text x={12 + i * 20} y="45" fontSize="3" fill="#a8a29e" textAnchor="middle">{w.date}</text>
                </g>
              ))}
            </svg>
          </div>
        </div>

        {/* Customer Insights (Omitting Top Device) */}
        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <h3 className="mb-6 font-headline text-[15px] font-bold text-stone-950">Customer Insights</h3>
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EFE9E0] text-[#B4966E]">
                <span className="material-symbols-outlined text-lg">location_on</span>
              </div>
              <div>
                <p className="text-[11px] font-bold text-stone-950">Top Location</p>
                <p className="mt-0.5 text-[10px] text-stone-500">{topLocation.name} ({topLocation.percentage}% of total customers)</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EFE9E0] text-[#B4966E]">
                <span className="material-symbols-outlined text-lg">schedule</span>
              </div>
              <div>
                <p className="text-[11px] font-bold text-stone-950">Top Time to Buy</p>
                <p className="mt-0.5 text-[10px] text-stone-500">{topTime.name} ({topTime.percentage}% of orders)</p>
              </div>
            </div>
          </div>
          
          <div className="mt-8 pt-4 border-t border-stone-100">
            <Link to="#" className="flex items-center gap-1 text-[10px] font-bold text-stone-950 hover:underline">
              View detailed insights <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>
        </div>
      </section>

    </SellerLayout>
  );
}

function SparklineCard({ title, icon, value, trend, trendLabel, color, sparklinePath }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <span className="material-symbols-outlined text-[16px] text-stone-400">{icon}</span>
        <h4 className="text-[9px] font-bold uppercase tracking-widest text-stone-500">{title}</h4>
      </div>
      
      <p className="font-headline text-3xl font-bold text-stone-950">{value}</p>
      
      <div className="mt-2 flex items-center gap-2">
        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold" style={{ color }}>
          <span className="material-symbols-outlined text-[12px]">north_east</span>
          {trend}
        </span>
        <span className="text-[10px] text-stone-500">{trendLabel}</span>
      </div>

      <div className="absolute -bottom-1 -right-1 h-12 w-24 opacity-60">
        <svg viewBox="0 0 100 40" className="h-full w-full" preserveAspectRatio="none">
          <path d={sparklinePath} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
}
