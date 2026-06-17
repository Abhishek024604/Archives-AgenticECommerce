import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { createBlog, deleteBlog, getBlogs } from "../api/blog";
import BlogEditor from "../components/BlogEditor";
import { useAuth } from "../context/AuthContext";
import { resolveMediaUrl } from "../utils/media";

const fallbackHero = {
  title: "The Architecture of Silence",
  subtitle: "An exploration of negative space in architectural minimalism.",
  coverImage:
    "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1600&q=80",
  category: "Current Feature",
};

const formatDate = (value) => {
  if (!value) return "Undated";

  return new Intl.DateTimeFormat("en", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
};

export default function Archives() {
  const { user } = useAuth();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const isSeller = user?.role === "seller";

  const featured = blogs[0];
  const hero = featured || fallbackHero;
  const gridBlogs = blogs.slice(0, 3);
  const collectionBlogs = blogs.slice(3, 6);

  const featuredStore = useMemo(() => {
    const sellerInfo = featured?.author?.sellerInfo;
    return sellerInfo?.storeName || featured?.author?.name || "Archivist";
  }, [featured]);

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      setError("");
      const res = await getBlogs();
      setBlogs(res.data.blogs || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load journal");
    } finally {
      setLoading(false);
    }
  };

  const submitBlog = async (payload) => {
    setSaving(true);
    setFormError("");

    try {
      await createBlog(payload);
      setShowForm(false);
      await fetchBlogs();
    } catch (err) {
      setFormError(err?.response?.data?.message || "Failed to publish blog");
    } finally {
      setSaving(false);
    }
  };

  const removeBlog = async (blogId) => {
    const confirmed = window.confirm("Delete this blog from the archive?");

    if (!confirmed) return;

    await deleteBlog(blogId);
    await fetchBlogs();
  };

  return (
    <div className="bg-surface text-on-background font-body antialiased">
      <main className="mx-auto max-w-[1440px] px-6 pb-28 pt-8 md:px-12">
        {isSeller ? (
          <section className="mb-10 bg-surface-container-low px-6 py-5 md:flex md:items-center md:justify-between">
            <div>
              <p className="font-label text-[10px] font-bold uppercase tracking-[0.24em] text-on-surface-variant">
                Seller Editorial Desk
              </p>
              <h1 className="mt-2 font-headline text-2xl text-on-background">
                Publish to the Journal
              </h1>
            </div>
            <button
              type="button"
              onClick={() => setShowForm((open) => !open)}
              className="mt-5 bg-primary px-6 py-3 font-label text-[10px] font-bold uppercase tracking-[0.2em] text-on-primary transition-opacity hover:opacity-90 md:mt-0"
            >
              {showForm ? "Close Editor" : "New Blog"}
            </button>
          </section>
        ) : null}

        {showForm && isSeller ? (
          <BlogEditor
            onSubmit={submitBlog}
            onCancel={() => setShowForm(false)}
            saving={saving}
            error={formError}
          />
        ) : null}

        <section className="relative mb-28 min-h-[520px] overflow-hidden bg-surface-container-low">
          <img
            src={resolveMediaUrl(hero.coverImage)}
            alt={hero.title}
            className="absolute inset-0 h-full w-full object-cover grayscale"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-background/35 to-transparent" />
          <div className="relative z-10 flex min-h-[520px] max-w-2xl flex-col justify-center px-8 py-16 md:px-14">
            <p className="font-label text-[10px] font-bold uppercase tracking-[0.28em] text-on-surface-variant">
              {hero.category || "Current Feature"}
            </p>
            <h2 className="mt-5 font-headline text-5xl leading-none tracking-tight text-on-background md:text-7xl">
              {hero.title}
            </h2>
            <p className="mt-7 max-w-sm text-sm leading-6 text-on-surface-variant">
              {hero.subtitle || hero.excerpt}
            </p>
            {featured ? (
              <Link
                to={`/archives/${featured.slug}`}
                className="mt-8 inline-flex w-fit bg-primary px-7 py-3 font-label text-[10px] font-bold uppercase tracking-[0.2em] text-on-primary"
              >
                Read Article
              </Link>
            ) : null}
          </div>
        </section>

        <section className="mb-28 text-center">
          <p className="mx-auto max-w-4xl px-4 font-headline text-3xl italic leading-tight text-secondary md:text-5xl">
            "Fashion is not a mirror of the present; it is a meticulously curated
            dialogue with the ghosts of our sartorial past."
          </p>
          <div className="mx-auto mt-10 h-12 w-px bg-outline-variant/40" />
        </section>

        {loading ? (
          <div className="py-24 text-center text-on-surface-variant">
            Loading journal...
          </div>
        ) : error ? (
          <div className="py-24 text-center text-error">{error}</div>
        ) : gridBlogs.length > 0 ? (
          <section className="mb-32 grid grid-cols-1 gap-y-20 md:grid-cols-12 md:gap-x-12">
            {gridBlogs.map((blog, index) => {
              const large = index === 0;
              const canDelete = isSeller && blog.author?._id === user?._id;

              return (
                <article
                  key={blog._id}
                  className={large ? "md:col-span-7" : "md:col-span-5"}
                >
                  <Link to={`/archives/${blog.slug}`} className="group block">
                    <div className={large ? "aspect-[4/3] overflow-hidden bg-surface-container-low" : "aspect-[4/3] overflow-hidden bg-surface-container-low"}>
                      <img
                        src={resolveMediaUrl(blog.coverImage)}
                        alt={blog.title}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    </div>
                    <div className="mt-6 flex items-center justify-between gap-6">
                      <p className="font-label text-[9px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">
                        {formatDate(blog.createdAt)}
                      </p>
                      <p className="font-label text-[9px] font-bold uppercase tracking-[0.2em] text-outline">
                        {blog.readTimeMinutes} min
                      </p>
                    </div>
                    <h3 className="mt-3 font-headline text-3xl text-on-background">
                      {blog.title}
                    </h3>
                    <p className="mt-3 max-w-xl text-sm leading-6 text-on-surface-variant">
                      {blog.excerpt}
                    </p>
                    <p className="mt-5 font-label text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                      By {blog.author?.sellerInfo?.storeName || blog.author?.name || "Seller"}
                    </p>
                  </Link>
                  {canDelete ? (
                    <button
                      type="button"
                      onClick={() => removeBlog(blog._id)}
                      className="mt-4 font-label text-[10px] font-bold uppercase tracking-[0.18em] text-error"
                    >
                      Delete
                    </button>
                  ) : null}
                </article>
              );
            })}
          </section>
        ) : (
          <section className="mb-32 bg-surface-container-low p-12 text-center">
            <h2 className="font-headline text-3xl">No seller essays yet</h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-on-surface-variant">
              The archive will fill as sellers publish stories, fabric notes, and
              collection essays.
            </p>
          </section>
        )}

        <section className="bg-surface-container-low px-6 py-16 md:px-10">
          <div className="mb-10 flex items-center justify-between gap-6">
            <h2 className="font-headline text-3xl italic text-on-background md:text-4xl">
              Curated Collections
            </h2>
            <Link
              to="/archives/volumes"
              className="font-label text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant"
            >
              View All Volumes
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="flex min-h-[300px] flex-col justify-end bg-surface-container-lowest p-10">
              <p className="mb-auto font-label text-[9px] font-bold uppercase tracking-[0.22em] text-outline">
                Series 01
              </p>
              <h3 className="font-headline text-3xl text-on-background">
                {collectionBlogs[0]?.category || "Monochrome Matters"}
              </h3>
              <p className="mt-4 text-xs leading-5 text-on-surface-variant">
                {collectionBlogs[0]?.excerpt ||
                  "The profound impact of a single-tone wardrobe on the psychological presence of the wearer."}
              </p>
            </div>

            {(collectionBlogs.length ? collectionBlogs : gridBlogs.slice(0, 2)).map((blog) => (
              <Link
                key={blog._id}
                to={`/archives/${blog.slug}`}
                className="group bg-surface-container-lowest"
              >
                <div className="aspect-[4/3] overflow-hidden bg-surface-container">
                  <img
                    src={resolveMediaUrl(blog.coverImage)}
                    alt={blog.title}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="p-6">
                  <p className="font-label text-[9px] font-bold uppercase tracking-[0.22em] text-outline">
                    {blog.category}
                  </p>
                  <h3 className="mt-3 font-headline text-xl">{blog.title}</h3>
                </div>
              </Link>
            ))}

            {blogs.length === 0 ? (
              <div className="flex min-h-[300px] items-center justify-center bg-primary text-on-primary">
                <div className="border border-on-primary/30 p-10 text-center">
                  <p className="font-label text-[10px] font-bold uppercase tracking-[0.26em]">
                    Heritage Leather
                  </p>
                  <span className="material-symbols-outlined mt-6">east</span>
                </div>
              </div>
            ) : null}
          </div>

          {featured ? (
            <p className="mt-10 font-label text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">
              Featured seller: {featuredStore}
            </p>
          ) : null}
        </section>
      </main>
    </div>
  );
}
