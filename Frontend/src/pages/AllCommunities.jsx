import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { getCommunities } from "../api/community";
import AnnouncementBar from "../components/home/AnnouncementBar";
import HomeNavbar from "../components/home/HomeNavbar";
import HomeFooter from "../components/home/HomeFooter";
import { getCommunityImage } from "../utils/communityImage";

const COMMUNITY_CATEGORIES = [
  "All Categories",
  "Fashion",
  "Lifestyle",
  "Culture",
  "Art & Design",
  "Collectibles",
  "Other",
];

const FALLBACK_COMMUNITIES = [
  {
    _id: "demo-1",
    name: "Streetwear",
    description: "For the culture.",
    category: "Fashion",
    memberCount: 6,
    communityImage: "/assets/communityPage/streetwear.png",
    members: [1, 2, 3, 4, 5, 6],
  },
  {
    _id: "demo-2",
    name: "Western Dresses",
    description: "Let's go!",
    category: "Fashion",
    memberCount: 2,
    communityImage: "/assets/communityPage/westernwear.png",
    members: [1, 2],
  },
  {
    _id: "demo-3",
    name: "Classical Indian",
    description: "Let's go classical",
    category: "Culture",
    memberCount: 8,
    communityImage: "/assets/communityPage/classicalIndian.png",
    members: [1, 2, 3, 4, 5, 6, 7, 8],
  },
  {
    _id: "demo-4",
    name: "Minimalistic Lovers",
    description: "Get an u to become minimalist",
    category: "Art & Design",
    memberCount: 4,
    communityImage: "/assets/communityPage/minimalist.png",
    members: [1, 2, 3, 4],
  },
  {
    _id: "demo-5",
    name: "Vintage Dresses",
    description: "Reminiscing old eras...",
    category: "Fashion",
    memberCount: 5,
    communityImage: "/assets/communityPage/vintage.png",
    members: [1, 2, 3, 4, 5],
  },
  {
    _id: "demo-6",
    name: "Formal Section",
    description: "Being professional...",
    category: "Fashion",
    memberCount: 3,
    communityImage: "/assets/communityPage/formal.png",
    members: [1, 2, 3],
  },
  {
    _id: "demo-7",
    name: "Sneakerheads",
    description: "Kick game strong",
    category: "Collectibles",
    memberCount: 7,
    communityImage: "/assets/communityPage/streetwear.png",
    members: [1, 2, 3, 4, 5, 6, 7],
  },
  {
    _id: "demo-8",
    name: "Watch Collectors",
    description: "Time is art.",
    category: "Collectibles",
    memberCount: 6,
    communityImage: "/assets/communityPage/vintage.png",
    members: [1, 2, 3, 4, 5, 6],
  },
];

export default function AllCommunities() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get("category") || "All Categories";

  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(true);

  useEffect(() => {
    let active = true;

    getCommunities()
      .then((res) => {
        if (active) {
          const list = res.data?.communities || [];
          setCommunities(list);
        }
      })
      .catch(() => {
        if (active) setCommunities([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const filteredCommunities = useMemo(() => {
    const list = communities.length > 0 ? communities : FALLBACK_COMMUNITIES;
    return list.filter((c) => {
      const matchesCategory =
        selectedCategory === "All Categories" ||
        (c.category || "Fashion").toLowerCase() === selectedCategory.toLowerCase();
      const matchesSearch =
        !searchQuery.trim() ||
        (c.name || "").toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        (c.description || "").toLowerCase().includes(searchQuery.toLowerCase().trim());

      return matchesCategory && matchesSearch;
    });
  }, [communities, selectedCategory, searchQuery]);

  const handleSelectCategory = (cat) => {
    setSelectedCategory(cat);
    if (cat && cat !== "All Categories") {
      setSearchParams({ category: cat }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  };

  const clearAllFilters = () => {
    setSelectedCategory("All Categories");
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
          <Link to="/communities" className="hover:text-stone-900 transition-colors">
            Communities
          </Link>
          <span>›</span>
          <span className="text-stone-900 font-semibold">All Communities</span>
        </nav>

        {/* Page Header Title */}
        <div className="border-b border-stone-200 pb-6">
          <h1 className="font-headline text-4xl sm:text-5xl lg:text-6xl font-normal text-stone-950">
            Explore All Communities
          </h1>
          <p className="mt-3 text-xs sm:text-sm text-stone-500 font-light max-w-xl leading-relaxed">
            Join curated circles of artisans, collectors, and style enthusiasts across all categories.
          </p>
        </div>

        {/* Controls Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-200 pb-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center gap-2 border border-stone-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wider text-stone-800 hover:border-stone-900 transition-colors"
            >
              <span className="material-symbols-outlined text-base">tune</span>
              <span>{showFilters ? "Hide Filters" : "Show Filters"}</span>
            </button>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium text-stone-600">
            <span>{filteredCommunities.length} Communities</span>
            {selectedCategory !== "All Categories" && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="text-stone-950 font-bold hover:underline"
              >
                Clear Category Filter
              </button>
            )}
          </div>
        </div>

        {/* Main Content (Side Panel + 4-Column Community Grid) */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* Side Panel for Filters based on Category */}
          {showFilters && (
            <aside className="w-full lg:w-64 shrink-0 space-y-6 border border-stone-200/80 bg-[#FAFAFA] p-5 rounded-none">
              
              {/* Search Box */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-stone-900 mb-3">
                  Search Circles
                </h3>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full border border-stone-300 bg-white p-2.5 text-xs text-stone-900 outline-none focus:border-stone-900"
                  />
                </div>
              </div>

              {/* Category Filter Selection */}
              <div className="border-t border-stone-200 pt-5">
                <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-stone-900 mb-3">
                  Filter by Category
                </h3>
                <div className="space-y-1 text-xs">
                  {COMMUNITY_CATEGORIES.map((cat) => {
                    const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase();

                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => handleSelectCategory(cat)}
                        className={`flex w-full items-center justify-between py-2 px-3 rounded-none transition-all ${
                          isSelected
                            ? "bg-stone-950 font-bold text-white shadow-xs"
                            : "text-stone-700 hover:bg-stone-200/70 hover:text-black"
                        }`}
                      >
                        <span>{cat}</span>
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

          {/* Main 4-Column Community Grid */}
          <div className="flex-1 min-w-0 w-full">
            {loading ? (
              <div className="py-20 text-center text-xs text-stone-500 font-medium">
                Loading all communities from database...
              </div>
            ) : filteredCommunities.length === 0 ? (
              <div className="border border-stone-200 bg-[#FAFAFA] py-16 px-6 text-center rounded-none">
                <h3 className="font-headline text-2xl text-stone-900">
                  No communities found
                </h3>
                <p className="mt-2 text-xs text-stone-500 max-w-sm mx-auto">
                  Try adjusting the category filter or search query.
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
                {filteredCommunities.map((c) => (
                  <div
                    key={c._id}
                    className="group flex flex-col justify-between rounded-none overflow-hidden bg-white border border-stone-200 p-4 transition-all hover:shadow-md"
                  >
                    {/* Community Cover Thumbnail */}
                    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-none bg-stone-200">
                      <img
                        src={getCommunityImage(c)}
                        alt={c.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />

                      <span className="absolute top-2.5 left-2.5 bg-stone-900/80 backdrop-blur-xs text-white px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest rounded-none">
                        {c.category || "Fashion"}
                      </span>
                    </div>

                    {/* Community Details */}
                    <div className="mt-3 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-headline text-lg font-medium text-stone-950 line-clamp-1 group-hover:text-stone-600 transition-colors">
                          {c.name}
                        </h3>
                        <p className="mt-1.5 text-xs text-stone-600 font-light line-clamp-2 leading-relaxed">
                          {c.description}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-[10px] font-bold text-stone-600 uppercase tracking-wider">
                        <span>{c.members?.length || c.memberCount || 1} Members</span>
                        <button
                          type="button"
                          onClick={() => navigate("/communities")}
                          className="bg-stone-950 text-white px-3.5 py-1.5 rounded-none text-[9px] font-bold uppercase tracking-wider transition-colors hover:bg-black"
                        >
                          Enter Circle
                        </button>
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
