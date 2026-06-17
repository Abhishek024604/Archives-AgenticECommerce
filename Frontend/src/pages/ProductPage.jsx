import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { API } from "../api/axios";
import { addToCart } from "../api/cart";
import { formatPrice } from "../utils/currency";

export default function ProductPage() {
  const { id } = useParams();
  const [p, setP] = useState(null);
  const [size, setSize] = useState("");
  const [qty, setQty] = useState(1);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await API.get(`/products/${id}`);
        setP(res.data);
        setSize(res.data?.variants?.[0]?.size || "");
      } catch (e) {
        setError(e?.response?.data?.message || "Failed to load product");
      }
    })();
  }, [id]);

  const onAdd = async () => {
    try {
      await addToCart({ productId: p._id, quantity: qty, size });
      alert("Added to cart");
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to add to cart");
    }
  };

  if (error) return <div className="p-6 text-error">{error}</div>;
  if (!p) return <div className="p-6">Loading...</div>;

  return (
    <main className="bg-surface px-0 py-10 md:px-15">
      <div className="page-gutter grid max-w-7xl grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-15">
        <section className="lg:col-span-5">
          <div className="space-y-4">

            {/* Large Image */}
            <div className="overflow-hidden bg-surface-container-lowest">
              <img
                src={p.images?.[0]}
                alt={p.productName}
                className="aspect-[4/5] w-full object-cover object-top"
              />
            </div>

            {/* Small Images Below */}
            {p.images?.length > 1 && (
              <div className="grid grid-cols-2 gap-4">
                {p.images.slice(1, 3).map((img, i) => (
                  <div key={img} className="overflow-hidden bg-surface-container-low">
                    <img
                      src={img}
                      alt={`${p.productName} ${i + 2}`}
                      className="aspect-square w-full object-cover object-top"
                    />
                  </div>
                ))}
              </div>
            )}

          </div>
        </section>

        <section className="lg:col-span-6">
          <div className="flex flex-col lg:sticky lg:top-28">
            <div className="mb-2 border-b border-outline-variant/15 pb-8">
              <span className="mb-3 block text-[10px] font-bold uppercase tracking-[0.24em] text-on-surface-variant">
                Core Collection
              </span>
              <h1 className="font-headline text-4xl leading-tight tracking-tight text-on-background md:text-5xl">
                {p.productName}
              </h1>
              <p className="mt-4 text-2xl text-primary">
                {formatPrice(p.price)}
              </p>
            </div>

            <div className="mb-9 max-w-md space-y-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface">
                {p.brandName}
              </p>
              <p className="text-sm leading-6 text-on-surface-variant">
                Curated by our atelier with care for longevity.
              </p>
            </div>

            <div className="mb-9">
              <div className="mb-3 flex items-end justify-between">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface">
                  Select Size
                </label>
                <a
                  className="hidden text-[10px] font-bold uppercase tracking-[0.2em] text-outline underline underline-offset-4 sm:inline"
                  href="#"
                >
                  Size Guide
                </a>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {p.variants?.map((v) => (
                  <button
                    key={v.size}
                    onClick={() => setSize(v.size)}
                    className={`border py-3 text-xs transition-colors ${size === v.size
                        ? "border-primary bg-surface-container-low"
                        : "border-outline-variant/30 hover:border-primary"
                      }`}
                  >
                    {v.size}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-12 items-center gap-3 border border-outline px-3">
                <button
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="px-1 hover:text-primary"
                >
                  -
                </button>
                <span className="w-6 text-center">{qty}</span>
                <button
                  onClick={() => setQty(qty + 1)}
                  className="px-1 hover:text-primary"
                >
                  +
                </button>
              </div>
              <button
                onClick={onAdd}
                className="flex-1 bg-primary py-4 text-[11px] font-bold uppercase tracking-[0.24em] text-on-primary transition-all hover:bg-primary-dim active:scale-[0.98]"
              >
                Add to Bag
              </button>
            </div>

            <ProductDetail title="Shipping & Returns">
              Complimentary express shipping over {formatPrice(5000)}. Returns
              within 14 days.
            </ProductDetail>
            <ProductDetail title="Details & Composition">
              Premium materials. Restored and quality-checked by our atelier.
            </ProductDetail>
          </div>
        </section>

        <section className="space-y-5 lg:col-span-5">

          <div className="mx-auto max-w-2xl py-6 text-center md:py-12">
            <h3 className="font-headline text-2xl italic leading-relaxed text-secondary md:text-3xl">
              "Timeless construction, restored with archival care."
            </h3>
          </div>
        </section>
      </div>
    </main>
  );
}

function ProductDetail({ title, children }) {
  return (
    <div className="border-t border-outline-variant/15 py-5">
      <details className="group">
        <summary className="flex cursor-pointer list-none items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface">
            {title}
          </span>
          <span className="material-symbols-outlined text-sm transition-transform group-open:rotate-180">
            expand_more
          </span>
        </summary>
        <div className="pt-4 text-xs leading-relaxed text-on-surface-variant">
          <p>{children}</p>
        </div>
      </details>
    </div>
  );
}
