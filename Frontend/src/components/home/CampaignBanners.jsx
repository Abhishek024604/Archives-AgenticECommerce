import { Link } from "react-router-dom";

const CAMPAIGNS = [
  {
    title: "Timeless Craftsmanship",
    cta: "Explore Men →",
    image: "/assets/categoryImages/men.png",
    link: "/products?category=men",
    darkOverlay: true,
  },
  {
    title: "New Season New You",
    cta: "Explore Women →",
    image: "/assets/categoryImages/women.png",
    link: "/products?category=women",
    darkOverlay: false,
  },
  {
    title: "Icons of Luxury",
    cta: "Explore Perfumes →",
    image: "/assets/categoryImages/perfume.png",
    link: "/products?category=perfumes",
    darkOverlay: true,
  },
];

export default function CampaignBanners() {
  return (
    <section className="bg-white py-10 border-b border-stone-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {CAMPAIGNS.map((item) => (
            <Link
              key={item.title}
              to={item.link}
              className="group relative flex h-64 sm:h-72 w-full overflow-hidden rounded-md bg-stone-900"
            >
              <img
                src={item.image}
                alt={item.title}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-85"
              />

              {/* Gradient Overlay for text clarity */}
              <div
                className={`absolute inset-0 ${
                  item.darkOverlay
                    ? "bg-gradient-to-t from-black/80 via-black/30 to-transparent"
                    : "bg-gradient-to-t from-amber-950/70 via-stone-900/30 to-transparent"
                }`}
              />

              {/* Text Content */}
              <div className="absolute inset-0 flex flex-col justify-end p-6 text-white z-10">
                <h3 className="font-headline text-2xl font-normal leading-tight">
                  {item.title}
                </h3>
                <span className="mt-3 text-[11px] font-bold uppercase tracking-[0.2em] text-stone-200 group-hover:text-white transition-colors">
                  {item.cta}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
