import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getBlogs } from "../../api/blog";
import { resolveMediaUrl } from "../../utils/media";

export default function JournalSection() {
  const [journals, setJournals] = useState([]);

  useEffect(() => {
    const fetchJournals = async () => {
      try {
        const res = await getBlogs({ filter: "trending", limit: 4 });
        if (res.data?.blogs) {
          setJournals(res.data.blogs);
        }
      } catch (err) {
        console.error("Failed to fetch trending journals:", err);
      }
    };
    fetchJournals();
  }, []);

  return (
    <section className="bg-white py-12 border-b border-stone-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Section Title */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-lg sm:text-xl font-bold tracking-[0.18em] uppercase text-stone-900 font-headline">
            FROM THE JOURNAL
          </h2>
          <Link
            to="/archives"
            className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-700 hover:text-black transition-colors"
          >
            View All
          </Link>
        </div>

        {/* 4 Article Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {journals.map((article) => (
            <Link
              key={article._id}
              to={`/archives/${article.slug}`}
              className="group flex flex-col"
            >
              <div className="aspect-[4/3] w-full overflow-hidden rounded-md bg-stone-200">
                <img
                  src={resolveMediaUrl(article.coverImage)}
                  alt={article.title}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>

              <h3 className="mt-4 font-headline text-base sm:text-lg font-normal text-stone-950 group-hover:text-stone-600 transition-colors leading-snug">
                {article.title} <span className="inline-block transition-transform group-hover:translate-x-1">›</span>
              </h3>

              <span className="mt-2 text-[10px] font-bold tracking-[0.18em] uppercase text-stone-400">
                {new Date(article.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}
              </span>
            </Link>
          ))}
        </div>

      </div>
    </section>
  );
}
