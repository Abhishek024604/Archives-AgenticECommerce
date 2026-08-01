import { useRef, useState } from "react";

const initialForm = {
  title: "",
  subtitle: "",
  excerpt: "",
  category: "Editorial",
  theme: "Design & Craft",
  coverImageData: "",
  tags: "",
  content: "",
  contentFormat: "html",
};

const commands = [
  { label: "B", title: "Bold", command: "bold" },
  { label: "I", title: "Italic", command: "italic" },
  { label: "U", title: "Underline", command: "underline" },
  { label: "H2", title: "Heading", command: "formatBlock", value: "h2" },
  { label: "Q", title: "Quote", command: "formatBlock", value: "blockquote" },
  { label: "List", title: "Bulleted list", command: "insertUnorderedList" },
];

const readFileAsDataUrl = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export default function BlogEditor({ onSubmit, onCancel, saving, error }) {
  const editorRef = useRef(null);
  const fileInputRef = useRef(null);
  const [form, setForm] = useState(initialForm);
  const [imagePreview, setImagePreview] = useState("");
  const [localError, setLocalError] = useState("");
  const [editorText, setEditorText] = useState("");

  const wordCount = editorText.trim().split(/\s+/).filter(Boolean).length;
  const readTime = Math.max(1, Math.ceil(wordCount / 220));

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const runCommand = (command, value = null) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    const html = editorRef.current?.innerHTML || "";
    const text = editorRef.current?.innerText || "";

    setEditorText(text);
    setForm((current) => ({
      ...current,
      content: html,
    }));
  };

  const handleEditorInput = () => {
    const html = editorRef.current?.innerHTML || "";
    const text = editorRef.current?.innerText || "";

    setEditorText(text);
    setForm((current) => ({
      ...current,
      content: html,
    }));
  };

  const handleCoverImage = async (event) => {
    const file = event.target.files?.[0];
    setLocalError("");

    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
      setLocalError("Use a JPG, PNG, WEBP, or GIF cover image.");
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      setLocalError("Cover image must be 4MB or smaller.");
      return;
    }

    const dataUrl = await readFileAsDataUrl(file);
    setImagePreview(dataUrl);
    setForm((current) => ({ ...current, coverImageData: dataUrl }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setLocalError("");

    if (!editorRef.current?.innerText.trim()) {
      setLocalError("Write the story before publishing.");
      return;
    }

    await onSubmit({
      ...form,
      content: editorRef.current.innerHTML,
      tags: form.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    });
  };

  return (
    <section className="mb-16 bg-white shadow-[0_24px_48px_rgba(47,52,48,0.08)]">
      <form onSubmit={submit} className="grid grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="bg-stone-50 p-6 md:p-8">
          <div className="mb-10">
            <h2 className="font-headline text-xl font-bold uppercase tracking-[0.08em] text-stone-950">
              The Archivist
            </h2>
            <p className="mt-1 font-label text-[10px] uppercase tracking-[0.18em] text-stone-500">
              Editor Mode
            </p>
          </div>

          <div className="space-y-5">
            <button
              type="button"
              className="flex items-center gap-3 font-label text-[10px] font-bold uppercase tracking-[0.16em] text-stone-950"
            >
              <span className="material-symbols-outlined text-base">edit_note</span>
              Draft
            </button>
            <button
              type="button"
              className="flex items-center gap-3 font-label text-[10px] uppercase tracking-[0.16em] text-stone-500"
            >
              <span className="material-symbols-outlined text-base">image</span>
              Assets
            </button>
          </div>

          <div className="mt-14 space-y-5 font-label text-[10px] uppercase tracking-[0.14em] text-stone-500">
            <div>
              <p>Status</p>
              <p className="mt-1 font-bold text-stone-950">Unsaved</p>
            </div>
            <div>
              <p>Word Count</p>
              <p className="mt-1 font-bold text-stone-950">{wordCount} Words</p>
            </div>
            <div>
              <p>Read Time</p>
              <p className="mt-1 font-bold text-stone-950">{readTime} Minutes</p>
            </div>
          </div>
        </aside>

        <div className="px-6 py-8 md:px-12 md:py-12">
          <div className="mb-10 flex flex-wrap items-center justify-end gap-5">
            <button
              type="button"
              onClick={onCancel}
              className="font-label text-[10px] uppercase tracking-[0.2em] text-stone-500 transition-colors hover:text-stone-950"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-stone-950 px-8 py-3 font-label text-[10px] font-bold uppercase tracking-[0.2em] text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Publishing..." : "Publish"}
            </button>
          </div>

          <textarea
            name="title"
            value={form.title}
            onChange={updateField}
            placeholder="Blog Title"
            rows="1"
            className="mb-8 w-full resize-none overflow-hidden bg-transparent font-headline text-5xl font-bold leading-none tracking-tight text-stone-950 outline-none placeholder:text-stone-400/50 md:text-7xl"
          />

          <div className="mb-8 grid gap-5 md:grid-cols-3">
            <input
              name="subtitle"
              value={form.subtitle}
              onChange={updateField}
              placeholder="Subtitle"
              className="w-full bg-stone-50 p-4 text-sm outline-none border-b border-stone-300 focus:border-stone-900"
            />
            <input
              name="category"
              value={form.category}
              onChange={updateField}
              placeholder="Category"
              className="w-full bg-stone-50 p-4 text-sm outline-none border-b border-stone-300 focus:border-stone-900"
            />
            <select
              name="theme"
              value={form.theme}
              onChange={updateField}
              className="w-full bg-stone-50 p-4 text-sm outline-none border-b border-stone-300 focus:border-stone-900"
            >
              <option value="Sustainability">Theme: Sustainability</option>
              <option value="Design & Craft">Theme: Design & Craft</option>
              <option value="Watches">Theme: Watches</option>
              <option value="Fragrance">Theme: Fragrance</option>
              <option value="Horology & Tailoring">Theme: Horology & Tailoring</option>
              <option value="Culture & Heritage">Theme: Culture & Heritage</option>
              <option value="Quiet Luxury">Theme: Quiet Luxury</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="group mb-8 flex aspect-[21/9] w-full flex-col items-center justify-center overflow-hidden bg-stone-50 transition-colors hover:bg-stone-200"
          >
            {imagePreview ? (
              <img
                src={imagePreview}
                alt="Selected cover preview"
                className="h-full w-full object-cover grayscale transition-all duration-700 group-hover:grayscale-0"
              />
            ) : (
              <>
                <span className="material-symbols-outlined text-4xl text-stone-400 transition-colors group-hover:text-primary">
                  add
                </span>
                <span className="mt-4 font-label text-[10px] uppercase tracking-[0.2em] text-stone-400 transition-colors group-hover:text-primary">
                  Add Cover Image
                </span>
              </>
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={handleCoverImage}
            className="hidden"
          />

          <div className="mb-5 flex flex-wrap gap-2 bg-stone-50 p-2">
            {commands.map((item) => (
              <button
                key={`${item.command}-${item.label}`}
                type="button"
                title={item.title}
                onClick={() => runCommand(item.command, item.value)}
                className="min-w-10 px-3 py-2 font-label text-[10px] font-bold uppercase tracking-[0.12em] text-stone-500 transition-colors hover:bg-white hover:text-stone-950"
              >
                {item.label}
              </button>
            ))}
            <button
              type="button"
              title="Remove formatting"
              onClick={() => runCommand("removeFormat")}
              className="ml-auto px-3 py-2 font-label text-[10px] font-bold uppercase tracking-[0.12em] text-stone-500 transition-colors hover:bg-white hover:text-stone-950"
            >
              Clear
            </button>
          </div>

          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={handleEditorInput}
            className="blog-editor min-h-[460px] w-full bg-transparent text-lg leading-8 text-stone-900 outline-none empty:before:text-stone-400 empty:before:content-[attr(data-placeholder)] md:text-xl"
            data-placeholder="Write your story..."
          />

          <div className="mt-8 grid gap-5 md:grid-cols-2">
            <textarea
              name="excerpt"
              value={form.excerpt}
              onChange={updateField}
              placeholder="Short excerpt"
              rows="4"
              className="w-full resize-none bg-stone-50 p-4 text-sm outline-none border-b border-stone-300 focus:border-stone-900"
            />
            <input
              name="tags"
              value={form.tags}
              onChange={updateField}
              placeholder="Tags, comma separated"
              className="h-fit w-full bg-stone-50 p-4 text-sm outline-none border-b border-stone-300 focus:border-stone-900"
            />
          </div>

          {localError || error ? (
            <p className="mt-6 text-sm text-red-600">{localError || error}</p>
          ) : null}
        </div>
      </form>
    </section>
  );
}

