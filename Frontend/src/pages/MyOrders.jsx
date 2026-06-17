import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { getMyOrders } from "../api/order";
import { formatPrice } from "../utils/currency";

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
        setError(err?.response?.data?.message || "Failed to load orders.");
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, []);

  return (
    <main className="bg-surface px-6 py-16 md:px-12">
      <div className="mx-auto max-w-5xl">
        <header className="mb-12 border-b border-outline-variant/15 pb-8">
          <p className="font-label text-[10px] uppercase tracking-[0.3em] font-bold text-on-surface-variant">
            Account
          </p>
          <h1 className="mt-4 font-headline text-4xl text-on-background">
            My Orders
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-on-surface-variant">
            Review the archive of confirmed purchases.
          </p>
        </header>

        {location.state?.orderPlaced ? (
          <div className="mb-8 border border-primary/20 bg-primary/5 p-5 text-sm text-on-background">
            Order placed successfully{location.state?.orderId ? ` (${location.state.orderId})` : ""}.
          </div>
        ) : null}

        {error ? (
          <section className="border border-error/20 bg-error/5 p-8 text-error">
            {error}
          </section>
        ) : loading ? (
          <section className="border border-outline-variant/15 bg-surface-container-lowest p-8 text-on-surface-variant shadow-[0px_24px_48px_rgba(47,52,48,0.05)]">
            Loading orders...
          </section>
        ) : orders.length === 0 ? (
          <section className="border border-outline-variant/15 bg-surface-container-lowest p-8 shadow-[0px_24px_48px_rgba(47,52,48,0.05)]">
            <div className="flex h-64 flex-col items-center justify-center text-center">
              <span className="material-symbols-outlined text-5xl text-outline-variant">
                receipt_long
              </span>
              <h2 className="mt-6 font-headline text-2xl text-on-background">
                No orders yet
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-on-surface-variant">
                Once you complete checkout, your orders will appear here.
              </p>
            </div>
          </section>
        ) : (
          <section className="space-y-6">
            {orders.map((order) => (
              <article
                key={order._id}
                className="border border-outline-variant/15 bg-surface-container-lowest p-8 shadow-[0px_24px_48px_rgba(47,52,48,0.05)]"
              >
                <div className="mb-6 flex flex-wrap items-start justify-between gap-4 border-b border-outline-variant/15 pb-6">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">
                      {order.orderId}
                    </p>
                    <h2 className="mt-2 font-headline text-2xl text-on-background">
                      {order.status}
                    </h2>
                  </div>
                  <div className="text-right text-sm text-on-surface-variant">
                    <p>{new Date(order.createdAt).toLocaleDateString()}</p>
                    <p className="mt-2 font-headline text-lg text-on-background">
                      {formatPrice(order.totalAmount)}
                    </p>
                  </div>
                </div>
                <div className="space-y-5">
                  {order.items.map((item, index) => (
                    <div key={`${order._id}-${index}`} className="flex gap-5">
                      <div className="h-28 w-20 overflow-hidden bg-surface-container-highest">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.productName}
                            className="h-full w-full object-cover"
                          />
                        ) : null}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-headline text-lg text-on-background">
                          {item.productName}
                        </h3>
                        <p className="mt-1 text-[10px] uppercase tracking-widest text-on-surface-variant">
                          {item.brandName} / Size {item.size} / Qty {item.quantity}
                        </p>
                        <p className="mt-3 text-sm text-on-background">
                          {formatPrice(item.price)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
