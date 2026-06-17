import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { clearCart, getCart, removeCartItem, updateCartItem } from "../api/cart";
import { formatPrice } from "../utils/currency";

export default function Cart() {
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const res = await getCart();
      setCart(res.data || { items: [] });
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load cart");
    }
  };

  useEffect(() => { load(); }, []);

  const changeQty = async (productId, size, qty) => {
    await updateCartItem({ productId, quantity: qty, size });
    load();
  };

  const removeItem = async (productId, size) => {
    await removeCartItem({ productId, size });
    load();
  };

  const onClear = async () => { await clearCart(); load(); };

  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!cart) return <div className="p-6">Loading...</div>;

  const items = cart.items || [];
  const subtotal = items.reduce((sum, it) => sum + (it.product?.price || 0) * it.quantity, 0);

  return (
    <main className="px-6 md:px-12 py-10 bg-surface">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 max-w-7xl mx-auto">
        <section className="lg:col-span-8">
          <h1 className="font-label text-[12px] uppercase tracking-[0.25em] font-bold text-on-surface mb-6">Your Archive</h1>

          {items.length === 0 ? (
            <div className="bg-surface-container-lowest p-10 border border-outline-variant/15">Your cart is empty.</div>
          ) : (
            <div className="space-y-6">
              {items.map((it) => (
                <div key={`${it.product?._id}-${it.size}`} className="bg-surface-container-lowest border border-outline-variant/15 p-4 md:p-6 flex gap-4 shadow-[0px_20px_40px_rgba(47,52,48,0.05)]">
                  <img src={it.product?.images?.[0]} alt={it.product?.productName} className="w-28 h-28 md:w-40 md:h-40 object-cover" />
                  <div className="flex-1 grid md:grid-cols-2 gap-4">
                    <div>
                      <div className="font-headline text-lg">{it.product?.productName}</div>
                      <div className="text-on-surface-variant text-sm">{it.product?.brandName}</div>
                      <div className="mt-2 text-on-surface">
                        {formatPrice(it.product?.price)}
                      </div>
                      <div className="mt-3 flex gap-3 items-center text-sm">
                        <span className="text-on-surface-variant">Size</span>
                        <span className="border border-outline rounded px-2 py-[2px]">{it.size}</span>
                      </div>
                    </div>
                    <div className="flex md:items-end justify-between md:justify-end gap-4">
                      <div className="flex items-center gap-2 border border-outline rounded px-2 py-1 h-9">
                        <button onClick={() => changeQty(it.product._id, it.size, Math.max(1, it.quantity - 1))} className="hover:text-primary">-</button>
                        <span className="w-6 text-center">{it.quantity}</span>
                        <button onClick={() => changeQty(it.product._id, it.size, it.quantity + 1)} className="hover:text-primary">+</button>
                      </div>
                      <button onClick={() => removeItem(it.product._id, it.size)} className="font-label text-[10px] uppercase tracking-widest border-b border-transparent hover:border-error text-on-surface-variant hover:text-error">Remove</button>
                    </div>
                  </div>
                </div>
              ))}

              <div className="bg-surface-container-low p-6">
                <p className="font-headline text-sm italic text-secondary mb-2">The Archivist's Note</p>
                <p className="font-body text-xs leading-relaxed text-on-surface-variant max-w-md">Our pieces are crafted for longevity. By choosing these garments, you are investing in a wardrobe that transcends seasonal trends. All shipping is climate-neutral.</p>
              </div>
            </div>
          )}
        </section>

        <aside className="lg:col-span-4 sticky top-24 self-start">
          <div className="bg-surface-container-lowest p-8 border border-outline-variant/15 shadow-[0px_40px_60px_rgba(47,52,48,0.06)]">
            <h2 className="font-label text-[12px] uppercase tracking-[0.25em] font-bold text-on-surface mb-8 border-b border-outline-variant/15 pb-4">Order Summary</h2>

            <div className="space-y-4 mb-6 text-sm">
              <div className="flex justify-between"><span className="text-on-surface-variant uppercase tracking-widest text-[10px]">Subtotal</span><span>{formatPrice(subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-on-surface-variant uppercase tracking-widest text-[10px]">Shipping</span><span className="italic">Calculated at next step</span></div>
              <div className="flex justify-between"><span className="text-on-surface-variant uppercase tracking-widest text-[10px]">Taxes</span><span>{formatPrice(0)}</span></div>
              <div className="pt-4 border-t border-outline-variant/15 flex justify-between items-baseline"><span className="uppercase tracking-[0.2em] font-bold text-[11px]">Total</span><span className="text-2xl">{formatPrice(subtotal)}</span></div>
            </div>

            <button
              onClick={() => navigate("/checkout")}
              disabled={items.length === 0}
              className="mb-4 w-full bg-primary py-4 font-label text-[11px] font-bold uppercase tracking-[0.3em] text-on-primary transition-colors hover:bg-primary-dim active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Proceed to Checkout
            </button>

            <div className="mt-6 space-y-3 text-on-surface-variant">
              <div className="flex items-center gap-3"><span className="material-symbols-outlined text-lg">local_shipping</span><span className="font-label text-[9px] uppercase tracking-widest">Complimentary Express Shipping</span></div>
              <div className="flex items-center gap-3"><span className="material-symbols-outlined text-lg">verified_user</span><span className="font-label text-[9px] uppercase tracking-widest">30-Day Archival Returns</span></div>
            </div>

            <div className="mt-10">
              <label className="block font-label text-[9px] uppercase tracking-widest text-on-surface-variant mb-2">Promotion Code</label>
              <div className="flex gap-2">
                <input className="flex-grow bg-surface-container-low border-0 border-b border-outline focus:ring-0 focus:border-primary text-sm font-body px-0 py-2 placeholder:text-outline-variant" placeholder="Enter Code" type="text" />
                <button className="font-label text-[9px] uppercase tracking-widest border border-outline px-4 hover:bg-surface-container transition-colors">Apply</button>
              </div>
            </div>

            {items.length > 0 && (
              <button onClick={onClear} className="mt-8 w-full border border-outline px-4 py-2 text-on-surface-variant hover:text-error hover:border-error transition-colors">Clear Cart</button>
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}
