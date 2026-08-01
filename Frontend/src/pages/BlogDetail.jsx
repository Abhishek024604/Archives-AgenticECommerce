import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getBlog, logBlogMetrics } from "../api/blog";
import AnnouncementBar from "../components/home/AnnouncementBar";
import HomeNavbar from "../components/home/HomeNavbar";
import HomeFooter from "../components/home/HomeFooter";
import { getJournalImage } from "../utils/journalImage";

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

  useEffect(() => {
    if (!blog?._id) return;
    const startTime = Date.now();

    return () => {
      const timeSpent = Math.round((Date.now() - startTime) / 1000);
      logBlogMetrics(blog._id, timeSpent).catch(console.error);
    };
  }, [blog?._id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-stone-900 font-sans">
        <AnnouncementBar />
        <HomeNavbar />
        <div className="py-20 text-center text-sm font-medium text-stone-500">
          Loading article...
        </div>
        <HomeFooter />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white text-stone-900 font-sans">
        <AnnouncementBar />
        <HomeNavbar />
        <div className="py-20 text-center text-sm font-medium text-red-600">
          {error}
        </div>
        <HomeFooter />
      </div>
    );
  }

  const paragraphs = blog.content ? blog.content.split(/\n+/).filter(Boolean) : [];

  return (
    <div className="min-h-screen bg-white text-stone-900 font-sans selection:bg-stone-900 selection:text-white">
      <AnnouncementBar />
      <HomeNavbar />

      <article className="bg-white text-stone-900">
        <header className="relative min-h-[500px] overflow-hidden bg-stone-950 text-white">
          <img
            src={getJournalImage(blog)}
            alt={blog.title}
            className="absolute inset-0 h-full w-full object-cover opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
          <div className="relative z-10 flex min-h-[500px] max-w-[1536px] mx-auto flex-col justify-end px-6 pb-16 md:px-12">
            <Link
              to="/archives"
              className="mb-8 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-stone-300 hover:text-white"
            >
              <span>←</span>
              <span>Back to Journal</span>
            </Link>
            <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.24em] text-stone-300">
              <span>{blog.category || "Editorial"}</span>
              <span>•</span>
              <span>{formatDate(blog.createdAt)}</span>
              {blog.theme && (
                <>
                  <span>•</span>
                  <span className="bg-stone-800/80 px-2 py-0.5 text-stone-200">
                    {blog.theme}
                  </span>
                </>
              )}
            </div>
            <h1 className="mt-4 font-headline text-4xl sm:text-6xl font-normal leading-[1.08] text-white max-w-4xl">
              {blog.title}
            </h1>
            {blog.subtitle ? (
              <p className="mt-4 max-w-2xl font-headline text-xl italic text-stone-300">
                {blog.subtitle}
              </p>
            ) : null}
          </div>
        </header>

        <div className="mx-auto grid max-w-[1536px] grid-cols-1 gap-12 px-6 py-16 md:grid-cols-[260px_minmax(0,1fr)] md:px-12">
          <aside className="space-y-4 border-b md:border-b-0 md:border-r border-stone-200 pb-8 md:pb-0 pr-6 text-xs text-stone-600">
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-stone-400">
                Author
              </span>
              <p className="mt-1 font-semibold text-stone-900">
                {blog.author?.sellerInfo?.storeName || blog.author?.name || "Archivist"}
              </p>
            </div>

            <div>
              <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-stone-400">
                Read Time
              </span>
              <p className="mt-1 font-semibold text-stone-900">
                {blog.readTimeMinutes || 5} Min Read
              </p>
            </div>

            {blog.tags?.length ? (
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-stone-400 mb-2">
                  Tags
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {blog.tags.map((tag) => (
                    <span key={tag} className="bg-stone-100 px-2.5 py-1 text-[10px] font-medium text-stone-700">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </aside>

          <div className="max-w-3xl">
            {blog.excerpt ? (
              <p className="mb-10 font-headline text-2xl italic leading-relaxed text-stone-700 border-l-2 border-stone-950 pl-6">
                {blog.excerpt}
              </p>
            ) : null}

            {blog.contentFormat === "html" ? (
              <div
                className="blog-prose text-base leading-8 text-stone-800 space-y-6"
                dangerouslySetInnerHTML={{ __html: blog.content }}
              />
            ) : (
              <div className="space-y-6 text-base leading-8 text-stone-800">
                {paragraphs.map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))}
              </div>
            )}
          </div>
        </div>
      </article>

      <HomeFooter />
    </div>
  );
}
