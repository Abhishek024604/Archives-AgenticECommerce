import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  getCommunities,
  joinCommunity,
  leaveCommunity,
  deleteCommunity
} from "../api/community";
import CreateCommunityModal from "../components/CreateCommunityForm";
import CommunityChat from "../components/CommunityChat";
import AnnouncementBar from "../components/home/AnnouncementBar";
import HomeNavbar from "../components/home/HomeNavbar";
import HomeFooter from "../components/home/HomeFooter";
import { useAuth } from "../context/AuthContext";
import { getCommunityImage } from "../utils/communityImage";

const COMMUNITY_CATEGORIES = [
  "All",
  "Fashion",
  "Lifestyle",
  "Culture",
  "Art & Design",
  "Collectibles",
  "Other",
];

const TRUST_PILLARS = [
  {
    icon: "verified",
    title: "Curated Spaces",
    subtitle: "Quality over quantity",
  },
  {
    icon: "groups",
    title: "Meaningful Connections",
    subtitle: "Connect with like-minded people",
  },
  {
    icon: "draw",
    title: "Share & Inspire",
    subtitle: "Exchange ideas and inspiration",
  },
  {
    icon: "key",
    title: "Exclusive Access",
    subtitle: "Members-only drops & events",
  },
];

const FEATURED_DEMOS = [
  {
    _id: "demo-1",
    name: "Streetwear",
    description: "For the culture.",
    category: "Fashion",
    memberCount: 6,
    communityImage: "/assets/communityPage/streetwear.png",
    avatars: [
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80",
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80",
      "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=100&q=80",
    ],
  },
  {
    _id: "demo-2",
    name: "Western Dresses",
    description: "Let's go!",
    category: "Fashion",
    memberCount: 2,
    communityImage: "/assets/communityPage/westernwear.png",
    avatars: [
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=100&q=80",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80",
    ],
  },
  {
    _id: "demo-3",
    name: "Classical Indian",
    description: "Let's go classical",
    category: "Culture",
    memberCount: 8,
    communityImage: "/assets/communityPage/classicalIndian.png",
    avatars: [
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80",
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80",
    ],
  },
  {
    _id: "demo-4",
    name: "Minimalistic Lovers",
    description: "Get an u to become minimalist",
    category: "Art & Design",
    memberCount: 4,
    communityImage: "/assets/communityPage/minimalist.png",
    avatars: [
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=100&q=80",
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80",
    ],
  },
];

export default function Communities() {
  const { user } = useAuth();
  const [communities, setCommunities] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const featuredRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchCommunities = async (search = "") => {
    try {
      const res = await getCommunities(search);
      const nextCommunities = res.data.communities || [];
      setCommunities(nextCommunities);

      if (!selected && nextCommunities.length > 0) {
        setSelected(nextCommunities[0]);
      } else if (selected) {
        const refreshedSelected = nextCommunities.find(
          (c) => c._id === selected._id
        );
        setSelected(refreshedSelected || nextCommunities[0] || null);
      }
    } catch {
      setCommunities([]);
    }
  };

  useEffect(() => {
    fetchCommunities(debouncedSearch);
  }, [debouncedSearch]);

  const handleJoin = async (id) => {
    try {
      await joinCommunity(id);
      await fetchCommunities(debouncedSearch);
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to join community");
    }
  };

  const handleLeave = async (id) => {
    try {
      await leaveCommunity(id);
      await fetchCommunities(debouncedSearch);
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to leave community");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this community? This action cannot be undone.")) return;
    try {
      await deleteCommunity(id);
      setSelected(null);
      await fetchCommunities(debouncedSearch);
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to delete community");
    }
  };

  const selectCommunity = (community) => {
    setSelected(community);
    window.requestAnimationFrame(() => {
      document
        .getElementById("community-salon")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const scrollFeatured = (direction) => {
    if (featuredRef.current) {
      const offset = direction === "left" ? -340 : 340;
      featuredRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  };

  const featuredCommunitiesList = useMemo(() => {
    if (communities.length > 0) {
      return [...communities]
        .sort((a, b) => {
          const aCount = a.members?.length || a.memberCount || 1;
          const bCount = b.members?.length || b.memberCount || 1;
          return bCount - aCount;
        })
        .slice(0, 4);
    }
    return FEATURED_DEMOS;
  }, [communities]);

  const filteredCommunities = useMemo(() => {
    const list = communities.length > 0 ? communities : FEATURED_DEMOS;
    return list.filter((c) => {
      const matchesCategory =
        activeCategory === "All" ||
        (c.category || "Fashion").toLowerCase() === activeCategory.toLowerCase();

      return matchesCategory;
    }).slice(0, 8);
  }, [communities, activeCategory]);

  return (
    <div className="min-h-screen bg-white text-stone-900 font-sans selection:bg-stone-900 selection:text-white">
      {/* Top Announcement Bar */}
      <AnnouncementBar />

      {/* Main Navbar */}
      <HomeNavbar />

      <main className="mx-auto max-w-[1536px] px-4 sm:px-6 lg:px-8 py-8 space-y-16">
        
        {/* 1. Hero Header Section */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-6 pr-0 lg:pr-6">
            <h1 className="font-headline text-4xl sm:text-5xl lg:text-6xl font-normal leading-[1.08] text-stone-950">
              The Archivist Guild
            </h1>
            <p className="mt-4 font-headline italic text-lg sm:text-xl text-stone-600">
              A collective for discerning minds.
            </p>
            <p className="mt-3 text-xs sm:text-sm text-stone-500 font-light leading-relaxed max-w-md">
              Join curated circles of artisans, collectors, and style enthusiasts.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() =>
                  document
                    .getElementById("browse-section")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
                className="bg-stone-950 text-white px-7 py-3 text-xs font-bold uppercase tracking-[0.18em] transition-transform hover:scale-[1.02] hover:bg-black"
              >
                Explore Communities
              </button>
              <button
                type="button"
                onClick={() => setShowModal(true)}
                className="border border-stone-400 bg-white text-stone-900 px-7 py-3 text-xs font-bold uppercase tracking-[0.18em] transition-colors hover:border-stone-900 hover:bg-stone-50"
              >
                Create Community
              </button>
            </div>
          </div>

          {/* Right Hero Image Collage */}
          <div className="lg:col-span-6 grid grid-cols-12 gap-4">
            <div className="col-span-7 aspect-[4/5] overflow-hidden rounded-none bg-stone-200 shadow-xs">
              <img
                src="/assets/communityPage/streetwear.png"
                alt="Archivist Guild Member"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="col-span-5 flex flex-col gap-4">
              <div className="aspect-square overflow-hidden rounded-none bg-stone-200 shadow-xs">
                <img
                  src="/assets/communityPage/minimalist.png"
                  alt="Flatlay accessories"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="aspect-[4/3] overflow-hidden rounded-none bg-stone-200 shadow-xs">
                <img
                  src="/assets/communityPage/vintage.png"
                  alt="Reading journal"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* 2. Trust Pillars Bar */}
        <section className="bg-[#F9F9F8] py-8 px-6 rounded-none border border-stone-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center md:text-left">
            {TRUST_PILLARS.map((pillar) => (
              <div key={pillar.title} className="flex items-center gap-3 justify-center md:justify-start">
                <span className="material-symbols-outlined text-2xl text-stone-700 shrink-0">
                  {pillar.icon}
                </span>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-[0.08em] text-stone-900 leading-tight">
                    {pillar.title}
                  </h4>
                  <p className="mt-0.5 text-[11px] text-stone-500">
                    {pillar.subtitle}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 3. Featured Communities */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-headline text-2xl sm:text-3xl font-normal text-stone-950">
              Featured Communities
            </h2>

            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() =>
                  document
                    .getElementById("browse-section")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
                className="text-xs font-semibold uppercase tracking-wider text-stone-700 hover:text-black"
              >
                View all
              </button>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => scrollFeatured("left")}
                  className="flex h-8 w-8 items-center justify-center rounded-none border border-stone-300 text-stone-700 transition-colors hover:border-black hover:bg-stone-900 hover:text-white"
                  aria-label="Scroll left"
                >
                  <span className="material-symbols-outlined text-sm">chevron_left</span>
                </button>
                <button
                  type="button"
                  onClick={() => scrollFeatured("right")}
                  className="flex h-8 w-8 items-center justify-center rounded-none border border-stone-300 text-stone-700 transition-colors hover:border-black hover:bg-stone-900 hover:text-white"
                  aria-label="Scroll right"
                >
                  <span className="material-symbols-outlined text-sm">chevron_right</span>
                </button>
              </div>
            </div>
          </div>

          <div
            ref={featuredRef}
            className="flex gap-6 overflow-x-auto pb-4 scrollbar-none scroll-smooth snap-x snap-mandatory"
            style={{ scrollbarWidth: "none" }}
          >
            {featuredCommunitiesList.map((item) => (
              <div
                key={item._id}
                className="w-[280px] sm:w-[310px] shrink-0 snap-start flex flex-col rounded-none overflow-hidden border border-stone-300 bg-[#F6F4F0] p-4 transition-all hover:shadow-md"
              >
                <div className="relative aspect-[3/4] w-full overflow-hidden rounded-none bg-stone-200">
                  <img
                    src={getCommunityImage(item)}
                    alt={item.name}
                    className="h-full w-full object-cover"
                  />
                  <span className="absolute top-3 left-3 bg-stone-900/80 backdrop-blur-xs text-white px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest rounded-none">
                    {item.members?.length || item.memberCount || 1} MEMBERS
                  </span>
                </div>

                <div className="mt-4 flex flex-col flex-1 justify-between">
                  <div>
                    <h3 className="font-headline text-xl font-medium text-stone-950">
                      {item.name}
                    </h3>
                    <p className="mt-1 text-xs text-stone-600 font-light line-clamp-2">
                      {item.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-stone-300/60 flex items-center justify-between">
                    <div className="flex -space-x-2 overflow-hidden">
                      {item.avatars?.map((img, i) => (
                        <img
                          key={i}
                          src={img}
                          alt=""
                          className="inline-block h-7 w-7 rounded-none ring-2 ring-white object-cover"
                        />
                      ))}
                      <span className="flex h-7 w-7 items-center justify-center rounded-none bg-stone-200 text-[10px] font-bold text-stone-700 ring-2 ring-white">
                        +{(item.members?.length || item.memberCount || 1) - (item.avatars?.length || 0)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => selectCommunity(item)}
                      className="border border-stone-800 bg-white px-4 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-stone-900 transition-colors hover:bg-stone-950 hover:text-white"
                    >
                      Enter Circle
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 4. Browse All Communities Section */}
        <section id="browse-section" className="pt-4">
          <h2 className="font-headline text-2xl sm:text-3xl font-normal text-stone-950 mb-6">
            Browse All Communities
          </h2>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-200 pb-4 mb-8">
            {/* Category Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {COMMUNITY_CATEGORIES.map((cat) => {
                const isActive = activeCategory.toLowerCase() === cat.toLowerCase();

                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategory(cat)}
                    className={`shrink-0 px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-all border-b-2 ${
                      isActive
                        ? "border-stone-950 text-stone-950 font-bold"
                        : "border-transparent text-stone-500 hover:text-stone-900"
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            {/* Search Input Box */}
            <div className="relative w-full md:w-72">
              <input
                type="text"
                placeholder="Search communities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full border border-stone-300 bg-stone-50 px-3 py-2 text-xs text-stone-900 outline-none focus:border-stone-900"
              />
              <span className="material-symbols-outlined absolute right-2.5 top-2 text-base text-stone-400">
                search
              </span>
            </div>
          </div>

          {/* Communities Grid Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredCommunities.map((c) => (
              <div
                key={c._id}
                className="flex items-start gap-4 p-4 border border-stone-200 rounded-none bg-[#F9F9F8] transition-all hover:bg-white hover:shadow-sm"
              >
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-none bg-stone-200">
                  <img
                    src={getCommunityImage(c)}
                    alt={c.name}
                    className="h-full w-full object-cover"
                  />
                </div>

                <div className="flex-1 min-w-0 flex flex-col justify-between h-full">
                  <div>
                    <h3 className="font-headline text-base font-medium text-stone-950 truncate">
                      {c.name}
                    </h3>
                    <p className="text-xs text-stone-500 line-clamp-1 mt-0.5">
                      {c.description}
                    </p>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-[10px] font-bold text-stone-600 uppercase tracking-wider">
                    <span>{c.members?.length || c.memberCount || 1} Members</span>
                    <button
                      type="button"
                      onClick={() => selectCommunity(c)}
                      className="text-stone-900 font-bold hover:underline"
                    >
                      Enter →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link
              to="/communities/all"
              className="inline-block border border-stone-300 bg-white px-8 py-3 text-xs font-bold uppercase tracking-[0.18em] text-stone-900 hover:bg-stone-950 hover:text-white transition-colors"
            >
              Discover More Communities
            </Link>
          </div>
        </section>

        {/* 5. Community Salon & Community Room Chat */}
        <section id="community-salon" className="pt-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-headline text-2xl sm:text-3xl font-normal text-stone-950">
              Community Salon
            </h2>
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              All circles
            </span>
          </div>

          <div className="overflow-hidden rounded-none border border-stone-300 bg-white shadow-xs">
            <div className="flex flex-col lg:flex-row h-[800px] lg:h-[700px]">
              
              {/* Left Circles Selection Sidebar */}
              <aside className="w-full lg:w-5/12 flex flex-col border-b lg:border-b-0 lg:border-r border-stone-200 bg-[#FAFAFA] h-[40%] lg:h-full min-h-0">
                <div className="border-b border-stone-200 p-5 bg-white">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400">
                    All Circles ({communities.length})
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {(communities.length > 0 ? communities : FEATURED_DEMOS).map((circle) => {
                    const isSelected = selected?._id === circle._id;

                    return (
                      <button
                        key={circle._id}
                        type="button"
                        onClick={() => setSelected(circle)}
                        className={`flex w-full items-center justify-between p-4 rounded-none text-left transition-all ${
                          isSelected
                            ? "bg-white border border-stone-300 shadow-2xs"
                            : "hover:bg-stone-100/80 border border-transparent"
                        }`}
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-none bg-stone-200 font-headline text-lg font-bold text-stone-800">
                            {circle.name?.slice(0, 1) || "C"}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-headline text-base font-semibold text-stone-950 truncate">
                              {circle.name}
                            </h4>
                            <p className="text-xs text-stone-500 truncate mt-0.5">
                              {circle.description}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 ml-2">
                          <span className="text-[10px] font-medium text-stone-400">
                            {circle.members?.length || circle.memberCount || 1} Active
                          </span>
                          <span className="material-symbols-outlined text-base text-stone-400">
                            chevron_right
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </aside>

              {/* Right Live Chat Workspace */}
              <div className="w-full lg:w-7/12 flex flex-col bg-white h-[60%] lg:h-full min-h-0">
                {selected ? (
                  <CommunityChat
                    communityId={selected._id}
                    Name={selected.name}
                    onJoin={() => handleJoin(selected._id)}
                    onLeave={() => handleLeave(selected._id)}
                    onDelete={() => handleDelete(selected._id)}
                    description={selected.description}
                    memberCount={selected.members?.length || selected.memberCount || 1}
                    isAdmin={user && (selected.createdBy?._id === user._id || selected.createdBy === user._id)}
                    isMember={user && selected.members?.includes(user._id)}
                  />
                ) : (
                  <div className="flex flex-1 items-center justify-center p-12 text-center text-xs text-stone-400">
                    Select a circle on the left to start conversing.
                  </div>
                )}
              </div>

            </div>
          </div>
        </section>

      </main>

      {/* Creation Modal */}
      {showModal && (
        <CreateCommunityModal
          close={() => setShowModal(false)}
          refresh={() => fetchCommunities(debouncedSearch)}
        />
      )}

      {/* Footer */}
      <HomeFooter />
    </div>
  );
}
