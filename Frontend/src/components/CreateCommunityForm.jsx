import { useState } from "react";
import { createCommunity } from "../api/community";

const COMMUNITY_CATEGORIES = [
  "Fashion",
  "Lifestyle",
  "Culture",
  "Art & Design",
  "Collectibles",
  "Other",
];

export default function CreateCommunityModal({ close, refresh }) {
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "Fashion",
    communityImage: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.description.trim()) {
      setError("Please provide a community name and description.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      await createCommunity(form);
      refresh();
      close();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to create community");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center px-4 backdrop-blur-sm">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md border border-stone-300 bg-white p-6 text-stone-900 shadow-2xl rounded-none"
      >
        <h2 className="font-headline text-2xl font-normal text-stone-950 mb-4">
          Create Circle
        </h2>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-none">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500 mb-1">
              Community Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Streetwear Connoisseurs"
              value={form.name}
              className="w-full border border-stone-300 bg-stone-50 p-2.5 text-xs outline-none text-stone-900 focus:border-stone-900"
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500 mb-1">
              Category
            </label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full border border-stone-300 bg-stone-50 p-2.5 text-xs outline-none text-stone-900 focus:border-stone-900"
            >
              {COMMUNITY_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500 mb-1">
              Cover Image URL (Optional)
            </label>
            <input
              type="url"
              placeholder="https://images.unsplash.com/..."
              value={form.communityImage}
              className="w-full border border-stone-300 bg-stone-50 p-2.5 text-xs outline-none text-stone-900 focus:border-stone-900"
              onChange={(e) => setForm({ ...form, communityImage: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500 mb-1">
              Description
            </label>
            <textarea
              required
              rows={3}
              placeholder="What is this circle about?"
              value={form.description}
              className="w-full border border-stone-300 bg-stone-50 p-2.5 text-xs outline-none text-stone-900 focus:border-stone-900"
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3 border-t border-stone-200 pt-4">
          <button
            type="button"
            onClick={close}
            className="border border-stone-300 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-stone-700 hover:bg-stone-100"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={submitting}
            className="bg-stone-950 px-5 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-black disabled:opacity-50"
          >
            {submitting ? "Creating..." : "Create Circle"}
          </button>
        </div>
      </form>
    </div>
  );
}
