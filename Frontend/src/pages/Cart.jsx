import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { clearCart, getCart, removeCartItem, updateCartItem, updateCartItemSize } from "../api/cart";
import { formatPrice } from "../utils/currency";
import { resolveMediaUrl } from "../utils/media";
import HomeNavbar from "../components/home/HomeNavbar";
import HomeFooter from "../components/home/HomeFooter";

export default function Cart() {
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [error, setError] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);

  const load = async () => {
    try {
      const res = await getCart();
      setCart(res.data || { items: [] });
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load shopping bag.");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const changeQty = async (productId, size, qty) => {
    await updateCartItem({ productId, quantity: qty, size });
    load();
  };

  const changeSize = async (productId, oldSize, newSize) => {
    if (oldSize === newSize) return;
    try {
      await updateCartItemSize({ productId, oldSize, newSize });
      load();
    } catch (e) {
      alert("Failed to update size");
    }
  };

  const removeItem = async (productId, size) => {
    await removeCartItem({ productId, size });
    load();
  };

  const onClear = async () => {
    await clearCart();
    load();
  };

  const handleApplyPromo = (e) => {
    e.preventDefault();
    if (promoCode.trim().toUpperCase() === "ARCHIVE10") {
      setPromoApplied(true);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-white text-stone-900 font-sans flex flex-col justify-between">
        <HomeNavbar />
        <div className="py-20 text-center text-sm font-medium text-red-600">
          {error}
        </div>
        <HomeFooter />
      </div>
    );
  }

  if (!cart) {
    return (
      <div className="min-h-screen bg-white text-stone-900 font-sans flex flex-col justify-between">
        <HomeNavbar />
        <div className="py-20 text-center text-xs font-medium text-stone-500">
          Loading your shopping bag...
        </div>
        <HomeFooter />
      </div>
    );
  }

  const items = cart.items || [];
  const subtotal = items.reduce(
    (sum, it) => sum + (it.product?.price || 0) * it.quantity,
    0
  );
  const discount = promoApplied ? Math.round(subtotal * 0.1) : 0;
  const finalTotal = Math.max(0, subtotal - discount);

  return (
    <div className="min-h-screen bg-white text-stone-900 font-sans selection:bg-stone-900 selection:text-white flex flex-col justify-between">
      <HomeNavbar />

      <main className="mx-auto max-w-[1536px] w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8 flex-1">
        
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-[11px] font-medium text-stone-500 uppercase tracking-wider">
          <Link to="/" className="hover:text-stone-900 transition-colors">
            Home
          </Link>
          <span>›</span>
          <span className="text-stone-900 font-semibold">Shopping Bag</span>
        </nav>

        {/* Page Title */}
        <div className="border-b border-stone-200 pb-6 flex items-baseline justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-headline text-3xl sm:text-5xl font-normal text-stone-950">
              Your Shopping Bag
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-stone-500 font-light">
              Review your curated selections before checkout.
            </p>
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
            {items.length} {items.length === 1 ? "Item" : "Items"}
          </span>
        </div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Cart Items List */}
          <section className="lg:col-span-8 space-y-6">
            {items.length === 0 ? (
              <div className="border border-stone-200 bg-[#FAFAFA] py-16 px-6 text-center rounded-xl">
                <span className="material-symbols-outlined text-4xl text-stone-400 mb-3">
                  shopping_bag
                </span>
                <h3 className="font-headline text-2xl text-stone-900">
                  Your bag is currently empty
                </h3>
                <p className="mt-2 text-xs text-stone-500 max-w-sm mx-auto">
                  Explore our luxury collection and add items to your archive.
                </p>
                <Link
                  to="/products"
                  className="mt-6 inline-block bg-stone-950 text-white px-8 py-3 text-xs font-bold uppercase tracking-wider hover:bg-black transition-colors rounded-md"
                >
                  Explore Collection
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((it) => (
                  <div
                    key={`${it.product?._id}-${it.size}`}
                    className="flex flex-col sm:flex-row gap-5 border border-stone-200 bg-white p-4 sm:p-6 rounded-xl transition-all hover:shadow-xs"
                  >
                    {/* Thumbnail */}
                    <div className="h-32 w-28 sm:h-36 sm:w-32 shrink-0 overflow-hidden rounded-lg bg-[#F5F4F0] border border-stone-200">
                      <img
                        src={resolveMediaUrl(it.product?.images?.[0] || it.product?.image)}
                        alt={it.product?.productName}
                        className="h-full w-full object-cover object-top"
                      />
                    </div>

                    {/* Details & Controls */}
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <span className="text-[9px] font-bold uppercase tracking-widest text-stone-400">
                              {it.product?.brandName || "Archivist"}
                            </span>
                            <h3 className="font-headline text-lg sm:text-xl font-medium text-stone-950">
                              {it.product?.productName}
                            </h3>
                          </div>
                          <span className="font-semibold text-sm sm:text-base text-stone-950">
                            {formatPrice((it.product?.price || 0) * it.quantity)}
                          </span>
                        </div>

                        <div className="mt-2 flex items-center gap-3 text-xs text-stone-600">
                          {it.product?.variants?.some(v => v.size?.trim() !== "") ? (
                            <div className="flex items-center gap-2">
                              <span>Size:</span>
                              <select
                                value={it.size}
                                onChange={(e) => changeSize(it.product._id, it.size, e.target.value)}
                                className="border border-stone-200 bg-stone-50 rounded px-1.5 py-0.5 text-stone-900 font-medium focus:outline-none focus:border-stone-400 cursor-pointer"
                              >
                                {it.product.variants.map((v) =>
                                  v.size?.trim() !== "" ? (
                                    <option key={v.size} value={v.size}>
                                      {v.size}
                                    </option>
                                  ) : null
                                )}
                              </select>
                            </div>
                          ) : it.size?.trim() !== "" ? (
                            <span>Size: <strong className="text-stone-900">{it.size}</strong></span>
                          ) : null}
                          
                          {it.size?.trim() !== "" && it.product?.variants?.some(v => v.size?.trim() !== "") ? <span>•</span> : null}
                          <span>Unit Price: {formatPrice(it.product?.price)}</span>
                        </div>
                      </div>

                      {/* Quantity & Actions Bar */}
                      <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
                        {/* Quantity Pill */}
                        <div className="flex items-center gap-3 border border-stone-300 bg-stone-50 px-3 py-1 rounded-md text-xs">
                          <button
                            type="button"
                            onClick={() =>
                              changeQty(
                                it.product._id,
                                it.size,
                                Math.max(1, it.quantity - 1)
                              )
                            }
                            className="text-stone-600 hover:text-stone-950 font-bold px-1"
                          >
                            -
                          </button>
                          <span className="w-6 text-center font-bold text-stone-950">
                            {it.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              changeQty(it.product._id, it.size, it.quantity + 1)
                            }
                            className="text-stone-600 hover:text-stone-950 font-bold px-1"
                          >
                            +
                          </button>
                        </div>

                        {/* Remove Action */}
                        <button
                          type="button"
                          onClick={() => removeItem(it.product._id, it.size)}
                          className="text-[10px] font-bold uppercase tracking-wider text-red-600 hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Clear Cart Button */}
                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={onClear}
                    className="text-xs text-stone-500 hover:text-stone-900 font-medium underline"
                  >
                    Clear Entire Bag
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* Right Column: Order Summary Side Panel */}
          <aside className="lg:col-span-4 sticky top-28">
            <div className="border border-stone-200/80 bg-[#FAFAFA] p-6 sm:p-8 rounded-xl space-y-6">
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-stone-950 border-b border-stone-200 pb-4">
                Order Summary
              </h2>

              <div className="space-y-3 text-xs text-stone-700">
                <div className="flex justify-between">
                  <span className="text-stone-500">Subtotal</span>
                  <span className="font-semibold text-stone-900">{formatPrice(subtotal)}</span>
                </div>

                {promoApplied && (
                  <div className="flex justify-between text-green-700">
                    <span>Discount (ARCHIVE10)</span>
                    <span>-{formatPrice(discount)}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="text-stone-500">Estimated Shipping</span>
                  <span className="font-medium text-stone-900">Complimentary</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-stone-500">Estimated Tax</span>
                  <span className="font-medium text-stone-900">Included</span>
                </div>

                <div className="pt-4 border-t border-stone-200 flex justify-between items-baseline">
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-950">
                    Total
                  </span>
                  <span className="text-2xl font-headline font-normal text-stone-950">
                    {formatPrice(finalTotal)}
                  </span>
                </div>
              </div>

              {/* Promo Code Input */}
              <form onSubmit={handleApplyPromo} className="pt-2">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1.5">
                  Promo Code
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    placeholder="Try ARCHIVE10"
                    className="flex-1 border border-stone-300 bg-white px-3 py-2 text-xs text-stone-900 outline-none focus:border-stone-950 rounded-md"
                  />
                  <button
                    type="submit"
                    className="bg-stone-950 text-white px-4 py-2 text-xs font-bold uppercase tracking-wider hover:bg-black rounded-md transition-colors"
                  >
                    Apply
                  </button>
                </div>
              </form>

              {/* Checkout CTA */}
              <button
                type="button"
                onClick={() => navigate("/checkout")}
                disabled={items.length === 0}
                className="w-full bg-stone-950 text-white py-4 text-xs font-bold uppercase tracking-[0.2em] hover:bg-black transition-colors rounded-md disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Proceed to Checkout
              </button>

              {/* Trust Badges */}
              <div className="pt-4 border-t border-stone-200 space-y-2.5 text-[10px] uppercase tracking-wider text-stone-500">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">local_shipping</span>
                  <span>Complimentary Shipping over ₹4,999</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">verified</span>
                  <span>100% Authentic Luxury Guarantee</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">published_with_changes</span>
                  <span>14-Day Archival Returns</span>
                </div>
              </div>

            </div>
          </aside>

        </div>

      </main>

      <HomeFooter />
    </div>
  );
}
