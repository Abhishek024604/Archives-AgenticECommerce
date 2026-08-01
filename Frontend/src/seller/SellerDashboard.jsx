import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { API } from "../api/axios";
import { getSellerOrders } from "../api/order";
import { useAuth } from "../context/AuthContext";
import SellerLayout from "./components/SellerLayout";

export default function SellerDashboard() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [inventoryLoading, setInventoryLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(true);

  useEffect(() => {
    if (!user?._id || user.role !== "seller") return;
    let cancelled = false;

    const loadInventory = async () => {
      try {
        setInventoryLoading(true);
        const res = await API.get("/products");
        const mine = (res.data || []).filter((product) => {
          const sellerId = typeof product.seller === "string" ? product.seller : product.seller?._id;
          return sellerId === user._id;
        });
        if (!cancelled) setProducts(mine);
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setInventoryLoading(false);
      }
    };

    const loadOrders = async () => {
      try {
        setOrdersLoading(true);
        const res = await getSellerOrders();
        if (!cancelled) setOrders(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setOrdersLoading(false);
      }
    };

    loadInventory();
    loadOrders();

    return () => { cancelled = true; };
  }, [user?._id, user?.role]);

  const inventoryMetrics = useMemo(() => {
    const totalProducts = products.length;
    const totalUnits = products.reduce((sum, product) => sum + (product.variants || []).reduce((variantSum, variant) => variantSum + (Number(variant.stock) || 0), 0), 0);
    const soldOutProducts = products.filter((product) => (product.variants || []).every((variant) => (Number(variant.stock) || 0) === 0)).length;
    const averagePrice = totalProducts ? products.reduce((sum, product) => sum + (Number(product.price) || 0), 0) / totalProducts : 0;
    return { totalProducts, totalUnits, soldOutProducts, averagePrice };
  }, [products]);

  const orderMetrics = useMemo(() => {
    const totalOrders = orders.length;
    const totalUnitsOrdered = orders.reduce((sum, order) => sum + (order.items || []).reduce((itemSum, item) => itemSum + (Number(item.quantity) || 0), 0), 0);
    const processedOrders = orders.filter((order) => order.sellerStatus === "PROCESSED");
    const revenueToBeProcessed = orders.reduce((sum, order) => order.sellerStatus === "PROCESSED" ? sum : sum + (Number(order.sellerTotalAmount) || 0), 0);
    const processedRevenue = processedOrders.reduce((sum, order) => sum + (Number(order.sellerTotalAmount) || 0), 0);
    const totalCustomers = new Set(orders.map((order) => typeof order.user === "string" ? order.user : order.user?._id).filter(Boolean)).size;
    return { totalOrders, totalUnitsOrdered, totalCustomers, processedOrders: processedOrders.length, revenueToBeProcessed, processedRevenue };
  }, [orders]);

  const formatPrice = (value) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value || 0);

  return (
    <SellerLayout activeTab="dashboard">
      <header className="mb-10 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
        <div>
          <h1 className="font-headline text-4xl font-bold leading-tight tracking-tight text-stone-950 md:text-5xl">
            Overview
          </h1>
          <p className="mt-3 text-sm text-stone-500">
            Monitor your store's high-level metrics and performance.
          </p>
        </div>
        <div className="flex gap-4">
          <Link to="/seller/add" className="flex items-center justify-center gap-2 rounded-lg bg-stone-950 px-5 py-2.5 text-[11px] font-bold text-white transition-colors hover:bg-black">
            <span className="material-symbols-outlined text-sm">add</span>
            Add Product
          </Link>
        </div>
      </header>

      {/* Orders Summary */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-headline text-xl font-bold text-stone-950">Orders Summary</h2>
        <Link to="/seller/orders" className="text-[11px] font-bold text-stone-500 hover:text-stone-950 transition-colors uppercase tracking-widest flex items-center gap-1">
          View All Orders <span className="material-symbols-outlined text-sm">arrow_forward</span>
        </Link>
      </div>
      <section className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard title="Orders Received" value={orderMetrics.totalOrders} hint="Orders containing your products" icon="receipt_long" iconColor="text-blue-600" iconBg="bg-blue-50" />
        <MetricCard title="Units Ordered" value={orderMetrics.totalUnitsOrdered} hint="Total items sold" icon="inventory_2" iconColor="text-indigo-600" iconBg="bg-indigo-50" />
        <MetricCard title="Customers" value={orderMetrics.totalCustomers} hint="Unique buyers served" icon="group" iconColor="text-purple-600" iconBg="bg-purple-50" />
        <MetricCard title="Orders Processed" value={orderMetrics.processedOrders} hint="Dispatched by your team" icon="local_shipping" iconColor="text-emerald-600" iconBg="bg-emerald-50" />
        <MetricCard title="Revenue (Pending)" value={formatPrice(orderMetrics.revenueToBeProcessed)} hint="Awaiting dispatch" icon="pending_actions" iconColor="text-amber-600" iconBg="bg-amber-50" />
        <MetricCard title="Revenue (Processed)" value={formatPrice(orderMetrics.processedRevenue)} hint="From dispatched orders" icon="payments" iconColor="text-green-600" iconBg="bg-green-50" />
      </section>

      {/* Inventory Summary */}
      <div className="mb-6 flex items-center justify-between mt-12">
        <h2 className="font-headline text-xl font-bold text-stone-950">Inventory Summary</h2>
        <Link to="/seller/my-products" className="text-[11px] font-bold text-stone-500 hover:text-stone-950 transition-colors uppercase tracking-widest flex items-center gap-1">
          Manage Inventory <span className="material-symbols-outlined text-sm">arrow_forward</span>
        </Link>
      </div>
      <section className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Items Listed" value={inventoryMetrics.totalProducts} hint="Unique products" icon="style" iconColor="text-stone-600" iconBg="bg-stone-100" />
        <MetricCard title="Units In Stock" value={inventoryMetrics.totalUnits} hint="Across all variants" icon="inventory" iconColor="text-blue-600" iconBg="bg-blue-50" />
        <MetricCard title="Sold Out" value={inventoryMetrics.soldOutProducts} hint="Needs restock" icon="warning" iconColor="text-red-600" iconBg="bg-red-50" />
        <MetricCard title="Avg Price" value={formatPrice(inventoryMetrics.averagePrice)} hint="Based on active items" icon="sell" iconColor="text-green-600" iconBg="bg-green-50" />
      </section>

      {/* Quick Actions */}
      <section className="mt-12 rounded-2xl bg-[#EFE9E0] p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
        <div>
          <h4 className="font-headline text-xl font-bold text-stone-950">Ready to grow your business?</h4>
          <p className="mt-2 text-sm text-stone-600 leading-relaxed max-w-md">
            Check your analytics dashboard for deep insights on customer demographics, top-performing categories, and lifetime value.
          </p>
        </div>
        <Link to="/seller/analytics" className="flex items-center gap-2 rounded-lg bg-stone-950 px-6 py-3 text-xs font-bold text-white transition-colors hover:bg-black whitespace-nowrap">
          <span className="material-symbols-outlined text-sm">bar_chart</span>
          View Analytics
        </Link>
      </section>
    </SellerLayout>
  );
}

function MetricCard({ title, value, hint, icon, iconColor, iconBg }) {
  return (
    <div className="flex flex-col justify-between rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
      <div>
        <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-full border border-stone-100 ${iconBg} ${iconColor}`}>
          <span className="material-symbols-outlined text-[18px]">{icon}</span>
        </div>
        <p className="text-[9px] font-bold uppercase tracking-widest text-stone-500">{title}</p>
        <p className="mt-1 font-headline text-3xl font-bold text-stone-950">{value}</p>
        <p className="mt-1 text-[11px] text-stone-500">{hint}</p>
      </div>
    </div>
  );
}
