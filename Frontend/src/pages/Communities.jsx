import { useEffect, useState } from "react";
import {
  getCommunities,
  joinCommunity,
  leaveCommunity,
} from "../api/community";
import CreateCommunityModal from "../components/CreateCommunityForm";
import CommunityChat from "../components/CommunityChat";

const interestIcons = ["texture", "eco", "handyman", "grid_view"];

export default function Communities() {
  const [communities, setCommunities] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchCommunities();
  }, []);

  const fetchCommunities = async () => {
    const res = await getCommunities();
    const nextCommunities = res.data.communities || [];
    setCommunities(nextCommunities);

    if (!selected && nextCommunities.length > 0) {
      setSelected(nextCommunities[0]);
    } else if (selected) {
      const refreshedSelected = nextCommunities.find(
        (community) => community._id === selected._id
      );
      setSelected(refreshedSelected || nextCommunities[0] || null);
    }
  };

  const handleJoin = async (id) => {
    await joinCommunity(id);
    await fetchCommunities();
  };

  const handleLeave = async (id) => {
    await leaveCommunity(id);
    await fetchCommunities();
  };

  const selectCommunity = (community) => {
    setSelected(community);
    window.requestAnimationFrame(() => {
      document
        .getElementById("community-salon")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const featured = communities.slice(0, 2);

  return (
    <div className="bg-surface text-on-background font-body antialiased">
      <header className="pt-24 pb-16 px-6 md:px-12 text-center max-w-4xl mx-auto">
        <h1 className="font-headline text-5xl md:text-7xl font-bold tracking-tighter text-on-background mb-6">
          The Archivist Guild
        </h1>
        <p className="font-headline italic text-xl md:text-2xl text-secondary mb-2">
          A Collective for Discerning Minds.
        </p>
        <p className="font-label text-xs uppercase tracking-[0.2em] text-on-surface-variant font-bold">
          Join curated circles of artisans, collectors, and enthusiasts.
        </p>
      </header>

      <main className="max-w-[1440px] mx-auto px-6 md:px-12 pb-32">
        <section className="mb-32">
          <div className="flex items-center justify-between mb-12 gap-6">
            <h2 className="font-label text-xs uppercase tracking-[0.3em] font-bold text-on-surface-variant">
              Featured Communities
            </h2>
            <button
              onClick={() => setShowModal(true)}
              className="border border-outline px-5 py-3 text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-surface-container-low transition-colors"
            >
              Create Community
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-y-24 md:gap-x-12">
            {featured[0] ? (
              <article className="md:col-span-7 group">
                <div className="relative overflow-hidden bg-surface-container-low aspect-[4/5] md:aspect-[16/10]">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.8),transparent_32%),linear-gradient(135deg,rgba(47,52,48,0.08),transparent_55%)]" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="font-headline text-[7rem] md:text-[11rem] leading-none tracking-tighter text-on-surface/10">
                      {featured[0].name?.slice(0, 1) || "A"}
                    </span>
                  </div>
                  <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/20 to-transparent" />
                </div>
                <div className="mt-8 md:pl-16">
                  <span className="font-label text-[10px] tracking-[0.2em] text-on-surface-variant font-bold uppercase">
                    {featured[0].members?.length || 0} Members
                  </span>
                  <h3 className="font-headline text-4xl mt-2 mb-4 group-hover:translate-x-2 transition-transform duration-500">
                    {featured[0].name}
                  </h3>
                  <p className="font-body text-on-surface-variant max-w-md leading-relaxed mb-6">
                    {featured[0].description}
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <button
                      onClick={() => selectCommunity(featured[0])}
                      className="bg-primary text-on-primary px-8 py-4 font-label text-xs uppercase tracking-widest hover:opacity-90 transition-opacity"
                    >
                      Enter the Circle
                    </button>
                    <button
                      onClick={() => handleJoin(featured[0]._id)}
                      className="border border-outline text-on-surface px-8 py-4 font-label text-xs uppercase tracking-widest hover:bg-surface-container-low transition-colors"
                    >
                      Join
                    </button>
                  </div>
                </div>
              </article>
            ) : null}

            {featured[1] ? (
              <article className="md:col-span-5 group">
                <div className="relative overflow-hidden bg-surface-container-low aspect-[4/5]">
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(47,52,48,0.04),transparent_50%),repeating-linear-gradient(90deg,transparent,transparent_24px,rgba(47,52,48,0.05)_24px,rgba(47,52,48,0.05)_25px)]" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="font-headline text-[6rem] md:text-[9rem] leading-none tracking-tighter text-on-surface/10">
                      {featured[1].name?.slice(0, 1) || "B"}
                    </span>
                  </div>
                </div>
                <div className="mt-8">
                  <span className="font-label text-[10px] tracking-[0.2em] text-on-surface-variant font-bold uppercase">
                    {featured[1].members?.length || 0} Members
                  </span>
                  <h3 className="font-headline text-3xl mt-2 mb-4 group-hover:translate-x-2 transition-transform duration-500">
                    {featured[1].name}
                  </h3>
                  <p className="font-body text-on-surface-variant leading-relaxed mb-6">
                    {featured[1].description}
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <button
                      onClick={() => selectCommunity(featured[1])}
                      className="bg-primary text-on-primary px-8 py-4 font-label text-xs uppercase tracking-widest hover:opacity-90 transition-opacity"
                    >
                      Enter
                    </button>
                    <button
                      onClick={() => handleJoin(featured[1]._id)}
                      className="border border-outline text-on-surface px-8 py-4 font-label text-xs uppercase tracking-widest hover:bg-surface-container-low transition-colors"
                    >
                      Join
                    </button>
                  </div>
                </div>
              </article>
            ) : null}
          </div>
        </section>

        <section className="py-15 flex flex-col items-center text-center">
          <span className="material-symbols-outlined text-4xl text-outline-variant mb-2">
            format_quote
          </span>
          <p className="font-headline text-3xl md:text-4xl text-secondary max-w-3xl leading-snug italic px-6">
            "Curation is the antidote to the digital noise. We do not gather
            for the sake of volume, but for the clarity of craftsmanship."
          </p>
          <div className=" h-1 w-px bg-outline-variant/30" />
        </section>

        <section className="mt-24">
          <div className="mb-12">
            <h2 className="font-label text-xs uppercase tracking-[0.3em] font-bold text-on-surface-variant">
              Browse Communities
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0.5 bg-outline-variant/15 border border-outline-variant/15">
            {communities.length === 0 ? (
              <div className="col-span-full bg-surface p-10 text-on-surface-variant">
                No communities available yet.
              </div>
            ) : (
              communities.map((community, index) => {
                const icon = interestIcons[index % interestIcons.length];

                return (
                  <div
                    key={community._id}
                    className="bg-surface p-10 hover:bg-surface-container-lowest transition-colors group"
                  >
                    <div className="h-12 w-12 flex items-center justify-center bg-surface-container-low mb-8">
                      <span className="material-symbols-outlined text-primary-dim">
                        {icon}
                      </span>
                    </div>
                    <h4 className="font-headline text-xl mb-4">{community.name}</h4>
                    <p className="font-body text-sm text-on-surface-variant leading-relaxed mb-8 min-h-[4rem]">
                      {community.description}
                    </p>
                    <div className="flex items-center justify-between mt-auto">
                      <span className="font-label text-[9px] tracking-widest text-outline uppercase font-bold">
                        {community.members?.length || 0} Active
                      </span>
                      <button
                        onClick={() => selectCommunity(community)}
                        className="text-primary-dim font-label text-[10px] uppercase tracking-widest font-bold border-b border-primary-dim/30 hover:border-primary-dim pb-0.5 transition-all"
                      >
                        Join
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        <section id="community-salon" className="mt-32">
          <div className="flex items-center justify-between mb-8 gap-6">
            <div>
              <h2 className="font-label text-xs uppercase tracking-[0.3em] font-bold text-on-surface-variant">
                Community Salon
              </h2>
            </div>
          </div>

          <div className="overflow-hidden rounded-[4px] border border-outline-variant/30 bg-surface-container-lowest shadow-[0_24px_80px_rgba(47,52,48,0.06)]">
            <div className="grid grid-cols-1 lg:grid-cols-[370px_minmax(0,1fr)]">
              <aside className="flex h-[680px] min-h-0 flex-col border-b border-outline-variant/20 bg-surface-container-lowest lg:border-b-0 lg:border-r">
                <div className="shrink-0 border-b border-outline-variant/20 px-8 py-7">
                  <p className="font-label text-[10px] uppercase tracking-[0.28em] font-bold text-on-surface-variant">
                    All Circles
                  </p>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto p-2">
                  {communities.length === 0 ? (
                    <div className="px-6 py-8 text-sm text-on-surface-variant">
                      No circles available yet.
                    </div>
                  ) : (
                    communities.map((community) => {
                      const isSelected = selected?._id === community._id;
                      const initial = community.name?.slice(0, 1) || "?";

                      return (
                        <button
                          key={community._id}
                          onClick={() => setSelected(community)}
                          className={`group flex w-full items-start gap-4 rounded-[3px] px-5 py-5 text-left transition-colors ${
                            isSelected
                              ? "bg-[linear-gradient(90deg,#edebe5,rgba(237,235,229,0.35))]"
                              : "hover:bg-surface-container-low"
                          }`}
                        >
                          <span
                            className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border font-headline text-lg ${
                              isSelected
                                ? "border-primary/20 bg-surface text-on-background"
                                : "border-outline-variant/25 bg-surface-container-low text-on-surface-variant"
                            }`}
                          >
                            {initial}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-headline text-lg text-on-background">
                              {community.name}
                            </span>
                            <span className="mt-1 block line-clamp-2 text-sm leading-relaxed text-on-surface-variant">
                              {community.description}
                            </span>
                            <span className="mt-3 block font-label text-[9px] font-bold uppercase tracking-[0.18em] text-outline">
                              {community.members?.length || 0} active members
                            </span>
                          </span>
                          <span
                            className={`material-symbols-outlined mt-2 text-base transition-transform ${
                              isSelected
                                ? "text-primary"
                                : "text-outline group-hover:translate-x-1"
                            }`}
                          >
                            arrow_forward
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              </aside>

              <div className="h-[680px] min-h-0 bg-surface">
                {selected ? (
                  <CommunityChat
                    communityId={selected._id}
                    Name={selected.name}
                    onJoin={() => handleJoin(selected._id)}
                    onLeave={() => handleLeave(selected._id)}
                    description={selected.description}
                    memberCount={selected.members?.length || 0}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center px-8 text-center text-on-surface-variant">
                    Select a community to start chatting.
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      {showModal ? (
        <CreateCommunityModal
          close={() => setShowModal(false)}
          refresh={fetchCommunities}
        />
      ) : null}
    </div>
  );
}
