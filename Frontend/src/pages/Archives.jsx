import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { createBlog, deleteBlog, getBlogs } from "../api/blog";
import BlogEditor from "../components/BlogEditor";
import AnnouncementBar from "../components/home/AnnouncementBar";
import HomeNavbar from "../components/home/HomeNavbar";
import HomeFooter from "../components/home/HomeFooter";
import { useAuth } from "../context/AuthContext";
import { getJournalImage, getThemeImage } from "../utils/journalImage";

const DEMO_ARTICLES = [
  {
    _id: "demo-lead",
    slug: "silks-aura",
    title: "Silk's Aura",
    subtitle: "The Classical Tale of Silk",
    excerpt:
      "Tracing the journey of silk from ancient China to the world's most luxurious wardrobes.",
    content: "Silk has always been the hallmark of understated elegance...",
    category: "Editorial",
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
    excerpt:
      "The profound impact of a single-tone wardrobe on the psychological presence of the wearer.",
    category: "Editorial",
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
    excerpt:
      "A close look at how watches and cuffs frame the hand, carrying rhythm, ritual, and restraint into daily dress.",
    category: "Horology",
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
    category: "Minimalism",
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
    category: "Sustainability",
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
    excerpt:
      "Understanding the craft, the culture and the countless hours behind every thread.",
    category: "Craftsmanship",
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
    category: "History",
    theme: "Horology & Tailoring",
    coverImage: "/assets/journalPage/horology.png",
    readTimeMinutes: 4,
    createdAt: "2026-04-20T00:00:00.000Z",
    author: { name: "Archivist Journal" },
  },
];

const THEME_COLLECTIONS = [
  {
    name: "Sustainability",
    count: "5 Articles",
    image: "/assets/journalPage/sustainable.png",
  },
  {
    name: "Design & Craft",
    count: "7 Articles",
    image: "/assets/journalPage/artCraft.png",
  },
  {
    name: "Watches",
    count: "6 Articles",
    image: "/assets/journalPage/horology.png",
  },
  {
    name: "Fragrance",
    count: "4 Articles",
    image: "/assets/clean_hero3.png",
  },
  {
    name: "Horology & Tailoring",
    count: "8 Articles",
    image: "/assets/image.png",
  },
  {
    name: "Quiet Luxury",
    count: "9 Articles",
    image: "/assets/clean_hero1.png",
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

export default function Archives() {
  const { user } = useAuth();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTheme, setSelectedTheme] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);
  const themeCarouselRef = useRef(null);

  const isSeller = user?.role === "seller";

  const scrollThemeCarousel = (direction) => {
    if (themeCarouselRef.current) {
      const offset = direction === "left" ? -300 : 300;
      themeCarouselRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      const res = await getBlogs();
      setBlogs(res.data.blogs || []);
    } catch {
      setBlogs([]);
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
    if (!window.confirm("Delete this blog from the archive?")) return;
    await deleteBlog(blogId);
    await fetchBlogs();
  };

  const displayList = useMemo(() => {
    const list = blogs.length > 0 ? blogs : DEMO_ARTICLES;
    if (!selectedTheme) return list;
    return list.filter(
      (item) => (item.theme || "").toLowerCase() === selectedTheme.toLowerCase()
    );
  }, [blogs, selectedTheme]);

  const leadArticle = displayList[0] || DEMO_ARTICLES[0];
  const sideArticles = displayList.slice(1, 3);
  const bottomArticles = displayList.slice(3, 7);

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (newsletterEmail.trim()) {
      setNewsletterSubscribed(true);
      setNewsletterEmail("");
    }
  };

  return (
    <div className="min-h-screen bg-white text-stone-900 font-sans selection:bg-stone-900 selection:text-white">
      <AnnouncementBar />
      <HomeNavbar />

      <main className="mx-auto max-w-[1536px] px-4 sm:px-6 lg:px-8 py-8 space-y-16">
        
        {/* Seller Editorial Controller */}
        {isSeller && (
          <section className="bg-[#F6F4F0] p-6 rounded-lg border border-stone-300 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500">
                Seller Desk
              </span>
              <h3 className="font-headline text-2xl font-normal text-stone-950">
                Publish a Journal Entry
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setShowForm(!showForm)}
              className="bg-stone-950 text-white px-6 py-2.5 text-xs font-bold uppercase tracking-wider transition-all hover:bg-black"
            >
              {showForm ? "Close Editor" : "Write Article"}
            </button>
          </section>
        )}

        {/* Seller Editor Drawer */}
        {showForm && (
          <section className="bg-white border border-stone-300 rounded-lg p-6 shadow-md">
            <BlogEditor
              onSubmit={submitBlog}
              onCancel={() => setShowForm(false)}
              saving={saving}
              error={formError}
            />
          </section>
        )}

        {/* 1. Journal Hero Banner */}
        <section className="relative overflow-hidden rounded-xl bg-[#F5F4F0] border border-stone-200 grid grid-cols-1 lg:grid-cols-12 min-h-[460px] items-center">
          <div className="lg:col-span-6 p-8 sm:p-12 lg:p-16 flex flex-col justify-center">
            <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-stone-500 mb-3">
              JOURNAL
            </span>
            <h1 className="font-headline text-4xl sm:text-5xl lg:text-6xl font-normal text-stone-950 leading-[1.06]">
              Stories that inspire style
            </h1>
            <p className="mt-4 text-xs sm:text-sm font-light text-stone-600 max-w-md leading-relaxed">
              Insights, inspiration and ideas from the world of luxury, culture and design.
            </p>
            <div className="mt-8">
              <Link
                to="/archives/volumes"
                className="inline-block bg-stone-950 text-white px-8 py-3.5 text-xs font-bold uppercase tracking-[0.18em] transition-transform hover:scale-[1.02] hover:bg-black"
              >
                Explore All Articles
              </Link>
            </div>
          </div>

          <div className="lg:col-span-6 h-full min-h-[300px] lg:min-h-full overflow-hidden bg-stone-200">
            <img
              src="/assets/clean_hero2.png"
              alt="Journal Stories books and candles"
              className="h-full w-full object-cover object-center"
            />
          </div>
        </section>

        {/* 2. Latest Articles Section */}
        <section id="latest-articles">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-stone-200">
            <h2 className="font-headline text-3xl font-normal text-stone-950">
              Latest Articles
            </h2>
            <div className="flex items-center gap-4">
              {selectedTheme && (
                <button
                  type="button"
                  onClick={() => setSelectedTheme("")}
                  className="text-xs text-red-600 font-bold hover:underline"
                >
                  Clear Filter ({selectedTheme})
                </button>
              )}
              <Link
                to="/archives/volumes"
                className="text-xs font-semibold uppercase tracking-wider text-stone-950 hover:underline"
              >
                View All Articles →
              </Link>
            </div>
          </div>

          {/* Top Row: Lead Dark Feature + 2 Side Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch mb-8">
            
            {/* Main Lead Dark Card */}
            {leadArticle && (
              <div className="lg:col-span-6 relative flex flex-col justify-between rounded-xl overflow-hidden bg-stone-950 text-white p-8 min-h-[460px] border border-stone-900 group">
                <div className="absolute inset-0 opacity-40 mix-blend-overlay">
                  <img
                    src={getJournalImage(leadArticle)}
                    alt={leadArticle.title}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="relative z-10 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.2em] text-stone-300">
                  <span>
                    {formatDate(leadArticle.createdAt)} • {leadArticle.readTimeMinutes || 6} MIN READ
                  </span>
                  {leadArticle.theme && (
                    <span className="bg-stone-800/80 px-2.5 py-1 text-[9px] text-stone-200">
                      {leadArticle.theme}
                    </span>
                  )}
                </div>

                <div className="relative z-10 my-8">
                  <h3 className="font-headline text-3xl sm:text-4xl lg:text-5xl font-normal text-white">
                    {leadArticle.title}
                  </h3>
                  {leadArticle.subtitle && (
                    <p className="font-headline italic text-lg text-stone-300 mt-2">
                      {leadArticle.subtitle}
                    </p>
                  )}
                  <p className="mt-3 text-xs sm:text-sm text-stone-300 font-light leading-relaxed max-w-lg line-clamp-3">
                    {leadArticle.excerpt}
                  </p>
                </div>

                <div className="relative z-10 flex items-center justify-between pt-4 border-t border-stone-800/80">
                  <span className="text-xs font-semibold text-stone-300">
                    By {leadArticle.author?.sellerInfo?.storeName || leadArticle.author?.name || "Archivist Journal"}
                  </span>
                  <Link
                    to={`/archives/${leadArticle.slug}`}
                    className="border border-stone-400 px-5 py-2 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-white hover:text-black"
                  >
                    Read Article
                  </Link>
                </div>
              </div>
            )}

            {/* 2 Top Right Side Cards */}
            <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
              {sideArticles.map((article) => (
                <div
                  key={article._id}
                  className="flex flex-col justify-between rounded-xl overflow-hidden bg-[#F9F9F8] border border-stone-200 p-5 transition-all hover:bg-white hover:shadow-md"
                >
                  <div className="aspect-[4/3] w-full overflow-hidden rounded-none bg-stone-200">
                    <Link to={`/archives/${article.slug}`}>
                      <img
                        src={getJournalImage(article)}
                        alt={article.title}
                        className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                      />
                    </Link>
                  </div>

                  <div className="mt-4 flex-1 flex flex-col justify-between">
                    <div>
                      <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-stone-500">
                        {formatDate(article.createdAt)} • {article.readTimeMinutes || 4} MIN READ
                      </span>
                      <Link to={`/archives/${article.slug}`}>
                        <h4 className="font-headline text-xl font-medium text-stone-950 mt-1 hover:text-stone-600 transition-colors">
                          {article.title}
                        </h4>
                      </Link>
                      <p className="mt-2 text-xs text-stone-600 font-light line-clamp-2 leading-relaxed">
                        {article.excerpt}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-stone-200 text-[11px] font-semibold text-stone-700">
                      By {article.author?.sellerInfo?.storeName || article.author?.name || "Archivist Journal"}
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>

          {/* Bottom Row 4 Smaller Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {bottomArticles.map((article) => (
              <div
                key={article._id}
                className="flex flex-col justify-between rounded-xl overflow-hidden bg-[#F9F9F8] border border-stone-200 p-4 transition-all hover:bg-white hover:shadow-md"
              >
                <div className="aspect-[4/3] w-full overflow-hidden rounded-none bg-stone-200">
                  <Link to={`/archives/${article.slug}`}>
                    <img
                      src={getJournalImage(article)}
                      alt={article.title}
                      className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                  </Link>
                </div>

                <div className="mt-3 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-stone-500">
                      {formatDate(article.createdAt)} • {article.readTimeMinutes || 4} MIN READ
                    </span>
                    <Link to={`/archives/${article.slug}`}>
                      <h4 className="font-headline text-lg font-medium text-stone-950 mt-1 line-clamp-1 hover:text-stone-600">
                        {article.title}
                      </h4>
                    </Link>
                    <p className="mt-1.5 text-xs text-stone-600 font-light line-clamp-2 leading-relaxed">
                      {article.excerpt}
                    </p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-stone-200 text-[10px] font-bold text-stone-700 uppercase tracking-wider">
                    By {article.author?.sellerInfo?.storeName || article.author?.name || "Archivist Journal"}
                  </div>
                </div>
              </div>
            ))}
          </div>

        </section>

        {/* 3. Explore by Themes Section */}
        <section className="bg-[#F9F9F8] p-8 sm:p-12 rounded-xl border border-stone-200">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-stone-500">
                CURATED COLLECTIONS
              </span>
              <h2 className="font-headline text-3xl sm:text-4xl font-normal text-stone-950 mt-1">
                Explore by themes
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-stone-600 font-light leading-relaxed max-w-md">
                Handpicked reads around the topics that matter to you.
              </p>
            </div>

            <div className="flex items-center gap-4">
              <Link
                to="/archives/volumes"
                className="text-xs font-bold uppercase tracking-wider text-stone-950 hover:underline"
              >
                View All Collections →
              </Link>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => scrollThemeCarousel("left")}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-stone-300 bg-white text-stone-700 transition-colors hover:border-black hover:bg-stone-950 hover:text-white"
                  aria-label="Scroll left"
                >
                  <span className="material-symbols-outlined text-base">chevron_left</span>
                </button>
                <button
                  type="button"
                  onClick={() => scrollThemeCarousel("right")}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-stone-300 bg-white text-stone-700 transition-colors hover:border-black hover:bg-stone-950 hover:text-white"
                  aria-label="Scroll right"
                >
                  <span className="material-symbols-outlined text-base">chevron_right</span>
                </button>
              </div>
            </div>
          </div>

          <div
            ref={themeCarouselRef}
            className="flex gap-4 overflow-x-auto pb-2 scrollbar-none scroll-smooth snap-x snap-mandatory"
            style={{ scrollbarWidth: "none" }}
          >
            {THEME_COLLECTIONS.map((themeItem) => (
              <Link
                key={themeItem.name}
                to={`/archives/volumes?theme=${encodeURIComponent(themeItem.name)}`}
                className="group relative w-[210px] sm:w-[240px] aspect-[3/4] shrink-0 snap-start overflow-hidden rounded-xl border border-stone-200 transition-all hover:shadow-md"
              >
                <img
                  src={getThemeImage(themeItem.name)}
                  alt={themeItem.name}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <h4 className="font-headline text-lg font-medium">
                    {themeItem.name}
                  </h4>
                  <p className="text-[10px] text-stone-300 font-light mt-0.5">
                    {themeItem.count}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* 4. Stay Inspired Newsletter Bar */}
        <section className="relative overflow-hidden rounded-xl bg-[#F5F4F0] border border-stone-200 p-8 sm:p-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-5">
              <h2 className="font-headline text-3xl sm:text-4xl font-normal text-stone-950">
                Stay inspired. Join The Archive.
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-stone-600 font-light leading-relaxed">
                Subscribe for exclusive stories, early access and curated recommendations.
              </p>
            </div>

            <div className="lg:col-span-7">
              {newsletterSubscribed ? (
                <div className="bg-stone-950 text-white p-4 rounded-md text-xs font-semibold text-center">
                  Thank you for joining The Archive. Check your inbox soon.
                </div>
              ) : (
                <form onSubmit={handleNewsletterSubmit} className="space-y-3">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="email"
                      required
                      placeholder="Enter your email"
                      value={newsletterEmail}
                      onChange={(e) => setNewsletterEmail(e.target.value)}
                      className="flex-1 border border-stone-300 bg-white px-4 py-3 text-xs text-stone-900 outline-none focus:border-stone-900"
                    />
                    <button
                      type="submit"
                      className="bg-stone-950 text-white px-7 py-3 text-xs font-bold uppercase tracking-[0.16em] hover:bg-black transition-colors shrink-0"
                    >
                      Subscribe
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="consent"
                      required
                      className="h-3.5 w-3.5 accent-stone-900"
                    />
                    <label htmlFor="consent" className="text-[11px] text-stone-500 font-light">
                      I agree to receive emails from Archivist and accept the Privacy Policy.
                    </label>
                  </div>
                </form>
              )}
            </div>
          </div>
        </section>

      </main>

      <HomeFooter />
    </div>
  );
}
