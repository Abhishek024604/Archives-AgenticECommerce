import { useState } from "react";
import { API } from "../api/axios";
import { SUBCATEGORIES } from "../utils/categories";

export default function AddProduct() {
  const [form, setForm] = useState({ brandName: "", productName: "", category: "men", subCategory: "", price: "", discount: 0 });
  const [images, setImages] = useState([""]);
  const [variants, setVariants] = useState([{ size: "", stock: 10 }]);

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
    <form onSubmit={submit} className="max-w-2xl space-y-4 p-6 text-stone-950">
      <h1 className="text-2xl font-semibold">Add Product</h1>
      <input name="brandName" placeholder="Brand" className="w-full border border-stone-200/30 bg-stone-50 p-3 outline-none placeholder:text-stone-500 focus:border-stone-900" onChange={update} />
      <input name="productName" placeholder="Product Name" className="w-full border border-stone-200/30 bg-stone-50 p-3 outline-none placeholder:text-stone-500 focus:border-stone-900" onChange={update} />
      <select name="category" value={form.category} onChange={update} className="w-full border border-stone-200/30 bg-stone-50 p-3 outline-none focus:border-stone-900">
        <option value="women">Women</option>
        <option value="men">Men</option>
        <option value="footwear">Footwear</option>
        <option value="bags">Bags</option>
        <option value="perfumes">Perfumes</option>
        <option value="accessories">Accessories</option>
        <option value="home & lifestyle">Home & Lifestyle</option>
      </select>
      <select name="subCategory" value={form.subCategory} onChange={update} className="w-full border border-stone-200/30 bg-stone-50 p-3 outline-none focus:border-stone-900">
        <option value="">Select Subcategory</option>
        {SUBCATEGORIES.map((cat) => (
          <option key={cat} value={cat.toLowerCase()}>{cat}</option>
        ))}
      </select>
      <input name="price" placeholder="Price" className="w-full border border-stone-200/30 bg-stone-50 p-3 outline-none placeholder:text-stone-500 focus:border-stone-900" onChange={update} />
      <input name="discount" placeholder="Discount %" className="w-full border border-stone-200/30 bg-stone-50 p-3 outline-none placeholder:text-stone-500 focus:border-stone-900" onChange={update} />

      <div>
        <div className="font-medium mb-1">Images</div>
        {images.map((img, i) => (
          <input key={i} value={img} onChange={(e) => setImage(i, e.target.value)} placeholder="Image URL" className="mb-2 w-full border border-stone-200/30 bg-stone-50 p-3 outline-none placeholder:text-stone-500 focus:border-stone-900" />
        ))}
        <button type="button" onClick={addImage} className="border border-stone-300 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.18em]">+ Add Image</button>
      </div>

      <div>
        <div className="font-medium mb-1">Variants</div>
        {variants.map((v, i) => (
          <div key={i} className="flex gap-2 mb-2">
            <input value={v.size} onChange={(e) => setVariant(i, "size", e.target.value)} placeholder="Size" className="flex-1 border border-stone-200/30 bg-stone-50 p-3 outline-none placeholder:text-stone-500 focus:border-stone-900" />
            <input type="number" value={v.stock} onChange={(e) => setVariant(i, "stock", Number(e.target.value))} placeholder="Stock" className="w-32 border border-stone-200/30 bg-stone-50 p-3 outline-none placeholder:text-stone-500 focus:border-stone-900" />
          </div>
        ))}
        <button type="button" onClick={addVariant} className="border border-stone-300 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.18em]">+ Add Variant</button>
      </div>

      <button className="bg-stone-950 px-5 py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white">Create</button>
    </form>
  );
}

