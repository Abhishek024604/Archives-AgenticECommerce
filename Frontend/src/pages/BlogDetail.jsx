import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getBlog } from "../api/blog";
import { resolveMediaUrl } from "../utils/media";

const formatDate = (value) => {
  if (!value) return "Undated";

  return new Intl.DateTimeFormat("en", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
};

export default function BlogDetail() {
  const { slug } = useParams();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const res = await getBlog(slug);

        if (active) {
          setBlog(res.data.blog);
        }
      } catch (err) {
        if (active) {
          setError(err?.response?.data?.message || "Blog not found");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [slug]);

  if (loading) {
    return <div className="bg-surface p-10 text-on-surface-variant">Loading article...</div>;
  }

  if (error) {
    return <div className="bg-surface p-10 text-error">{error}</div>;
  }

  const paragraphs = blog.content.split(/\n+/).filter(Boolean);

  return (
    <article className="bg-surface text-on-background">
      <header className="relative min-h-[620px] overflow-hidden bg-surface-container-low">
        <img
          src={resolveMediaUrl(blog.coverImage)}
          alt={blog.title}
          className="absolute inset-0 h-full w-full object-cover grayscale"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/50 to-transparent" />
        <div className="relative z-10 flex min-h-[620px] max-w-4xl flex-col justify-end px-6 pb-20 md:px-20">
          <Link
            to="/archives"
            className="mb-10 font-label text-[10px] font-bold uppercase tracking-[0.22em] text-on-surface-variant"
          >
            Back to Journal
          </Link>
          <p className="font-label text-[10px] font-bold uppercase tracking-[0.28em] text-on-surface-variant">
            {blog.category} / {formatDate(blog.createdAt)}
          </p>
          <h1 className="mt-6 font-headline text-5xl leading-none tracking-tight md:text-7xl">
            {blog.title}
          </h1>
          {blog.subtitle ? (
            <p className="mt-8 max-w-2xl font-headline text-2xl italic leading-snug text-secondary">
              {blog.subtitle}
            </p>
          ) : null}
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 px-6 py-20 md:grid-cols-[220px_minmax(0,1fr)] md:px-12">
        <aside className="font-label text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">
          <p>By {blog.author?.sellerInfo?.storeName || blog.author?.name || "Seller"}</p>
          <p className="mt-4">{blog.readTimeMinutes} min read</p>
          {blog.tags?.length ? (
            <div className="mt-8 flex flex-wrap gap-2">
              {blog.tags.map((tag) => (
                <span key={tag} className="bg-surface-container-low px-3 py-2">
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
        </aside>

        <div className="max-w-3xl">
          {blog.excerpt ? (
            <p className="mb-12 font-headline text-3xl italic leading-tight text-secondary">
              {blog.excerpt}
            </p>
          ) : null}
          {blog.contentFormat === "html" ? (
            <div
              className="blog-prose text-base leading-8 text-on-surface"
              dangerouslySetInnerHTML={{ __html: blog.content }}
            />
          ) : (
            <div className="space-y-7 text-base leading-8 text-on-surface">
              {paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
