import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { API } from "../api/axios";
import { useAuth } from "../context/AuthContext";
import SellerLayout from "./components/SellerLayout";

export default function SellerDiscounts() {
  const { user } = useAuth();
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!user || user.role !== "seller") return;
    API.get("/discounts/seller").then(res => {
      if (!cancelled) {
        setDiscounts(res.data || []);
        setLoading(false);
      }
    }).catch(err => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [user]);

  const formatPrice = (value) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value || 0);

  const topMetrics = useMemo(() => {
    let active = 0, scheduled = 0, expired = 0;
    const now = new Date();
    discounts.forEach(d => {
      const end = new Date(d.endDate);
      const start = new Date(d.startDate);
      if (!d.isActive || end < now) expired++;
      else if (start > now) scheduled++;
      else active++;
    });
    return [
      { title: "TOTAL DISCOUNTS", value: discounts.length, hint: "All time", icon: "sell", action: "View all discounts", iconColor: "text-stone-500", iconBg: "bg-stone-50", actionColor: "text-stone-950" },
      { title: "ACTIVE DISCOUNTS", value: active, hint: "Running now", icon: "check_circle", action: "View active", iconColor: "text-green-600", iconBg: "bg-green-50", actionColor: "text-green-700" },
      { title: "SCHEDULED", value: scheduled, hint: "Starts in future", icon: "event", action: "View scheduled", iconColor: "text-blue-500", iconBg: "bg-blue-50", actionColor: "text-blue-600" },
      { title: "EXPIRED", value: expired, hint: "No longer active", icon: "schedule", action: "View expired", iconColor: "text-orange-500", iconBg: "bg-orange-50", actionColor: "text-orange-600" },
    ];
  }, [discounts]);

  const mappedDiscounts = useMemo(() => {
    return discounts.map(d => {
      const now = new Date();
      const end = new Date(d.endDate);
      const start = new Date(d.startDate);
      let status = "Active";
      if (!d.isActive || end < now) status = "Expired";
      else if (start > now) status = "Scheduled";

      const val = d.type === "Percentage" ? `${d.value}% OFF` : `₹${d.value} OFF`;
      const subVal = d.maxDiscountAmount ? `Max ₹${d.maxDiscountAmount}` : (d.minOrderAmount ? `Min. order ₹${d.minOrderAmount}` : "");

      return {
        id: d._id,
        name: d.code + " Discount",
        code: d.code,
        type: d.type,
        icon: d.type === "Percentage" ? "percent" : "currency_rupee",
        iconColor: d.type === "Percentage" ? "text-orange-500 bg-orange-50" : "text-amber-500 bg-amber-50",
        value: val,
        subValue: subVal,
        usage: d.usageCount || 0,
        maxUsage: d.maxUsage || "∞",
        validity: `${start.toLocaleDateString("en-IN", { month: "short", day: "numeric" })} - ${end.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}`,
        status: status
      };
    });
  }, [discounts]);

  const topPerforming = useMemo(() => {
    return [...discounts]
      .sort((a, b) => (b.revenueGenerated || 0) - (a.revenueGenerated || 0))
      .slice(0, 3)
      .map(d => ({
        name: d.code,
        desc: d.type === "Percentage" ? `Flat ${d.value}% off` : `₹${d.value} OFF`,
        icon: d.type === "Percentage" ? "percent" : "currency_rupee",
        used: `${d.usage || 0} orders`,
        revenue: d.revenueGenerated || 0
      }));
  }, [discounts]);

  const getStatusBadge = (status) => {
    switch(status) {
      case "Active": return "bg-green-50 text-green-700 border-green-200";
      case "Scheduled": return "bg-blue-50 text-blue-700 border-blue-200";
      case "Expired": return "bg-stone-100 text-stone-500 border-stone-200";
      default: return "bg-stone-50 text-stone-600";
    }
  };

  return (
    <SellerLayout activeTab="discounts">
      {/* Header */}
      <header className="mb-10 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
        <div>
          <h1 className="font-headline text-4xl font-bold leading-tight tracking-tight text-stone-950 md:text-5xl">
            Discounts
          </h1>
          <p className="mt-3 text-sm text-stone-500">
            Create, manage and track discounts to<br/>boost sales and attract more customers.
          </p>
        </div>
        <button className="flex items-center justify-center gap-2 rounded-lg bg-stone-950 px-5 py-2.5 text-[11px] font-bold text-white transition-colors hover:bg-black">
          <span className="material-symbols-outlined text-sm">add</span>
          Create Discount
        </button>
      </header>

      {/* Top Metrics Row */}
      <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {topMetrics.map((m, idx) => (
          <div key={idx} className="flex flex-col justify-between rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <div>
              <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-full border border-stone-100 ${m.iconBg} ${m.iconColor}`}>
                <span className="material-symbols-outlined text-[18px]">{m.icon}</span>
              </div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-stone-500">{m.title}</p>
              <p className="mt-1 font-headline text-3xl font-bold text-stone-950">{m.value}</p>
              <p className="mt-1 text-[11px] text-stone-500">{m.hint}</p>
            </div>
            <div className="mt-6 pt-4 border-t border-stone-100">
              <Link to="#" className={`flex items-center gap-1 text-[11px] font-bold hover:underline ${m.actionColor}`}>
                {m.action} <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </Link>
            </div>
          </div>
        ))}
      </section>

      {/* Middle Section: Top Discounts */}
      <section className="mb-6">
        {/* Top Performing Discounts */}
        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm flex flex-col">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="font-headline text-[15px] font-bold text-stone-950">Top Performing Discounts</h3>
          </div>
          
          <div className="space-y-6">
            {topPerforming.length === 0 ? (
                <div className="text-[11px] text-stone-500 py-4">No discount performance data available yet.</div>
            ) : (
              topPerforming.map((td, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EFE9E0] text-[#B4966E]">
                      <span className="material-symbols-outlined text-[18px]">{td.icon}</span>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-stone-950">{td.name}</p>
                      <p className="text-[10px] text-stone-500">{td.desc}</p>
                    </div>
                  </div>
                  <div className="flex gap-6 text-right">
                    <div>
                      <p className="text-[9px] text-stone-400 uppercase">Used In</p>
                      <p className="text-[11px] font-bold text-stone-950">{td.used}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-stone-400 uppercase">Revenue</p>
                      <p className="text-[11px] font-bold text-stone-950">{formatPrice(td.revenue)}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Data Table Section */}
      <section className="mb-8 rounded-2xl border border-stone-200 bg-white">
        <div className="flex flex-col items-center justify-between gap-4 border-b border-stone-200 p-4 lg:flex-row">
          <div className="relative w-full max-w-xs">
            <input 
              type="text" 
              placeholder="Search discounts..." 
              className="w-full rounded-lg border border-stone-300 py-2 pl-9 pr-4 text-xs focus:border-[#B4966E] focus:outline-none focus:ring-1 focus:ring-[#B4966E]"
            />
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-stone-400">search</span>
          </div>
          <div className="flex w-full items-center gap-3 lg:w-auto overflow-x-auto pb-2 lg:pb-0">
            <FilterSelect label="Status" />
            <FilterSelect label="Type" />
            <FilterSelect label="All Channels" />
            <div className="ml-auto flex items-center gap-1 border-l border-stone-200 pl-3">
              <button className="flex h-8 w-8 items-center justify-center rounded bg-stone-100 text-stone-950">
                <span className="material-symbols-outlined text-[18px]">grid_view</span>
              </button>
              <button className="flex h-8 w-8 items-center justify-center rounded text-stone-400 hover:bg-stone-50">
                <span className="material-symbols-outlined text-[18px]">list</span>
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="border-b border-stone-100 text-[9px] font-bold uppercase tracking-widest text-stone-400 bg-stone-50/50">
                <th className="px-6 py-4 w-10"><input type="checkbox" className="rounded border-stone-300 text-[#B4966E] focus:ring-[#B4966E] w-3 h-3" /></th>
                <th className="px-4 py-4">DISCOUNT NAME</th>
                <th className="px-4 py-4">TYPE</th>
                <th className="px-4 py-4">VALUE</th>
                <th className="px-4 py-4">USAGE</th>
                <th className="px-4 py-4">VALIDITY</th>
                <th className="px-4 py-4">STATUS</th>
                <th className="px-6 py-4 text-center">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-700">
              {mappedDiscounts.map((discount) => {
                const percentUsed = typeof discount.maxUsage === 'number' 
                  ? Math.min((discount.usage / discount.maxUsage) * 100, 100)
                  : (discount.usage > 0 ? 100 : 0);
                  
                return (
                  <tr key={discount.id} className="hover:bg-stone-50/50 transition-colors">
                    <td className="px-6 py-4"><input type="checkbox" className="rounded border-stone-300 text-[#B4966E] focus:ring-[#B4966E] w-3 h-3" /></td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded ${discount.iconColor}`}>
                          <span className="material-symbols-outlined text-[16px]">{discount.icon}</span>
                        </div>
                        <div>
                          <p className="text-[11px] font-bold text-stone-950">{discount.name}</p>
                          <p className="text-[9px] text-stone-500 uppercase">{discount.code}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-[11px] text-stone-600">{discount.type}</td>
                    <td className="px-4 py-4">
                      <p className="text-[11px] font-bold text-stone-950">{discount.value}</p>
                      {discount.subValue && <p className="text-[10px] text-stone-500">{discount.subValue}</p>}
                    </td>
                    <td className="px-4 py-4 w-40">
                      <div className="flex items-center justify-between text-[10px] font-bold text-stone-950 mb-1">
                        <span>{discount.usage}</span>
                        <span className="text-stone-400">/ {discount.maxUsage}</span>
                      </div>
                      <div className="h-1 w-full rounded-full bg-stone-100 overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${discount.status === 'Expired' ? 'bg-stone-300' : 'bg-[#16a34a]'}`} 
                          style={{ width: `${percentUsed}%` }}
                        ></div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-[11px] text-stone-600">{discount.validity}</td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center rounded border px-2 py-0.5 text-[9px] font-bold ${getStatusBadge(discount.status)}`}>
                        {discount.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-3 text-stone-400">
                        <button className="hover:text-stone-950 transition-colors"><span className="material-symbols-outlined text-[16px]">edit</span></button>
                        <button className="hover:text-stone-950 transition-colors"><span className="material-symbols-outlined text-[16px]">bar_chart</span></button>
                        <button className="hover:text-stone-950 transition-colors"><span className="material-symbols-outlined text-[16px]">more_vert</span></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-stone-100 px-6 py-4">
          <p className="text-xs text-stone-500">
            Showing 1 to {mappedDiscounts.length} of {mappedDiscounts.length} discounts
          </p>
          <div className="flex items-center gap-1">
            <button className="flex h-8 w-8 items-center justify-center rounded-md text-stone-300 disabled:opacity-50" disabled>
              <span className="material-symbols-outlined text-[16px]">chevron_left</span>
            </button>
            <button className="flex h-8 w-8 items-center justify-center rounded-md bg-[#EFE9E0] text-xs font-bold text-stone-950 border border-[#E5DFD6]">1</button>
            <button className="flex h-8 w-8 items-center justify-center rounded-md text-xs font-bold text-stone-500 hover:bg-stone-50">2</button>
            <button className="flex h-8 w-8 items-center justify-center rounded-md text-stone-500 hover:bg-stone-50">
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </button>
          </div>
        </div>
      </section>

      {/* Bottom Banner */}
      <section className="relative overflow-hidden rounded-2xl bg-[#EFE9E0] flex items-center shadow-sm">
        <div className="p-8 md:p-10 w-full max-w-lg z-10">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-stone-700 shadow-sm mb-6">
            <span className="material-symbols-outlined text-2xl rotate-45">sell</span>
          </div>
          <h4 className="font-headline text-xl font-bold text-stone-950">Create smarter discounts</h4>
          <p className="mt-3 text-sm text-stone-600 leading-relaxed max-w-sm">
            Use targeted discounts for specific customer segments, products or order values to maximize impact.
          </p>
          <Link to="#" className="mt-6 inline-flex items-center gap-1.5 text-xs font-bold text-stone-950 hover:underline">
            Learn more about discount strategies <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </Link>
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-90 hidden md:block">
          <img src="https://images.unsplash.com/photo-1555626906-fcf10d6851b4?w=800&q=80" alt="Discount Tags" className="h-full w-full object-cover grayscale opacity-30 mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#EFE9E0] to-transparent"></div>
        </div>
      </section>
    </SellerLayout>
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
