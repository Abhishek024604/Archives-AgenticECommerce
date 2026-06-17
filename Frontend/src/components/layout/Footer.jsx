import { Link } from "react-router-dom";

const footerGroups = [
  [
    "Shop",
    [
      ["All Products", "/products"],
      ["New Arrivals", "/products"],
      ["Best Sellers", "/products"],
      ["Gift Cards", "/products"],
    ],
  ],
  [
    "Company",
    [
      ["About", "/about"],
      ["Journal", "/archives"],
      ["Communities", "/communities"],
      ["Contact", "/about"],
    ],
  ],
  [
    "Customer Care",
    [
      ["Shipping & Returns", "/products"],
      ["FAQs", "/about"],
      ["Sizing Guide", "/products"],
      ["Track Order", "/orders"],
    ],
  ],
];

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-inverse-surface px-6 py-14 text-white md:px-12">
      <div className="grid gap-12 border-b border-white/10 pb-12 lg:grid-cols-[1.2fr_2fr_0.8fr]">
        <div>
          <Link to="/" className="font-headline text-2xl tracking-[0.08em]">
            ARCHIVIST
          </Link>
          <p className="mt-4 text-xs text-white/55">
            Curated. Conscious. Timeless.
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-3">
          {footerGroups.map(([title, links]) => (
            <div key={title}>
              <h3 className="mb-5 text-[10px] font-bold uppercase tracking-[0.24em] text-white/80">
                {title}
              </h3>
              <div className="space-y-3">
                {links.map(([label, to]) => (
                  <Link
                    key={label}
                    to={to}
                    className="block text-xs text-white/55 transition-colors hover:text-white"
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div>
          <h3 className="mb-5 text-[10px] font-bold uppercase tracking-[0.24em] text-white/80">
            Stay Connected
          </h3>
          <div className="flex gap-5 text-white/80">
            {["photo_camera", "push_pin", "smart_display", "radio"].map(
              (icon) => (
                <Link
                  key={icon}
                  to="/archives"
                  aria-label={icon}
                  className="transition-opacity hover:opacity-70"
                >
                  <span className="material-symbols-outlined text-xl">
                    {icon}
                  </span>
                </Link>
              ),
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-5 pt-7 text-[10px] font-bold uppercase tracking-[0.18em] text-white/45 md:flex-row md:items-center md:justify-between">
        <p>Copyright 2026 Archivist. All rights reserved.</p>
        <div className="flex flex-wrap gap-8">
          <Link to="/about">Privacy Policy</Link>
          <Link to="/about">Terms of Service</Link>
          <span>India (INR)</span>
        </div>
      </div>
    </footer>
  );
}
