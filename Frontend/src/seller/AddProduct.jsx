import { useState } from "react";
import { API } from "../api/axios";

export default function AddProduct() {
  const [form, setForm] = useState({ brandName: "", productName: "", price: "", discount: 0 });
  const [images, setImages] = useState([""]);
  const [variants, setVariants] = useState([{ size: "M", stock: 10 }]);

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const addImage = () => setImages([...images, ""]);
  const setImage = (i, v) => setImages(images.map((x, idx) => (idx === i ? v : x)));
  const addVariant = () => setVariants([...variants, { size: "", stock: 0 }]);
  const setVariant = (i, key, v) => setVariants(variants.map((x, idx) => (idx === i ? { ...x, [key]: v } : x)));

  const submit = async (e) => {
    e.preventDefault();
    const payload = { ...form, price: Number(form.price), discount: Number(form.discount), images, variants };
    try {
      await API.post("/products", payload);
      alert("Product created");
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to create product");
    }
  };

  return (
    <form onSubmit={submit} className="max-w-2xl space-y-4 p-6 text-on-background">
      <h1 className="text-2xl font-semibold">Add Product</h1>
      <input name="brandName" placeholder="Brand" className="w-full border border-outline-variant/30 bg-surface-container-low p-3 outline-none placeholder:text-on-surface-variant focus:border-primary" onChange={update} />
      <input name="productName" placeholder="Product Name" className="w-full border border-outline-variant/30 bg-surface-container-low p-3 outline-none placeholder:text-on-surface-variant focus:border-primary" onChange={update} />
      <input name="price" placeholder="Price" className="w-full border border-outline-variant/30 bg-surface-container-low p-3 outline-none placeholder:text-on-surface-variant focus:border-primary" onChange={update} />
      <input name="discount" placeholder="Discount %" className="w-full border border-outline-variant/30 bg-surface-container-low p-3 outline-none placeholder:text-on-surface-variant focus:border-primary" onChange={update} />

      <div>
        <div className="font-medium mb-1">Images</div>
        {images.map((img, i) => (
          <input key={i} value={img} onChange={(e) => setImage(i, e.target.value)} placeholder="Image URL" className="mb-2 w-full border border-outline-variant/30 bg-surface-container-low p-3 outline-none placeholder:text-on-surface-variant focus:border-primary" />
        ))}
        <button type="button" onClick={addImage} className="border border-outline px-3 py-2 text-[10px] font-bold uppercase tracking-[0.18em]">+ Add Image</button>
      </div>

      <div>
        <div className="font-medium mb-1">Variants</div>
        {variants.map((v, i) => (
          <div key={i} className="flex gap-2 mb-2">
            <input value={v.size} onChange={(e) => setVariant(i, "size", e.target.value)} placeholder="Size" className="flex-1 border border-outline-variant/30 bg-surface-container-low p-3 outline-none placeholder:text-on-surface-variant focus:border-primary" />
            <input type="number" value={v.stock} onChange={(e) => setVariant(i, "stock", Number(e.target.value))} placeholder="Stock" className="w-32 border border-outline-variant/30 bg-surface-container-low p-3 outline-none placeholder:text-on-surface-variant focus:border-primary" />
          </div>
        ))}
        <button type="button" onClick={addVariant} className="border border-outline px-3 py-2 text-[10px] font-bold uppercase tracking-[0.18em]">+ Add Variant</button>
      </div>

      <button className="bg-primary px-5 py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-on-primary">Create</button>
    </form>
  );
}
