import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getBlogs } from "../api/blog";
import AnnouncementBar from "../components/home/AnnouncementBar";
import HomeNavbar from "../components/home/HomeNavbar";
import HomeFooter from "../components/home/HomeFooter";
import { getJournalImage } from "../utils/journalImage";

const JOURNAL_THEMES = [
  "All Themes",
  "Sustainability",
  "Design & Craft",
  "Watches",
  "Fragrance",
  "Horology & Tailoring",
  "Culture & Heritage",
  "Quiet Luxury",
];

const DEMO_ALL_ARTICLES = [
  {
    _id: "demo-1",
    slug: "silks-aura",
    title: "Silk's Aura",
    subtitle: "The Classical Tale of Silk",
    excerpt: "Tracing the journey of silk from ancient China to the world's most luxurious wardrobes.",
    theme: "Horology & Tailoring",
    coverImage: "/assets/image.png",
    readTimeMinutes: 6,
    createdAt: "2026-05-05T00:00:00.000Z",
    author: { name: "Adam's Clothings", sellerInfo: { storeName: "Adam's Clothings" } },
  },
  {
    _id: "demo-2",
    slug: "monochrome-matters",
    title: "Monochrome Matters",
    subtitle: "Psychology of Single Tones",
    excerpt: "The profound impact of a single-tone wardrobe on the psychological presence of the wearer.",
    theme: "Quiet Luxury",
    coverImage: "/assets/image2.png",
    readTimeMinutes: 4,
    createdAt: "2026-05-03T00:00:00.000Z",
    author: { name: "Nainital Store", sellerInfo: { storeName: "Nainital Store" } },
  },
  {
    _id: "demo-3",
    slug: "timeless-horology-and-the-cuff",
    title: "Timeless Horology and the Cuff",
    subtitle: "Framing the Wrist",
    excerpt: "A close look at how watches and cuffs frame the hand, carrying rhythm, ritual, and restraint into daily dress.",
    theme: "Watches",
    coverImage: "/assets/journalPage/horology.png",
    readTimeMinutes: 5,
    createdAt: "2026-05-01T00:00:00.000Z",
    author: { name: "Nainital Store", sellerInfo: { storeName: "Nainital Store" } },
  },
  {
    _id: "demo-4",
    slug: "the-art-of-quiet-luxury",
    title: "The Art of Quiet Luxury",
    excerpt: "Why true luxury speaks softly and leaves a lasting impression.",
    theme: "Quiet Luxury",
    coverImage: "/assets/clean_hero1.png",
    readTimeMinutes: 4,
    createdAt: "2026-05-28T00:00:00.000Z",
    author: { name: "Archivist Journal" },
  },
  {
    _id: "demo-5",
    slug: "sustainable-sartorialism",
    title: "Sustainable Sartorialism",
    excerpt: "Redefining longevity in an era of ephemeral trends.",
    theme: "Sustainability",
    coverImage: "/assets/journalPage/sustainable.png",
    readTimeMinutes: 6,
    createdAt: "2026-04-25T00:00:00.000Z",
    author: { name: "Archivist Journal" },
  },
  {
    _id: "demo-6",
    slug: "silk-a-weavers-legacy",
    title: "Silk: A Weaver's Legacy",
    excerpt: "Understanding the craft, the culture and the countless hours behind every thread.",
    theme: "Design & Craft",
    coverImage: "/assets/journalPage/artCraft.png",
    readTimeMinutes: 5,
    createdAt: "2026-04-22T00:00:00.000Z",
    author: { name: "Adam's Clothings", sellerInfo: { storeName: "Adam's Clothings" } },
  },
  {
    _id: "demo-7",
    slug: "the-history-of-the-trench",
    title: "The History of the Trench",
    excerpt: "From battlefield to boulevard, the trench coat's enduring legacy.",
    theme: "Horology & Tailoring",
    coverImage: "/assets/journalPage/horology.png",
    readTimeMinutes: 4,
    createdAt: "2026-04-20T00:00:00.000Z",
    author: { name: "Archivist Journal" },
  },
  {
    _id: "demo-8",
    slug: "notes-on-olfactory-art",
    title: "Notes on Olfactory Art",
    excerpt: "Exploring the emotional alchemy of niche perfumery and rare essences.",
    theme: "Fragrance",
    coverImage: "/assets/clean_hero3.png",
    readTimeMinutes: 5,
    createdAt: "2026-04-15T00:00:00.000Z",
    author: { name: "Archivist Journal" },
  },
];

const formatDate = (value) => {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
    .format(new Date(value))
    .toUpperCase();
};

export default function JournalVolumes() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTheme = searchParams.get("theme") || "All Themes";

  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTheme, setSelectedTheme] = useState(initialTheme);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(true);

  useEffect(() => {
    const urlTheme = searchParams.get("theme");
    if (urlTheme) {
      setSelectedTheme(urlTheme);
    } else {
      setSelectedTheme("All Themes");
    }
  }, [searchParams]);

  const handleSelectTheme = (theme) => {
    setSelectedTheme(theme);
    if (theme && theme !== "All Themes") {
      setSearchParams({ theme }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  };

  useEffect(() => {
    let active = true;

    getBlogs()
      .then((res) => {
        if (active) setBlogs(res.data.blogs || []);
      })
      .catch(() => {
        if (active) setBlogs([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const filteredArticles = useMemo(() => {
    const list = blogs.length > 0 ? blogs : DEMO_ALL_ARTICLES;
    return list.filter((article) => {
      const matchesTheme =
        selectedTheme === "All Themes" ||
        (article.theme || "").toLowerCase() === selectedTheme.toLowerCase();
      const matchesSearch =
        !searchQuery.trim() ||
        (article.title || "").toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        (article.excerpt || "").toLowerCase().includes(searchQuery.toLowerCase().trim());

      return matchesTheme && matchesSearch;
    });
  }, [blogs, selectedTheme, searchQuery]);

  const clearAllFilters = () => {
    setSelectedTheme("All Themes");
    setSearchQuery("");
    setSearchParams({}, { replace: true });
  };

  return (
    <div className="min-h-screen bg-white text-stone-900 font-sans selection:bg-stone-900 selection:text-white">
      <AnnouncementBar />
      <HomeNavbar />

      <main className="mx-auto max-w-[1536px] px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-[11px] font-medium text-stone-500 uppercase tracking-wider">
          <Link to="/" className="hover:text-stone-900 transition-colors">
            Home
          </Link>
          <span>›</span>
          <Link to="/archives" className="hover:text-stone-900 transition-colors">
            Journal
          </Link>
          <span>›</span>
          <span className="text-stone-900 font-semibold">All Articles</span>
        </nav>

        {/* Header Title */}
        <div className="border-b border-stone-200 pb-6">
          <h1 className="font-headline text-4xl sm:text-5xl lg:text-6xl font-normal text-stone-950">
            All Journal Articles
          </h1>
          <p className="mt-3 text-xs sm:text-sm text-stone-500 font-light max-w-xl leading-relaxed">
            Explore essays, collection notes, and stories from across the Archivist community.
          </p>
        </div>

        {/* Toolbar & Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-200 pb-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center gap-2 border border-stone-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wider text-stone-800 hover:border-stone-900 transition-colors"
            >
              <span className="material-symbols-outlined text-base">tune</span>
              <span>{showFilters ? "Hide Sidebar" : "Show Sidebar"}</span>
            </button>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium text-stone-600">
            <span>{filteredArticles.length} Articles</span>
            {selectedTheme !== "All Themes" && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="text-stone-950 font-bold hover:underline"
              >
                Clear Theme Filter
              </button>
            )}
          </div>
        </div>

        {/* Main Content (Left Theme Sidebar + 4-Column Journal Grid) */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* Side Panel to filter for themes */}
          {showFilters && (
            <aside className="w-full lg:w-64 shrink-0 space-y-6 border border-stone-200/80 bg-[#FAFAFA] p-5 rounded-xl">
              
              {/* Search Input */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-stone-900 mb-3">
                  Search Articles
                </h3>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by keyword..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full border border-stone-300 bg-white p-2.5 text-xs text-stone-900 outline-none focus:border-stone-900"
                  />
                </div>
              </div>

              {/* Themes Selection List */}
              <div className="border-t border-stone-200 pt-5">
                <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-stone-900 mb-3">
                  Filter by Theme
                </h3>
                <div className="space-y-1 text-xs">
                  {JOURNAL_THEMES.map((theme) => {
                    const isSelected = selectedTheme.toLowerCase() === theme.toLowerCase();

                    return (
                      <button
                        key={theme}
                        type="button"
                        onClick={() => handleSelectTheme(theme)}
                        className={`flex w-full items-center justify-between py-2 px-3 rounded-md transition-all ${
                          isSelected
                            ? "bg-stone-950 font-bold text-white shadow-xs"
                            : "text-stone-700 hover:bg-stone-200/70 hover:text-black"
                        }`}
                      >
                        <span>{theme}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Clear Action */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="w-full border border-stone-300 bg-white py-2 text-xs font-bold uppercase tracking-wider text-stone-800 transition-colors hover:bg-stone-950 hover:text-white"
                >
                  Reset Filters
                </button>
              </div>

            </aside>
          )}

          {/* Main 4-Column Journal Cards Grid */}
          <div className="flex-1 min-w-0 w-full">
            {loading ? (
              <div className="py-20 text-center text-xs text-stone-500 font-medium">
                Loading all journal articles...
              </div>
            ) : filteredArticles.length === 0 ? (
              <div className="border border-stone-200 bg-[#FAFAFA] py-16 px-6 text-center rounded-xl">
                <h3 className="font-headline text-2xl text-stone-900">
                  No articles found
                </h3>
                <p className="mt-2 text-xs text-stone-500 max-w-sm mx-auto">
                  Try adjusting the theme filter or search terms.
                </p>
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="mt-5 inline-flex bg-stone-950 text-white px-6 py-2.5 text-xs font-bold uppercase tracking-wider"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div
                className={`grid gap-6 ${
                  showFilters
                    ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
                    : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
                }`}
              >
                {filteredArticles.map((article) => (
                  <div
                    key={article._id}
                    className="group flex flex-col justify-between rounded-xl overflow-hidden bg-white border border-stone-200 p-4 transition-all hover:shadow-md"
                  >
                    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-none bg-stone-200">
                      <Link to={`/archives/${article.slug}`}>
                        <img
                          src={getJournalImage(article)}
                          alt={article.title}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </Link>

                      {article.theme && (
                        <span className="absolute top-2.5 left-2.5 bg-stone-900/80 backdrop-blur-xs text-white px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest rounded-xs">
                          {article.theme}
                        </span>
                      )}
                    </div>

                    <div className="mt-3 flex-1 flex flex-col justify-between">
                      <div>
                        <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-stone-400">
                          {formatDate(article.createdAt)} • {article.readTimeMinutes || 4} MIN READ
                        </span>

                        <Link to={`/archives/${article.slug}`}>
                          <h3 className="font-headline text-lg font-medium text-stone-950 mt-1 line-clamp-1 group-hover:text-stone-600 transition-colors">
                            {article.title}
                          </h3>
                        </Link>

                        <p className="mt-1.5 text-xs text-stone-600 font-light line-clamp-2 leading-relaxed">
                          {article.excerpt}
                        </p>
                      </div>

                      <div className="mt-4 pt-2 border-t border-stone-100 flex items-center justify-between text-[10px] font-bold text-stone-600 uppercase tracking-wider">
                        <span>
                          By {article.author?.sellerInfo?.storeName || article.author?.name || "Archivist"}
                        </span>
                        <Link
                          to={`/archives/${article.slug}`}
                          className="text-stone-950 font-bold hover:underline"
                        >
                          Read →
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </main>

      <HomeFooter />
    </div>
  );
}
