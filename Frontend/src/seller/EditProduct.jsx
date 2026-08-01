import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { API } from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { SUBCATEGORIES } from "../utils/categories";

export default function EditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [category, setCategory] = useState("men");
  const [subCategory, setSubCategory] = useState("");
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
        if (res.data?.category) setCategory(res.data.category);
        if (res.data?.subCategory) setSubCategory(res.data.subCategory);
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

    try {
      setSaving(true);
      setError("");
      await API.put(`/products/${id}`, { variants: normalizedVariants, category, subCategory });
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
        <div className="border border-stone-200/15 bg-white p-10 text-stone-500">
          Loading product inventory...
        </div>
      </main>
    );
  }

  if (error && !product) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-16 md:px-12">
        <div className="border border-red-600/20 bg-error/5 p-10 text-red-600">
          {error}
        </div>
      </main>
    );
  }

  if (!canEdit) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-16 md:px-12">
        <div className="border border-stone-200/15 bg-white p-10 text-center">
          <h1 className="font-headline text-3xl text-stone-950">
            You cannot edit this inventory
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-stone-500">
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
          <span className="mb-4 block text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500">
            Inventory Editor
          </span>
          <h1 className="font-headline text-4xl tracking-tighter text-stone-950 md:text-5xl">
            {product.productName}
          </h1>
          <p className="mt-3 text-sm uppercase tracking-[0.2em] text-stone-500">
            {product.brandName}
          </p>
        </div>
        <Link
          to="/seller"
          className="border border-stone-300 px-6 py-3 text-[11px] font-bold uppercase tracking-widest text-stone-900 transition-colors hover:bg-stone-100"
        >
          Back to Dashboard
        </Link>
      </header>

      <div className="mb-10 grid gap-8 border border-stone-200/15 bg-white p-6 md:grid-cols-[180px_minmax(0,1fr)] md:p-8">
        <div className="overflow-hidden bg-stone-200">
          {product.images?.[0] ? (
            <img
              src={product.images[0]}
              alt={product.productName}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full min-h-44 items-center justify-center text-stone-500">
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
        className="border border-stone-200/15 bg-white p-6 md:p-8"
      >
        <div className="mb-6">
          <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500">
            Product Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full border border-stone-200/30 bg-stone-50 p-3 text-sm text-stone-950 outline-none focus:border-stone-900"
          >
            <option value="women">Women</option>
            <option value="men">Men</option>
            <option value="footwear">Footwear</option>
            <option value="bags">Bags</option>
            <option value="perfumes">Perfumes</option>
            <option value="accessories">Accessories</option>
            <option value="home & lifestyle">Home & Lifestyle</option>
          </select>
        </div>

        <div className="mb-6">
          <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500">
            Product Subcategory
          </label>
          <select
            value={subCategory}
            onChange={(e) => setSubCategory(e.target.value)}
            className="w-full border border-stone-200/30 bg-stone-50 p-3 text-sm text-stone-950 outline-none focus:border-stone-900"
          >
            <option value="">Select Subcategory</option>
            {SUBCATEGORIES.map((cat) => (
              <option key={cat} value={cat.toLowerCase()}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-headline text-2xl text-stone-950">
              Variant Stock
            </h2>
            <p className="mt-2 text-sm text-stone-500">
              Update stock for each size variant and save the inventory.
            </p>
          </div>
          <button
            type="button"
            onClick={addVariant}
            className="border border-stone-300 px-5 py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-stone-900 transition-colors hover:bg-stone-100"
          >
            Add Variant
          </button>
        </div>

        <div className="space-y-4">
          {variants.map((variant, index) => (
            <div
              key={`${variant.size}-${index}`}
              className="grid gap-4 border border-stone-200/15 bg-surface p-4 md:grid-cols-[minmax(0,1fr)_180px_120px]"
            >
              <div>
                <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500">
                  Size
                </label>
                <input
                  value={variant.size}
                  onChange={(event) =>
                    updateVariant(index, "size", event.target.value)
                  }
                  className="w-full border-0 border-b border-stone-300 bg-stone-50 px-0 py-3 text-sm focus:border-stone-900 focus:ring-0"
                  placeholder="M"
                />
              </div>
              <div>
                <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500">
                  Stock
                </label>
                <input
                  type="number"
                  min="0"
                  value={variant.stock}
                  onChange={(event) =>
                    updateVariant(index, "stock", event.target.value)
                  }
                  className="w-full border-0 border-b border-stone-300 bg-stone-50 px-0 py-3 text-sm focus:border-stone-900 focus:ring-0"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => removeVariant(index)}
                  className="w-full border border-stone-300 px-4 py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-stone-900 transition-colors hover:border-red-600 hover:text-red-600"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        {error ? (
          <div className="mt-6 border border-red-600/20 bg-error/5 p-4 text-sm text-red-600">
            {error}
          </div>
        ) : null}

        <div className="mt-8 flex flex-wrap gap-4">
          <button
            type="submit"
            disabled={saving}
            className="bg-stone-950 px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-white transition-colors hover:bg-stone-950-dim disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Inventory"}
          </button>
          <Link
            to="/seller"
            className="border border-stone-300 px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-stone-900 transition-colors hover:bg-stone-100"
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
    <div className="border border-stone-200/15 bg-surface p-5">
      <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500">
        {label}
      </span>
      <p className="mt-3 font-headline text-2xl text-stone-950">{value}</p>
    </div>
  );
}

