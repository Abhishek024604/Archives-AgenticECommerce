import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { API } from "../api/axios";
import { dispatchSellerOrder, getSellerOrders } from "../api/order";
import { useAuth } from "../context/AuthContext";

const TABS = [
  { id: "inventory", label: "Inventory" },
  { id: "orders", label: "Orders" },
];

export default function SellerDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("inventory");
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [inventoryLoading, setInventoryLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [inventoryError, setInventoryError] = useState("");
  const [ordersError, setOrdersError] = useState("");
  const [dispatchingOrderId, setDispatchingOrderId] = useState("");
  const [dispatchError, setDispatchError] = useState("");

  useEffect(() => {
    if (!user?._id || user.role !== "seller") {
      return;
    }

    let cancelled = false;

    const loadInventory = async () => {
      try {
        setInventoryLoading(true);
        setInventoryError("");
        const res = await API.get("/products");
        const mine = (res.data || []).filter((product) => {
          const sellerId =
            typeof product.seller === "string"
              ? product.seller
              : product.seller?._id;

          return sellerId === user._id;
        });

        if (!cancelled) {
          setProducts(mine);
        }
      } catch (err) {
        if (!cancelled) {
          setInventoryError(
            err?.response?.data?.message || "Failed to load inventory"
          );
        }
      } finally {
        if (!cancelled) {
          setInventoryLoading(false);
        }
      }
    };

    const loadOrders = async () => {
      try {
        setOrdersLoading(true);
        setOrdersError("");
        const res = await getSellerOrders();

        if (!cancelled) {
          setOrders(res.data || []);
        }
      } catch (err) {
        if (!cancelled) {
          setOrdersError(
            err?.response?.data?.message || "Failed to load seller orders"
          );
        }
      } finally {
        if (!cancelled) {
          setOrdersLoading(false);
        }
      }
    };

    loadInventory();
    loadOrders();

    return () => {
      cancelled = true;
    };
  }, [user?._id, user?.role]);

  const inventoryMetrics = useMemo(() => {
    const totalProducts = products.length;
    const totalUnits = products.reduce(
      (sum, product) =>
        sum +
        (product.variants || []).reduce(
          (variantSum, variant) => variantSum + (Number(variant.stock) || 0),
          0
        ),
      0
    );
    const soldOutProducts = products.filter((product) =>
      (product.variants || []).every(
        (variant) => (Number(variant.stock) || 0) === 0
      )
    ).length;
    const averagePrice = totalProducts
      ? products.reduce((sum, product) => sum + (Number(product.price) || 0), 0) /
        totalProducts
      : 0;

    return { totalProducts, totalUnits, soldOutProducts, averagePrice };
  }, [products]);

  const orderMetrics = useMemo(() => {
    const totalOrders = orders.length;
    const totalUnitsOrdered = orders.reduce(
      (sum, order) =>
        sum +
        (order.items || []).reduce(
          (itemSum, item) => itemSum + (Number(item.quantity) || 0),
          0
        ),
      0
    );
    const processedOrders = orders.filter(
      (order) => order.sellerStatus === "PROCESSED"
    );
    const revenueToBeProcessed = orders.reduce(
      (sum, order) =>
        order.sellerStatus === "PROCESSED"
          ? sum
          : sum + (Number(order.sellerTotalAmount) || 0),
      0
    );
    const processedRevenue = processedOrders.reduce(
      (sum, order) => sum + (Number(order.sellerTotalAmount) || 0),
      0
    );
    const totalCustomers = new Set(
      orders
        .map((order) =>
          typeof order.user === "string" ? order.user : order.user?._id
        )
        .filter(Boolean)
    ).size;

    return {
      totalOrders,
      totalUnitsOrdered,
      totalCustomers,
      processedOrders: processedOrders.length,
      revenueToBeProcessed,
      processedRevenue,
    };
  }, [orders]);

  const handleDispatch = async (orderId) => {
    try {
      setDispatchingOrderId(orderId);
      setDispatchError("");
      const res = await dispatchSellerOrder(orderId);

      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          order._id === orderId ? res.data : order
        )
      );
    } catch (err) {
      setDispatchError(
        err?.response?.data?.message || "Failed to dispatch order"
      );
    } finally {
      setDispatchingOrderId("");
    }
  };

  const formatPrice = (value) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value || 0);

  const formatDate = (value) =>
    new Date(value).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const formatPaymentMethod = (value) =>
    (value || "")
      .toLowerCase()
      .split("_")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");

  const getInventoryStatus = (product) => {
    const totalStock = (product.variants || []).reduce(
      (sum, variant) => sum + (Number(variant.stock) || 0),
      0
    );

    if (totalStock === 0) {
      return {
        label: "Sold Out",
        className: "bg-surface-container-highest text-on-surface-variant",
      };
    }

    if (totalStock <= 5) {
      return {
        label: "Low Stock",
        className: "bg-secondary-container text-on-secondary-container",
      };
    }

    return {
      label: "Active",
      className: "bg-primary-container text-on-primary-container",
    };
  };

  const storeName = user?.sellerInfo?.storeName || "Your Archive";

  if (user && user.role !== "seller") {
    return (
      <main className="mx-auto max-w-4xl px-6 py-16 md:px-12">
        <div className="border border-outline-variant/15 bg-surface-container-lowest p-10 text-center">
          <h1 className="font-headline text-3xl text-on-background">
            Seller access only
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-on-surface-variant">
            This dashboard is available only to accounts with the seller role.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-12 md:px-12">
      <header className="mb-16 md:flex md:items-end md:justify-between">
        <div className="max-w-xl">
          <span className="mb-4 block text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">
            Merchant Dashboard
          </span>
          <h1 className="font-headline text-5xl font-bold leading-tight tracking-tighter text-on-background md:text-6xl">
            Archive Manager
          </h1>
          <p className="mt-4 text-lg italic text-on-surface-variant opacity-80">
            {storeName}. Track inventory and incoming orders from one place.
          </p>
        </div>
        <div className="mt-8 flex flex-wrap gap-4 md:mt-0">
          <Link
            to="/seller/add"
            className="flex items-center gap-3 bg-primary px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-on-primary transition-colors hover:bg-primary-dim active:scale-95"
          >
            <span className="material-symbols-outlined">add</span>
            Add New Product
          </Link>
          <Link
            to="/seller/my-products"
            className="border border-outline px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-on-surface transition-colors hover:bg-surface-container-high active:scale-95"
          >
            View Full Inventory
          </Link>
        </div>
      </header>

      <nav className="mb-12 flex gap-10 border-b border-outline-variant/15 pb-4">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`pb-4 text-[11px] font-bold uppercase tracking-[0.2em] transition-colors ${
              activeTab === tab.id
                ? "border-b border-on-background text-on-background"
                : "text-on-surface-variant hover:text-on-background"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {activeTab === "inventory" ? (
        <>
          <section className="mb-20 grid grid-cols-1 gap-0 border border-outline-variant/15 md:grid-cols-4">
            <MetricCard
              title="Items Listed"
              value={inventoryMetrics.totalProducts}
              hint="Products in your archive"
              tone="low"
            />
            <MetricCard
              title="Units In Stock"
              value={inventoryMetrics.totalUnits}
              hint="Across all size variants"
              tone="lowest"
            />
            <MetricCard
              title="Sold Out"
              value={inventoryMetrics.soldOutProducts}
              hint="Products needing restock"
              tone="low"
            />
            <MetricCard
              title="Average Price"
              value={formatPrice(inventoryMetrics.averagePrice)}
              hint="Based on current listings"
              tone="lowest"
              borderless
            />
          </section>

          <section className="mb-24">
            <div className="mb-8 flex items-center justify-between">
              <h2 className="font-headline text-2xl font-bold italic">
                Current Inventory
              </h2>
              <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                {inventoryLoading
                  ? "Loading inventory"
                  : `${products.length} products`}
              </span>
            </div>

            {inventoryError ? (
              <div className="border border-error/20 bg-error/5 p-6 text-sm text-error">
                {inventoryError}
              </div>
            ) : inventoryLoading ? (
              <div className="border border-outline-variant/15 bg-surface-container-lowest p-10 text-on-surface-variant">
                Loading inventory...
              </div>
            ) : products.length === 0 ? (
              <EmptyState
                title="No products listed yet"
                description="Start by adding the first product to your archive."
                actionLabel="Add Product"
                actionHref="/seller/add"
              />
            ) : (
              <div className="space-y-6">
                {products.slice(0, 6).map((product) => {
                  const status = getInventoryStatus(product);
                  const totalStock = (product.variants || []).reduce(
                    (sum, variant) => sum + (Number(variant.stock) || 0),
                    0
                  );

                  return (
                    <article
                      key={product._id}
                      className="grid grid-cols-1 items-center gap-8 border border-transparent bg-surface-container-lowest p-4 transition-all hover:border-outline-variant/20 md:grid-cols-12"
                    >
                      <div className="relative h-24 w-full overflow-hidden bg-surface-container md:col-span-1">
                        {product.images?.[0] ? (
                          <img
                            src={product.images[0]}
                            alt={product.productName}
                            className="h-full w-full object-cover opacity-90"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-on-surface-variant">
                            <span className="material-symbols-outlined">
                              image
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="md:col-span-5">
                        <h3 className="font-headline text-lg font-bold">
                          {product.productName}
                        </h3>
                        <p className="mt-1 text-[10px] uppercase tracking-widest text-on-surface-variant">
                          {product.brandName} / {product.variants?.length || 0} sizes
                        </p>
                      </div>
                      <div className="md:col-span-2">
                        <span className="mb-1 block text-[10px] uppercase tracking-widest text-on-surface-variant">
                          Price
                        </span>
                        <span className="font-headline font-bold">
                          {formatPrice(product.price)}
                        </span>
                      </div>
                      <div className="md:col-span-2">
                        <span className="mb-1 block text-[10px] uppercase tracking-widest text-on-surface-variant">
                          Status
                        </span>
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 text-[9px] font-bold uppercase tracking-widest ${status.className}`}
                        >
                          {status.label}
                        </span>
                        <p className="mt-2 text-[10px] uppercase tracking-widest text-on-surface-variant">
                          {totalStock} units
                        </p>
                      </div>
                      <div className="flex justify-end gap-4 md:col-span-2">
                        <Link
                          to={`/seller/products/${product._id}/edit`}
                          className="transition-colors hover:text-primary"
                          aria-label={`Edit ${product.productName}`}
                        >
                          <span className="material-symbols-outlined">edit</span>
                        </Link>
                        <Link
                          to={`/product/${product._id}`}
                          className="transition-colors hover:text-primary"
                          aria-label={`View ${product.productName}`}
                        >
                          <span className="material-symbols-outlined">
                            visibility
                          </span>
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </>
      ) : (
        <>
          <section className="mb-16 grid grid-cols-1 gap-0 border border-outline-variant/15 sm:grid-cols-2 lg:grid-cols-6">
            <MetricCard
              title="Orders Received"
              value={orderMetrics.totalOrders}
              hint="Orders containing your products"
              tone="low"
              compact
            />
            <MetricCard
              title="Units Ordered"
              value={orderMetrics.totalUnitsOrdered}
              hint="Across all seller items"
              tone="lowest"
              compact
            />
            <MetricCard
              title="Customers"
              value={orderMetrics.totalCustomers}
              hint="Unique buyers served"
              tone="low"
              compact
            />
            <MetricCard
              title="Orders Processed"
              value={orderMetrics.processedOrders}
              hint="Orders dispatched by your team"
              tone="lowest"
              compact
            />
            <MetricCard
              title="Revenue To Be Processed"
              value={formatPrice(orderMetrics.revenueToBeProcessed)}
              hint="Revenue from orders awaiting dispatch"
              tone="low"
              compact
            />
            <MetricCard
              title="Revenue Processed"
              value={formatPrice(orderMetrics.processedRevenue)}
              hint="Revenue from dispatched orders"
              tone="lowest"
              borderless
              compact
            />
          </section>

          <section className="mb-24">
            <div className="mb-8 flex items-center justify-between">
              <h2 className="font-headline text-2xl font-bold italic">
                Incoming Orders
              </h2>
              <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                {ordersLoading ? "Loading orders" : `${orders.length} orders`}
              </span>
            </div>

            {ordersError ? (
              <div className="border border-error/20 bg-error/5 p-6 text-sm text-error">
                {ordersError}
              </div>
            ) : ordersLoading ? (
              <div className="border border-outline-variant/15 bg-surface-container-lowest p-10 text-on-surface-variant">
                Loading orders...
              </div>
            ) : orders.length === 0 ? (
              <EmptyState
                title="No seller orders yet"
                description="Once customers place orders for your products, they will appear here."
              />
            ) : (
              <div className="space-y-6">
                {dispatchError ? (
                  <div className="border border-error/20 bg-error/5 p-4 text-sm text-error">
                    {dispatchError}
                  </div>
                ) : null}
                {orders.map((order) => (
                  <article
                    key={order._id}
                    className="border border-outline-variant/15 bg-surface-container-lowest p-6 shadow-[0px_24px_48px_rgba(47,52,48,0.05)]"
                  >
                    <div className="flex flex-col gap-6 border-b border-outline-variant/15 pb-6 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">
                          {order.orderId}
                        </p>
                        <div className="mt-3 flex flex-wrap items-center gap-3">
                          <h3 className="font-headline text-2xl text-on-background">
                            {order.user?.name || "Customer"}
                          </h3>
                          <span className="inline-flex bg-primary-container px-3 py-1 text-[9px] font-bold uppercase tracking-widest text-on-primary-container">
                            {order.sellerStatus === "PROCESSED"
                              ? "Processed"
                              : "To Be Processed"}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-on-surface-variant">
                          {order.user?.email || "Customer email unavailable"}
                        </p>
                      </div>

                      <div className="grid gap-3 text-sm text-on-surface-variant md:text-right">
                        <div>
                          <span className="block text-[10px] font-bold uppercase tracking-widest">
                            Order Date
                          </span>
                          <span className="mt-1 block text-on-background">
                            {formatDate(order.createdAt)}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[10px] font-bold uppercase tracking-widest">
                            Payment
                          </span>
                          <span className="mt-1 block text-on-background">
                            {formatPaymentMethod(order.paymentMethod)}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[10px] font-bold uppercase tracking-widest">
                            Seller Total
                          </span>
                          <span className="mt-1 block font-headline text-lg text-on-background">
                            {formatPrice(order.sellerTotalAmount)}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDispatch(order._id)}
                          disabled={
                            order.sellerStatus === "PROCESSED" ||
                            dispatchingOrderId === order._id
                          }
                          className="bg-primary px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-on-primary transition-colors hover:bg-primary-dim disabled:cursor-not-allowed disabled:bg-surface-container-highest disabled:text-on-surface-variant"
                        >
                          {order.sellerStatus === "PROCESSED"
                            ? "Dispatched"
                            : dispatchingOrderId === order._id
                              ? "Dispatching..."
                              : "Dispatch Order"}
                        </button>
                      </div>
                    </div>

                    <div className="grid gap-8 pt-6 lg:grid-cols-[1.5fr_1fr]">
                      <div className="space-y-4">
                        {order.items.map((item, index) => (
                          <div
                            key={`${order._id}-${item.productId || index}-${index}`}
                            className="flex gap-4 border border-outline-variant/10 bg-surface p-4"
                          >
                            <div className="h-24 w-20 overflow-hidden bg-surface-container">
                              {item.image ? (
                                <img
                                  src={item.image}
                                  alt={item.productName}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-on-surface-variant">
                                  <span className="material-symbols-outlined">
                                    image
                                  </span>
                                </div>
                              )}
                            </div>

                            <div className="flex-1">
                              <h4 className="font-headline text-lg text-on-background">
                                {item.productName}
                              </h4>
                              <p className="mt-1 text-[10px] uppercase tracking-widest text-on-surface-variant">
                                {item.brandName} / Size {item.size} / Qty {item.quantity}
                              </p>
                              <p className="mt-3 text-sm text-on-background">
                                {formatPrice(
                                  (Number(item.price) || 0) * (Number(item.quantity) || 0)
                                )}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="border border-outline-variant/10 bg-surface p-5">
                        <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">
                          Shipping Address
                        </span>
                        <div className="mt-4 space-y-1 text-sm leading-relaxed text-on-background">
                          <p>{order.shippingAddress?.name}</p>
                          <p>{order.shippingAddress?.phone}</p>
                          <p>{order.shippingAddress?.addressLine}</p>
                          <p>
                            {order.shippingAddress?.city}, {order.shippingAddress?.state}
                          </p>
                          <p>{order.shippingAddress?.pincode}</p>
                        </div>
                        <div className="mt-6 border-t border-outline-variant/10 pt-4 text-sm text-on-surface-variant">
                          <p>{order.sellerItemCount} units in this order for your store.</p>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}

function MetricCard({
  title,
  value,
  hint,
  tone,
  borderless = false,
  compact = false,
}) {
  const toneClass =
    tone === "low" ? "bg-surface-container-low" : "bg-surface-container-lowest";
  const paddingClass = compact ? "min-w-0 px-5 py-6" : "p-8";
  const titleClass = compact
    ? "text-[9px] leading-tight tracking-[0.15em]"
    : "text-[10px] tracking-[0.2em]";
  const valueClass = compact
    ? "block break-words text-2xl leading-tight"
    : "text-3xl";
  const hintClass = compact
    ? "mt-3 text-[11px] leading-snug"
    : "mt-4 text-xs";

  return (
    <div
      className={`${paddingClass} ${toneClass} ${
        borderless ? "" : "border-r border-outline-variant/15"
      }`}
    >
      <span
        className={`mb-2 block font-bold uppercase text-on-surface-variant ${titleClass}`}
      >
        {title}
      </span>
      <span
        className={`font-headline font-bold text-on-background ${valueClass}`}
      >
        {value}
      </span>
      <div className={`italic text-on-surface-variant ${hintClass}`}>
        {hint}
      </div>
    </div>
  );
}

function EmptyState({ title, description, actionLabel, actionHref }) {
  return (
    <div className="border border-outline-variant/15 bg-surface-container-lowest p-10">
      <h3 className="font-headline text-2xl text-on-background">{title}</h3>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-on-surface-variant">
        {description}
      </p>
      {actionLabel && actionHref ? (
        <Link
          to={actionHref}
          className="mt-6 inline-flex items-center gap-3 bg-primary px-6 py-3 text-[11px] font-bold uppercase tracking-widest text-on-primary transition-colors hover:bg-primary-dim"
        >
          <span className="material-symbols-outlined">add</span>
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
