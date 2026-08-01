import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCart } from "../api/cart";
import { placeOrder } from "../api/order";
import { API } from "../api/axios";
import { formatPrice } from "../utils/currency";
import HomeNavbar from "../components/home/HomeNavbar";
import HomeFooter from "../components/home/HomeFooter";

const paymentOptions = [
  { value: "CARD", label: "Credit / Debit Card", icon: "credit_card" },
  { value: "UPI", label: "UPI Transfer", icon: "account_balance_wallet" },
  { value: "NET_BANKING", label: "Net Banking", icon: "account_balance" },
  { value: "COD", label: "Cash on Delivery", icon: "local_shipping" },
];

export default function Checkout() {
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CARD");
  const [shippingAddress, setShippingAddress] = useState({
    name: "",
    addressLine: "",
    city: "",
    state: "",
    pincode: "",
    phone: "",
  });
  const [discountCode, setDiscountCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState(null);
  const [discountError, setDiscountError] = useState("");
  const [applyingDiscount, setApplyingDiscount] = useState(false);

  useEffect(() => {
    const loadCart = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await getCart();
        setCart(res.data || { items: [] });
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to load checkout.");
      } finally {
        setLoading(false);
      }
    };

    loadCart();
  }, []);

  const items = cart?.items || [];
  const subtotal = useMemo(
    () =>
      items.reduce(
        (sum, item) => sum + (Number(item.product?.price) || 0) * item.quantity,
        0
      ),
    [items]
  );
  
  const discountAmount = useMemo(() => {
    if (!appliedDiscount) return 0;
    const eligibleSubtotal = items.reduce((sum, item) => {
        const sellerId = typeof item.product?.seller === 'object' ? item.product?.seller?._id : item.product?.seller;
        if (sellerId === appliedDiscount.seller) {
            return sum + (Number(item.product?.price) || 0) * item.quantity;
        }
        return sum;
    }, 0);

    if (eligibleSubtotal === 0) return 0;

    if (appliedDiscount.type === "Percentage") {
      return (eligibleSubtotal * appliedDiscount.value) / 100;
    } else {
      return Math.min(appliedDiscount.value, eligibleSubtotal);
    }
  }, [appliedDiscount, items]);

  const shippingAmount = 0;
  const taxAmount = 0;
  const totalAmount = subtotal - discountAmount + shippingAmount + taxAmount;

  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) return;
    setApplyingDiscount(true);
    setDiscountError("");
    try {
      const res = await API.post("/discounts/apply", { code: discountCode });
      setAppliedDiscount(res.data);
      setDiscountCode("");
    } catch (err) {
      setDiscountError(err?.response?.data?.message || "Invalid discount code");
    } finally {
      setApplyingDiscount(false);
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setShippingAddress((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (items.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        shippingAddress: {
          ...shippingAddress,
          pincode: Number(shippingAddress.pincode),
        },
        paymentMethod,
        discountCode: appliedDiscount?.code || null,
      };

      const res = await placeOrder(payload);
      navigate("/orders", {
        state: {
          orderPlaced: true,
          orderId: res.data?.orderId,
        },
      });
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to place order.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="px-6 py-16 md:px-12">Loading checkout...</div>;
  }

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-stone-900 selection:text-white flex flex-col justify-between">
      <HomeNavbar />
      <main className="flex-1 mx-auto max-w-7xl px-8 pb-24 pt-10 md:px-16 lg:px-24 w-full">
      <div className="mb-16">
        <h1 className="font-headline text-5xl tracking-tight text-stone-950 md:text-6xl">
          Checkout
        </h1>
        <p className="mt-4 text-xs uppercase tracking-widest text-stone-500">
          The Modern Archivist / Order Manifest
        </p>
      </div>

      <div className="grid grid-cols-1 gap-16 lg:grid-cols-12 lg:gap-24">
        <form onSubmit={handleSubmit} className="space-y-20 lg:col-span-7">
          <section>
            <div className="mb-8 flex items-center gap-4">
              <span className="font-label text-xs font-bold uppercase tracking-[0.2em] text-stone-400">
                01
              </span>
              <h2 className="font-headline text-2xl uppercase tracking-wider">
                Shipping Address
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-x-8 gap-y-10 md:grid-cols-2">
              <Field
                className="md:col-span-2"
                label="Full Name"
                name="name"
                value={shippingAddress.name}
                onChange={handleChange}
                placeholder="ALEXANDER VOGUE"
              />
              <Field
                className="md:col-span-2"
                label="Street Address"
                name="addressLine"
                value={shippingAddress.addressLine}
                onChange={handleChange}
                placeholder="124 ARCHIVE WAY, STUDIO 4"
              />
              <Field
                label="City"
                name="city"
                value={shippingAddress.city}
                onChange={handleChange}
                placeholder="NEW YORK"
              />
              <Field
                label="State / Province"
                name="state"
                value={shippingAddress.state}
                onChange={handleChange}
                placeholder="NY"
              />
              <Field
                label="Postal Code"
                name="pincode"
                value={shippingAddress.pincode}
                onChange={handleChange}
                placeholder="10001"
              />
              <Field
                label="Phone Number"
                name="phone"
                value={shippingAddress.phone}
                onChange={handleChange}
                placeholder="+1 212 555 0198"
                type="tel"
              />
            </div>
          </section>

          <section>
            <div className="mb-8 flex items-center gap-4">
              <span className="font-label text-xs font-bold uppercase tracking-[0.2em] text-stone-400">
                02
              </span>
              <h2 className="font-headline text-2xl uppercase tracking-wider">
                Payment Method
              </h2>
            </div>
            <div className="space-y-4">
              {paymentOptions.map((option) => {
                const selected = paymentMethod === option.value;

                return (
                  <label
                    key={option.value}
                    className={`block cursor-pointer border p-6 transition-colors ${
                      selected
                        ? "border-stone-900 bg-stone-50"
                        : "border-stone-200 hover:bg-stone-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={option.value}
                      checked={selected}
                      onChange={() => setPaymentMethod(option.value)}
                      className="sr-only"
                    />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div
                          className={`h-4 w-4 rounded-full border ${
                            selected
                              ? "border-[4px] border-stone-900"
                              : "border-stone-300"
                          }`}
                        />
                        <span
                          className={`text-xs font-bold uppercase tracking-widest ${
                            selected ? "text-stone-950" : "text-stone-400"
                          }`}
                        >
                          {option.label}
                        </span>
                      </div>
                      <span className="material-symbols-outlined text-stone-400">
                        {option.icon}
                      </span>
                    </div>
                    {selected && option.value === "CARD" ? (
                      <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-2">
                        <Field
                          className="md:col-span-2"
                          label="Card Number"
                          name="card_number_preview"
                          value=""
                          onChange={() => {}}
                          placeholder="0000 0000 0000 0000"
                          disabled
                        />
                        <Field
                          label="Expiry Date"
                          name="expiry_preview"
                          value=""
                          onChange={() => {}}
                          placeholder="MM / YY"
                          disabled
                        />
                        <Field
                          label="CVV"
                          name="cvv_preview"
                          value=""
                          onChange={() => {}}
                          placeholder="***"
                          type="password"
                          disabled
                        />
                      </div>
                    ) : null}
                  </label>
                );
              })}
            </div>
          </section>

          {error ? (
            <div className="border border-red-200 bg-red-50 p-4 text-sm text-red-600">
              {error}
            </div>
          ) : null}
        </form>

        <div className="lg:col-span-5">
          <div className="sticky top-32 bg-stone-50 p-8 lg:p-12">
            <h2 className="mb-10 border-b border-stone-200 pb-6 font-headline text-2xl uppercase tracking-wider text-stone-950">
              Order Summary
            </h2>

            <div className="mb-12 space-y-8">
              {items.length === 0 ? (
                <div className="text-sm text-stone-500">
                  Your bag is empty.
                </div>
              ) : (
                items.map((item) => (
                  <div
                    key={`${item.product?._id}-${item.size}`}
                    className="flex gap-6"
                  >
                    <div className="h-32 w-24 overflow-hidden bg-[#F5F4F0]">
                      <img
                        className="h-full w-full object-cover grayscale brightness-95"
                        src={item.product?.images?.[0]}
                        alt={item.product?.productName}
                      />
                    </div>
                    <div className="flex flex-1 flex-col justify-between py-1">
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-widest">
                          {item.product?.productName}
                        </h3>
                        <p className="mt-1 text-[10px] uppercase tracking-wider text-stone-500">
                          {item.product?.brandName} / Size {item.size}
                        </p>
                      </div>
                      <div className="flex items-end justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">
                          Qty: {String(item.quantity).padStart(2, "0")}
                        </span>
                        <span className="font-headline text-sm">
                          {formatPrice(
                            (Number(item.product?.price) || 0) * item.quantity
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mb-6 space-y-3">
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Gift card or discount code"
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value)}
                  className="w-full border border-stone-300 bg-white px-4 py-3 text-sm placeholder:text-stone-400 focus:border-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900 uppercase"
                />
                <button
                  type="button"
                  onClick={handleApplyDiscount}
                  disabled={applyingDiscount || !discountCode.trim()}
                  className="bg-stone-200 px-6 py-3 text-xs font-bold uppercase tracking-widest text-stone-900 transition-colors hover:bg-stone-300 disabled:opacity-50"
                >
                  {applyingDiscount ? "..." : "Apply"}
                </button>
              </div>
              {discountError && (
                <p className="text-xs text-red-600 font-medium">{discountError}</p>
              )}
              {appliedDiscount && (
                <div className="flex items-center justify-between bg-green-50 p-3 border border-green-200 text-sm">
                  <div className="flex items-center gap-2 text-green-800">
                    <span className="material-symbols-outlined text-[18px]">local_offer</span>
                    <span className="font-bold uppercase tracking-wider text-xs">{appliedDiscount.code} applied</span>
                  </div>
                  <button type="button" onClick={() => setAppliedDiscount(null)} className="text-stone-400 hover:text-stone-600">
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                </div>
              )}
            </div>

            <div className="mb-10 space-y-4 border-t border-stone-200 pt-8">
              <SummaryLine label="Subtotal" value={formatPrice(subtotal)} />
              {discountAmount > 0 && (
                 <div className="flex justify-between text-[10px] font-bold uppercase tracking-[0.2em] text-green-600">
                   <span>Discount</span>
                   <span>-{formatPrice(discountAmount)}</span>
                 </div>
              )}
              <SummaryLine
                label="Shipping (Manifest)"
                value={formatPrice(shippingAmount)}
              />
              <SummaryLine
                label="Estimated Tax"
                value={formatPrice(taxAmount)}
              />
              <div className="flex justify-between pt-4 font-headline text-lg text-stone-950">
                <span>Total</span>
                <span>{formatPrice(totalAmount)}</span>
              </div>
            </div>

            <button
              type="submit"
              onClick={handleSubmit}
              disabled={submitting || items.length === 0}
              className="w-full bg-stone-950 py-6 text-xs font-bold uppercase tracking-[0.3em] text-white transition-all hover:bg-black active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Completing..." : "Complete Order"}
            </button>
            <p className="mt-6 text-center text-[10px] uppercase tracking-widest text-stone-400">
              Secure Archive Encryption Enabled
            </p>
          </div>
        </div>
      </div>
    </main>
      <HomeFooter />
    </div>
  );
}

function Field({
  className = "",
  label,
  name,
  value,
  onChange,
  placeholder,
  type = "text",
  disabled = false,
}) {
  return (
    <div className={className}>
      <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-stone-500">
        {label}
      </label>
      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full border-0 border-b border-stone-300 bg-white px-0 py-3 text-sm placeholder:text-stone-400 transition-colors focus:border-stone-900 focus:ring-0 disabled:cursor-not-allowed disabled:opacity-60 text-stone-950"
      />
    </div>
  );
}

function SummaryLine({ label, value }) {
  return (
    <div className="flex justify-between text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

