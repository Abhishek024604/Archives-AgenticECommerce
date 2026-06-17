import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { API } from "../api/axios";
import { useAuth } from "../context/AuthContext";

export default function EditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await API.get(`/products/${id}`);
        setProduct(res.data);
        setVariants(
          (res.data?.variants || []).map((variant) => ({
            size: variant.size || "",
            stock: Number(variant.stock) || 0,
          }))
        );
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to load product");
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [id]);

  const updateVariant = (index, key, value) => {
    setVariants((current) =>
      current.map((variant, variantIndex) =>
        variantIndex === index ? { ...variant, [key]: value } : variant
      )
    );
  };

  const addVariant = () => {
    setVariants((current) => [...current, { size: "", stock: 0 }]);
  };

  const removeVariant = (index) => {
    setVariants((current) =>
      current.filter((_, variantIndex) => variantIndex !== index)
    );
  };

  const submit = async (event) => {
    event.preventDefault();

    const normalizedVariants = variants.map((variant) => ({
      size: variant.size.trim(),
      stock: Number(variant.stock) || 0,
    }));

    if (normalizedVariants.some((variant) => !variant.size)) {
      setError("Every variant must have a size.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      await API.put(`/products/${id}`, { variants: normalizedVariants });
      navigate("/seller");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update inventory");
    } finally {
      setSaving(false);
    }
  };

  const sellerId =
    typeof product?.seller === "string" ? product.seller : product?.seller?._id;
  const canEdit = user?.role === "seller" && sellerId === user?._id;
  const formatPrice = (value) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value || 0);

  if (loading) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-16 md:px-12">
        <div className="border border-outline-variant/15 bg-surface-container-lowest p-10 text-on-surface-variant">
          Loading product inventory...
        </div>
      </main>
    );
  }

  if (error && !product) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-16 md:px-12">
        <div className="border border-error/20 bg-error/5 p-10 text-error">
          {error}
        </div>
      </main>
    );
  }

  if (!canEdit) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-16 md:px-12">
        <div className="border border-outline-variant/15 bg-surface-container-lowest p-10 text-center">
          <h1 className="font-headline text-3xl text-on-background">
            You cannot edit this inventory
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-on-surface-variant">
            Only the seller who owns this product can update its stock.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-12 md:px-12">
      <header className="mb-12 flex flex-wrap items-end justify-between gap-6">
        <div>
          <span className="mb-4 block text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">
            Inventory Editor
          </span>
          <h1 className="font-headline text-4xl tracking-tighter text-on-background md:text-5xl">
            {product.productName}
          </h1>
          <p className="mt-3 text-sm uppercase tracking-[0.2em] text-on-surface-variant">
            {product.brandName}
          </p>
        </div>
        <Link
          to="/seller"
          className="border border-outline px-6 py-3 text-[11px] font-bold uppercase tracking-widest text-on-surface transition-colors hover:bg-surface-container-high"
        >
          Back to Dashboard
        </Link>
      </header>

      <div className="mb-10 grid gap-8 border border-outline-variant/15 bg-surface-container-lowest p-6 md:grid-cols-[180px_minmax(0,1fr)] md:p-8">
        <div className="overflow-hidden bg-surface-container">
          {product.images?.[0] ? (
            <img
              src={product.images[0]}
              alt={product.productName}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full min-h-44 items-center justify-center text-on-surface-variant">
              <span className="material-symbols-outlined">image</span>
            </div>
          )}
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <SummaryCard label="Price" value={formatPrice(product.price)} />
          <SummaryCard label="Discount" value={`${product.discount || 0}%`} />
          <SummaryCard
            label="Total Units"
            value={String(
              variants.reduce(
                (sum, variant) => sum + (Number(variant.stock) || 0),
                0
              )
            )}
          />
        </div>
      </div>

      <form
        onSubmit={submit}
        className="border border-outline-variant/15 bg-surface-container-lowest p-6 md:p-8"
      >
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-headline text-2xl text-on-background">
              Variant Stock
            </h2>
            <p className="mt-2 text-sm text-on-surface-variant">
              Update stock for each size variant and save the inventory.
            </p>
          </div>
          <button
            type="button"
            onClick={addVariant}
            className="border border-outline px-5 py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface transition-colors hover:bg-surface-container-high"
          >
            Add Variant
          </button>
        </div>

        <div className="space-y-4">
          {variants.map((variant, index) => (
            <div
              key={`${variant.size}-${index}`}
              className="grid gap-4 border border-outline-variant/15 bg-surface p-4 md:grid-cols-[minmax(0,1fr)_180px_120px]"
            >
              <div>
                <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">
                  Size
                </label>
                <input
                  value={variant.size}
                  onChange={(event) =>
                    updateVariant(index, "size", event.target.value)
                  }
                  className="w-full border-0 border-b border-outline bg-surface-container-low px-0 py-3 text-sm focus:border-primary focus:ring-0"
                  placeholder="M"
                />
              </div>
              <div>
                <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">
                  Stock
                </label>
                <input
                  type="number"
                  min="0"
                  value={variant.stock}
                  onChange={(event) =>
                    updateVariant(index, "stock", event.target.value)
                  }
                  className="w-full border-0 border-b border-outline bg-surface-container-low px-0 py-3 text-sm focus:border-primary focus:ring-0"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => removeVariant(index)}
                  className="w-full border border-outline px-4 py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface transition-colors hover:border-error hover:text-error"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        {error ? (
          <div className="mt-6 border border-error/20 bg-error/5 p-4 text-sm text-error">
            {error}
          </div>
        ) : null}

        <div className="mt-8 flex flex-wrap gap-4">
          <button
            type="submit"
            disabled={saving}
            className="bg-primary px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-on-primary transition-colors hover:bg-primary-dim disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Inventory"}
          </button>
          <Link
            to="/seller"
            className="border border-outline px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-on-surface transition-colors hover:bg-surface-container-high"
          >
            Cancel
          </Link>
        </div>
      </form>
    </main>
  );
}

function SummaryCard({ label, value }) {
  return (
    <div className="border border-outline-variant/15 bg-surface p-5">
      <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">
        {label}
      </span>
      <p className="mt-3 font-headline text-2xl text-on-background">{value}</p>
    </div>
  );
}
