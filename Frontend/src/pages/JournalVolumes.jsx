import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getBlogs } from "../api/blog";
import { resolveMediaUrl } from "../utils/media";

const formatDate = (value) => {
  if (!value) return "Undated";

  return new Intl.DateTimeFormat("en", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
};

export default function JournalVolumes() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    getBlogs()
      .then((res) => {
        if (active) setBlogs(res.data.blogs || []);
      })
      .catch((err) => {
        if (active) {
          setError(err?.response?.data?.message || "Failed to load journals");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="mx-auto w-full max-w-[1440px] px-6 pb-28 pt-14 md:px-12">
      <header className="mb-14 border-b border-outline-variant/20 pb-10">
        <p className="font-label text-[10px] font-bold uppercase tracking-[0.28em] text-on-surface-variant">
          Archivist Journal
        </p>
        <h1 className="mt-4 font-headline text-5xl text-on-background md:text-7xl">
          All Volumes
        </h1>
        <p className="mt-5 max-w-xl text-sm leading-6 text-on-surface-variant">
          Essays, collection notes, and stories from across the Archivist
          community.
        </p>
      </header>

      {loading ? (
        <p className="py-20 text-center text-on-surface-variant">
          Loading journals...
        </p>
      ) : error ? (
        <p className="py-20 text-center text-error">{error}</p>
      ) : blogs.length === 0 ? (
        <section className="bg-surface-container-low p-12 text-center">
          <h2 className="font-headline text-3xl">No journals published yet</h2>
        </section>
      ) : (
        <section className="grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
          {blogs.map((blog, index) => (
            <Link
              key={blog._id}
              to={`/archives/${blog.slug}`}
              className="group block"
            >
              <div className="aspect-[4/3] overflow-hidden bg-surface-container-low">
                <img
                  src={resolveMediaUrl(blog.coverImage)}
                  alt={blog.title}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <div className="border-x border-b border-outline-variant/15 p-6">
                <div className="flex items-center justify-between gap-4 text-[9px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                  <span>Volume {String(index + 1).padStart(2, "0")}</span>
                  <span>{formatDate(blog.createdAt)}</span>
                </div>
                <h2 className="mt-4 font-headline text-2xl text-on-background">
                  {blog.title}
                </h2>
                <p className="mt-3 line-clamp-3 text-sm leading-6 text-on-surface-variant">
                  {blog.excerpt}
                </p>
              </div>
            </Link>
          ))}
        </section>
      )}
    </main>
  );
}
