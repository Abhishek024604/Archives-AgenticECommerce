import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { formatPrice } from "../utils/currency";

const images = {
  hero:
    "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=1800&q=90",
  coat:
    "https://images.unsplash.com/photo-1543076447-215ad9ba6923?auto=format&fit=crop&w=900&q=85",
  shirt:
    "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=900&q=85",
  boot:
    "https://images.unsplash.com/photo-1608256246200-53e635b5b65f?auto=format&fit=crop&w=900&q=85",
  fabric:
    "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&q=85",
  editorial:
    "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=950&q=85",
  film:
    "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=500&q=80",
};

const products = [
  {
    name: "Structured Wool Coat",
    price: 14800,
    image: images.coat,
  },
  {
    name: "Raw Linen Shirt",
    price: 7200,
    image: images.shirt,
    badge: "Bestseller",
  },
  {
    name: "Signature Chelsea Boot",
    price: 16900,
    image: images.boot,
  },
];

const navLinks = [
  ["Shop", "/products"],
  ["Communities", "/communities"],
  ["Journal", "/archives"],
  ["About", "/about"],
];

const footerGroups = [
  ["Shop", ["All Products", "New Arrivals", "Best Sellers", "Gift Cards"]],
  ["Company", ["About", "Journal", "Careers", "Contact"]],
  ["Customer Care", ["Shipping & Returns", "FAQs", "Sizing Guide", "Track Order"]],
];

export default function Home() {
  const [email, setEmail] = useState("");

  const subscribe = (event) => {
    event.preventDefault();
    if (!email.trim()) return;
    alert("Thanks for subscribing! (UI demo)");
    setEmail("");
  };

  return (
    <main className="min-h-screen bg-surface text-on-background">
      <Hero />
      <Essentials />
      <Editorial />
      <Newsletter email={email} setEmail={setEmail} subscribe={subscribe} />
    </main>
  );
}

function Hero() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const handleLogout = async () => {
    await logout();
    setIsMenuOpen(false);
    navigate("/");
  };

  return (
    <section className="relative min-h-[760px] overflow-hidden bg-inverse-surface text-white md:min-h-screen">
      <img
        src={images.hero}
        alt="Model wearing refined black tailoring"
        className="absolute inset-0 h-full w-full object-cover object-[62%_center] opacity-80"
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(13,12,10,0.92)_0%,rgba(13,12,10,0.55)_36%,rgba(13,12,10,0.18)_72%,rgba(13,12,10,0.45)_100%)]" />

      <nav className="relative z-20 flex items-center justify-between px-5 py-6 text-[10px] font-bold uppercase tracking-[0.22em] md:px-8">
        <Link to="/" className="font-headline text-xl font-normal tracking-[0.36em] md:text-2xl">
          Archivist
        </Link>
        <div className="hidden items-center gap-10 lg:flex">
          {navLinks.map(([label, to]) => (
            <Link key={label} to={to} className="transition-opacity hover:opacity-70">
              {label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-4 md:gap-7">
          <Link
            to="/products"
            aria-label="Search products"
            className="hidden items-center transition-opacity hover:opacity-70 sm:flex"
          >
            <span className="material-symbols-outlined text-xl">search</span>
          </Link>
          {user ? (
            <div className="relative hidden sm:block" ref={menuRef}>
              <button
                type="button"
                aria-label="Account menu"
                aria-expanded={isMenuOpen}
                onClick={() => setIsMenuOpen((open) => !open)}
                className="flex items-center transition-opacity hover:opacity-70"
              >
                <span className="material-symbols-outlined text-xl">person</span>
              </button>
              {isMenuOpen ? (
                <div className="absolute right-0 top-full mt-4 min-w-[220px] border border-white/10 bg-surface-container-lowest text-on-surface shadow-[0px_24px_48px_rgba(0,0,0,0.35)]">
                  <div className="border-b border-outline-variant/30 px-5 py-4">
                    <p className="font-headline text-lg normal-case tracking-normal text-on-background">
                      {user.name}
                    </p>
                    <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">
                      {user.role}
                    </p>
                  </div>
                  <div className="p-2">
                    {user.role === "seller" ? (
                      <Link
                        to="/seller"
                        onClick={() => setIsMenuOpen(false)}
                        className="flex w-full items-center justify-between px-3 py-3 text-left text-[11px] font-bold uppercase tracking-[0.2em] text-on-surface transition-colors hover:bg-surface-container-low"
                      >
                        Dashboard
                        <span className="material-symbols-outlined text-base">dashboard</span>
                      </Link>
                    ) : null}
                    <Link
                      to="/orders"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex w-full items-center justify-between px-3 py-3 text-left text-[11px] font-bold uppercase tracking-[0.2em] text-on-surface transition-colors hover:bg-surface-container-low"
                    >
                      My Orders
                      <span className="material-symbols-outlined text-base">receipt_long</span>
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center justify-between px-3 py-3 text-left text-[11px] font-bold uppercase tracking-[0.2em] text-on-surface transition-colors hover:bg-surface-container-low"
                    >
                      Logout
                      <span className="material-symbols-outlined text-base">logout</span>
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <Link
              to="/signup"
              aria-label="Account"
              className="hidden items-center transition-opacity hover:opacity-70 sm:flex"
            >
              <span className="material-symbols-outlined text-xl">person</span>
            </Link>
          )}
          <Link
            to="/cart"
            aria-label="Open cart"
            className="flex items-center transition-opacity hover:opacity-70"
          >
            <span className="material-symbols-outlined text-xl">shopping_bag</span>
          </Link>
        </div>
      </nav>

      <div className="relative z-10 flex min-h-[680px] items-center px-6 pb-20 pt-16 md:px-12 lg:px-32">
        <div className="hidden w-10 flex-col items-center gap-8 self-center text-[11px] text-white/80 md:flex">
          <span>01</span>
          <span className="h-14 w-px bg-white/55" />
          <span>02</span>
          <span>03</span>
          <span>04</span>
        </div>

        <div className="max-w-3xl md:ml-20">
          <p className="mb-8 text-[10px] font-bold uppercase tracking-[0.34em] text-white/85">
            Volume 01: The Archive
          </p>
          <h1 className="font-headline text-6xl leading-[0.9] tracking-normal text-[#f2eadf] md:text-8xl lg:text-[112px]">
            Timeless
            <br />
            Refinement
          </h1>
          <p className="mt-8 max-w-sm text-sm leading-6 text-white/70">
            Curated silhouettes. Conscious craftsmanship. Modern essentials for
            a life well lived.
          </p>
          <Link
            to="/products"
            className="mt-10 inline-flex items-center gap-7 border-b border-white/80 pb-2 text-[10px] font-bold uppercase tracking-[0.22em] transition-opacity hover:opacity-70"
          >
            Explore the Collection
            <span className="material-symbols-outlined text-lg">east</span>
          </Link>
        </div>
      </div>

      <Link
        to="/archives"
        className="absolute bottom-8 right-6 z-10 hidden w-40 bg-white/12 p-3 backdrop-blur-sm transition-transform hover:-translate-y-1 md:block"
      >
        <div className="relative aspect-[4/5] overflow-hidden">
          <img src={images.film} alt="Archivist short film still" className="h-full w-full object-cover grayscale" />
          <span className="absolute inset-0 m-auto flex h-11 w-11 items-center justify-center rounded-full border border-white/80 bg-black/20">
            <span className="material-symbols-outlined text-lg">play_arrow</span>
          </span>
        </div>
        <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.18em] text-white/85">
          Watch Film
        </p>
        <p className="text-xs text-white/65">02:15</p>
      </Link>
    </section>
  );
}

function Essentials() {
  return (
    <section className="bg-surface px-6 py-16 md:px-12 lg:px-24">
      <div className="mb-8 flex items-end justify-between gap-6">
        <div>
          <p className="mb-5 text-[10px] font-bold uppercase tracking-[0.28em] text-on-surface-variant">
            The Essentials
          </p>
          <h2 className="max-w-md font-headline text-4xl leading-[1.05] text-on-background md:text-5xl">
            Elevated staples.
            <br />
            Enduring style.
          </h2>
        </div>
        <Link
          to="/products"
          className="hidden items-center gap-8 border-b border-on-background pb-2 text-[10px] font-bold uppercase tracking-[0.18em] md:flex"
        >
          View All Products
          <span className="material-symbols-outlined text-lg">east</span>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.name} product={product} />
        ))}
        <Link
          to="/products"
          className="group flex min-h-[360px] flex-col border border-outline-variant bg-surface-container-low md:min-h-[420px]"
        >
          <div className="h-1/2 overflow-hidden">
            <img
              src={images.fabric}
              alt="Quiet luxury fabric detail"
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          </div>
          <div className="flex flex-1 flex-col justify-between p-7">
            <h3 className="font-headline text-2xl leading-tight">
              New pieces.
              <br />
              Quiet luxury.
            </h3>
            <span className="inline-flex items-center gap-8 text-[10px] font-bold uppercase tracking-[0.2em]">
              Discover Now
              <span className="material-symbols-outlined text-lg">east</span>
            </span>
          </div>
        </Link>
      </div>
    </section>
  );
}

function ProductCard({ product }) {
  return (
    <Link to="/products" className="group block">
      <div className="relative aspect-[4/5] overflow-hidden bg-surface-container">
        <img
          src={product.image}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        {product.badge ? (
          <span className="absolute left-4 top-4 border border-outline-variant bg-surface/80 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">
            {product.badge}
          </span>
        ) : null}
      </div>
      <div className="mt-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-[12px] font-bold uppercase tracking-[0.09em] text-on-background">
            {product.name}
          </h3>
          <p className="mt-1 text-xs text-on-surface-variant">{formatPrice(product.price)}</p>
        </div>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-outline transition-colors group-hover:bg-inverse-surface group-hover:text-white">
          <span className="material-symbols-outlined text-base">add</span>
        </span>
      </div>
    </Link>
  );
}

function Editorial() {
  return (
    <section className="bg-inverse-surface px-6 py-20 text-[#f2eadf] md:px-12 lg:px-24">
      <div className="grid items-center gap-16 lg:grid-cols-2">
        <div className="relative mx-auto w-full max-w-[520px]">
          <div className="relative z-10 border border-white/45 p-6">
            <img src={images.editorial} alt="Minimal editorial styling" className="aspect-[4/5] w-full object-cover grayscale" />
          </div>
          <div className="absolute -bottom-10 right-0 z-20 w-64 bg-surface p-8 text-on-background shadow-2xl md:-right-14">
            <p className="font-headline text-5xl leading-none">“</p>
            <p className="font-headline text-lg italic leading-snug">
              Luxury is not in the accumulation of things, but in the curation
              of experiences.
            </p>
            <p className="mt-7 text-[10px] font-bold uppercase tracking-[0.18em]">
              Archivist Journal
            </p>
          </div>
        </div>

        <div className="lg:pl-12">
          <p className="mb-7 text-[10px] font-bold uppercase tracking-[0.34em] text-white/70">
            The Editorial
          </p>
          <h2 className="font-headline text-5xl leading-[0.96] text-[#f2eadf] md:text-7xl">
            The art of
            <br />
            dressing well
          </h2>
          <p className="mt-8 max-w-sm text-sm leading-7 text-white/58">
            Explore the intersections of style, culture and craftsmanship
            through our journal. Stories that inspire a more intentional life.
          </p>
          <Link
            to="/archives"
            className="mt-10 inline-flex items-center gap-8 text-[10px] font-bold uppercase tracking-[0.22em] transition-opacity hover:opacity-70"
          >
            Read the Journal
            <span className="material-symbols-outlined text-lg">east</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

function Newsletter({ email, setEmail, subscribe }) {
  return (
    <section className="bg-surface px-6 py-16 text-center md:px-12">
      <p className="mb-5 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
        Join The Archive
      </p>
      <h2 className="mx-auto max-w-3xl font-headline text-3xl leading-tight md:text-5xl">
        Be the first to access limited editions,
        <br className="hidden md:block" />
        exclusive releases and thoughtful stories.
      </h2>
      <form onSubmit={subscribe} className="mx-auto mt-10 flex max-w-xl flex-col md:flex-row">
        <input
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="h-14 flex-1 border border-outline-variant bg-surface-container-low px-5 text-[10px] font-bold uppercase tracking-[0.18em] outline-none placeholder:text-outline"
          placeholder="Enter your email"
          type="email"
        />
        <button
          type="submit"
          className="h-14 bg-inverse-surface px-12 text-[10px] font-bold uppercase tracking-[0.18em] text-white transition-opacity hover:opacity-90"
        >
          Subscribe
        </button>
      </form>
    </section>
  );
}

export function LandingFooter() {
  return (
    <footer className="bg-inverse-surface px-6 py-14 text-white md:px-12">
      <div className="grid gap-12 border-b border-white/10 pb-12 lg:grid-cols-[1.2fr_2fr_0.8fr]">
        <div>
          <Link to="/" className="font-headline text-2xl tracking-[0.08em]">
            ARCHIVIST
          </Link>
          <p className="mt-4 text-xs text-white/55">Curated. Conscious. Timeless.</p>
        </div>

        <div className="grid gap-8 sm:grid-cols-3">
          {footerGroups.map(([title, links]) => (
            <div key={title}>
              <h3 className="mb-5 text-[10px] font-bold uppercase tracking-[0.24em] text-white/80">
                {title}
              </h3>
              <div className="space-y-3">
                {links.map((link) => (
                  <Link key={link} to="/products" className="block text-xs text-white/55 transition-colors hover:text-white">
                    {link}
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
            {["photo_camera", "push_pin", "smart_display", "radio"].map((icon) => (
              <Link key={icon} to="/archives" aria-label={icon} className="transition-opacity hover:opacity-70">
                <span className="material-symbols-outlined text-xl">{icon}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-5 pt-7 text-[10px] font-bold uppercase tracking-[0.18em] text-white/45 md:flex-row md:items-center md:justify-between">
        <p>© 2024 Archivist. All rights reserved.</p>
        <div className="flex flex-wrap gap-8">
          <Link to="/products">Privacy Policy</Link>
          <Link to="/products">Terms of Service</Link>
          <span>India (INR ₹)</span>
        </div>
      </div>
    </footer>
  );
}
