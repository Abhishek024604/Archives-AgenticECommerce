import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getSellerOrders } from "../api/order";
import { API } from "../api/axios";
import { useAuth } from "../context/AuthContext";
import SellerLayout from "./components/SellerLayout";

export default function SellerPayouts() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const transactionsPerPage = 6;

  useEffect(() => {
    if (!user?._id || user.role !== "seller") return;

    let cancelled = false;

    const loadOrders = async () => {
      try {
        setLoading(true);
        setError("");
        const [ordersRes, payoutsRes] = await Promise.all([
          getSellerOrders(),
          API.get("/payouts/seller")
        ]);
        if (!cancelled) {
          setOrders(ordersRes.data || []);
          setPayouts(payoutsRes.data || []);
        }
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

  // Dynamic calculations based on live orders
  const { totalEarnings, pendingBalance } = useMemo(() => {
    let earned = 0;
    let pending = 0;

    orders.forEach(order => {
      const amount = Number(order.sellerTotalAmount) || 0;
      if (order.sellerStatus === "DELIVERED" || order.sellerStatus === "PROCESSED") {
        earned += amount;
      } else if (order.sellerStatus === "SHIPPED" || order.sellerStatus === "PROCESSING" || !order.sellerStatus) {
        pending += amount;
      }
    });

    return { totalEarnings: earned, pendingBalance: pending };
  }, [orders]);

  const totalPayouts = useMemo(() => {
    return payouts.reduce((sum, p) => p.status === "Paid" ? sum + (Number(p.amount) || 0) : sum, 0);
  }, [payouts]);

  const availableBalance = Math.max(0, totalEarnings - totalPayouts);

  const formatPrice = (value) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value || 0);

  const transactions = useMemo(() => {
    return payouts.map(p => {
      const d = new Date(p.createdAt);
      return {
        id: p._id.slice(-8).toUpperCase(),
        date: d.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }),
        time: d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }),
        amount: Number(p.amount) || 0,
        status: p.status,
        statusColor: p.status === "Paid" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700",
        mode: p.paymentMode || "NEFT",
        account: "•••• " + (user?.sellerInfo?.accountNumber?.slice(-4) || "5678")
      };
    }).sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [payouts, user]);

  return (
    <SellerLayout activeTab="payouts">
      {/* Header */}
      <header className="mb-10 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
        <div>
          <h1 className="font-headline text-4xl font-bold leading-tight tracking-tight text-stone-950 md:text-5xl">
            Payouts
          </h1>
          <p className="mt-3 text-sm text-stone-500">
            Track your earnings, payouts and transaction history.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button className="flex items-center justify-center gap-2 rounded-lg bg-stone-950 px-5 py-2.5 text-[11px] font-bold text-white transition-colors hover:bg-black">
            <span className="material-symbols-outlined text-sm">download</span>
            Request Payout
          </button>
          <button className="flex items-center justify-center gap-2 rounded-lg border border-stone-300 bg-white px-5 py-2.5 text-[11px] font-bold text-stone-700 transition-colors hover:bg-stone-50">
            Payout Settings
            <span className="material-symbols-outlined text-sm">settings</span>
          </button>
        </div>
      </header>

      {/* Top Metrics Row */}
      <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col justify-between rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <div>
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full border bg-stone-50 border-stone-100 text-[#B4966E]">
              <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
            </div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-stone-500">AVAILABLE BALANCE</p>
            <p className="mt-1 font-headline text-3xl font-bold text-stone-950">{formatPrice(availableBalance)}</p>
            <p className="mt-2 text-[11px] text-stone-500">Ready to withdraw</p>
          </div>
          <div className="mt-6 pt-4 border-t border-stone-100">
            <button className="flex items-center gap-1 rounded-md bg-stone-100 px-3 py-1.5 text-[10px] font-bold text-stone-950 hover:bg-stone-200 transition-colors">
              Request Payout <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </button>
          </div>
        </div>

        <MetricCard
          icon="account_tree"
          title="TOTAL EARNINGS"
          value={formatPrice(totalEarnings)}
          hint="This Month"
          actionLabel="View earnings"
          trend="18.2%"
          trendColor="text-green-600"
          trendBg="bg-green-50"
        />
        
        <MetricCard
          icon="inventory_2"
          title="TOTAL PAYOUTS"
          value={formatPrice(totalPayouts)}
          hint="Paid till date"
          actionLabel="View payout history"
          actionColor="text-blue-600"
          iconColor="text-blue-500"
        />

        <MetricCard
          icon="schedule"
          title="PENDING BALANCE"
          value={formatPrice(pendingBalance)}
          hint="From orders in transit"
          actionLabel="View details"
          iconColor="text-orange-500"
        />
      </section>

      {/* Middle Section: Details */}
      <section className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">

        {/* Right Column: Account & Schedule */}
        <div className="flex flex-col gap-6">
          {/* Payout Account */}
          <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm flex-1">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="font-headline text-[15px] font-bold text-stone-950">Payout Account</h3>
              <button className="rounded-md border border-stone-300 bg-white px-2 py-1 text-[9px] font-bold text-stone-700 hover:bg-stone-50">
                Manage
              </button>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EFE9E0] text-[#B4966E]">
                <span className="material-symbols-outlined text-lg">account_balance</span>
              </div>
              <div>
                <p className="text-[11px] font-bold text-stone-950">HDFC Bank</p>
                <p className="mt-1 text-[10px] text-stone-500">A/C No. 5020 1234 5678 91</p>
                <p className="mt-0.5 text-[10px] text-stone-500">IFSC: HDFC0005020</p>
                
                <p className="mt-3 text-[9px] text-stone-400 uppercase tracking-wider">Account Holder</p>
                <p className="mt-0.5 text-[11px] font-bold text-stone-950">{user?.storeName || "Seller's Store"}</p>
              </div>
            </div>
          </div>

          {/* Payout Schedule */}
          <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm flex-1">
            <h3 className="mb-6 font-headline text-[15px] font-bold text-stone-950">Payout Schedule</h3>
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-[16px] text-stone-400">calendar_today</span>
              <div>
                <p className="text-[11px] font-bold text-stone-950">Weekly on Monday</p>
                <p className="mt-0.5 text-[10px] text-stone-500">Next payout date: June 2, 2026</p>
              </div>
            </div>
            <div className="mt-4 flex items-start gap-2 rounded-lg bg-stone-50 p-3 border border-stone-100">
              <span className="material-symbols-outlined text-[14px] text-stone-400">info</span>
              <p className="text-[10px] text-stone-500 leading-relaxed">
                Payouts are processed automatically as per your selected schedule.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Data Table Section */}
      <section className="mb-8 rounded-2xl border border-stone-200 bg-white">
        <div className="flex flex-col items-center justify-between gap-4 border-b border-stone-200 p-4 md:flex-row">
          <h3 className="font-headline text-[15px] font-bold text-stone-950">Payout Transactions</h3>
          <div className="flex items-center gap-3">
            <FilterSelect label="All Status" />
            <FilterSelect label="May 1 - May 31, 2026" icon="calendar_today" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-stone-100 text-[9px] font-bold uppercase tracking-widest text-stone-400 bg-stone-50/50">
                <th className="px-6 py-4">PAYOUT ID</th>
                <th className="px-6 py-4">DATE</th>
                <th className="px-6 py-4 text-right">AMOUNT</th>
                <th className="px-6 py-4">STATUS</th>
                <th className="px-6 py-4">MODE</th>
                <th className="px-6 py-4">ACCOUNT DETAILS</th>
                <th className="px-6 py-4 text-center">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-700">
              {transactions.map((tx, idx) => (
                <tr key={idx} className="hover:bg-stone-50/50 transition-colors">
                  <td className="px-6 py-4 text-[11px] font-bold text-stone-950">{tx.id}</td>
                  <td className="px-6 py-4">
                    <p className="text-[11px] font-medium text-stone-950">{tx.date}</p>
                    <p className="mt-0.5 text-[9px] text-stone-500">{tx.time}</p>
                  </td>
                  <td className="px-6 py-4 text-right text-[11px] font-bold text-stone-950">{formatPrice(tx.amount)}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-sm px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest ${tx.statusColor}`}>
                      {tx.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[11px] font-medium text-stone-600">{tx.mode}</td>
                  <td className="px-6 py-4 text-[11px] font-medium text-stone-600">{tx.account}</td>
                  <td className="px-6 py-4 text-center">
                    {tx.status === "Paid" ? (
                      <button className="text-stone-400 hover:text-stone-950 transition-colors">
                        <span className="material-symbols-outlined text-[16px]">download</span>
                      </button>
                    ) : (
                      <span className="text-stone-300">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-stone-100 px-6 py-4">
          <p className="text-xs text-stone-500">
            Showing 1 to {transactions.length} of {transactions.length} transactions
          </p>
          <div className="flex items-center gap-1">
            <button className="flex h-8 w-8 items-center justify-center rounded-md text-stone-300 disabled:opacity-50" disabled>
              <span className="material-symbols-outlined text-[16px]">chevron_left</span>
            </button>
            <button className="flex h-8 w-8 items-center justify-center rounded-md bg-[#EFE9E0] text-xs font-bold text-stone-950 border border-[#E5DFD6]">1</button>
            <button className="flex h-8 w-8 items-center justify-center rounded-md text-xs font-bold text-stone-500 hover:bg-stone-50">2</button>
            <button className="flex h-8 w-8 items-center justify-center rounded-md text-xs font-bold text-stone-500 hover:bg-stone-50">3</button>
            <button className="flex h-8 w-8 items-center justify-center rounded-md text-xs font-bold text-stone-500 hover:bg-stone-50">4</button>
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
            <span className="material-symbols-outlined text-2xl">receipt_long</span>
          </div>
          <h4 className="font-headline text-xl font-bold text-stone-950">Understand your payouts</h4>
          <p className="mt-3 text-sm text-stone-600 leading-relaxed max-w-sm">
            Payouts are transferred to your bank account after deducting applicable fees and once the order is delivered or return window is closed.
          </p>
          <Link to="#" className="mt-6 inline-flex items-center gap-1.5 text-xs font-bold text-stone-950 hover:underline">
            Learn more about payouts <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </Link>
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-90 hidden md:block">
          <img src="https://images.unsplash.com/photo-1628156196232-a5e2f38ab955?w=800&q=80" alt="Wallet and Coins" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#EFE9E0] to-transparent"></div>
        </div>
      </section>

    </SellerLayout>
  );
}

function MetricCard({ icon, title, value, hint, actionLabel, iconColor = "text-stone-500", iconBg = "bg-stone-50 border-stone-100", actionColor = "text-stone-600", trend, trendColor, trendBg }) {
  return (
    <div className="flex flex-col justify-between rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
      <div>
        <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-full border ${iconBg} ${iconColor}`}>
          <span className="material-symbols-outlined text-[18px]">{icon}</span>
        </div>
        <p className="text-[9px] font-bold uppercase tracking-widest text-stone-500">{title}</p>
        <p className="mt-1 font-headline text-3xl font-bold text-stone-950">{value}</p>
        <div className="mt-2 flex items-center gap-2">
          {trend && (
            <span className={`inline-flex items-center gap-0.5 rounded-sm px-1.5 py-0.5 text-[10px] font-bold ${trendBg} ${trendColor}`}>
              <span className="material-symbols-outlined text-[10px]">north_east</span>
              {trend}
            </span>
          )}
          <p className="text-[11px] text-stone-500">{hint}</p>
        </div>
      </div>
      <div className="mt-6 pt-4 border-t border-stone-100">
        <Link to="#" className={`flex items-center gap-1 text-[11px] font-bold hover:underline ${actionColor}`}>
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
