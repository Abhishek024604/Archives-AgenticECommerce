import { Link } from "react-router-dom";

const aboutImages = {
  hero:
    "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=1800&q=90",
  story:
    "https://images.unsplash.com/photo-1528459105426-b9548367069b?auto=format&fit=crop&w=900&q=85",
  craft:
    "https://images.unsplash.com/photo-1603252109303-2751441dd157?auto=format&fit=crop&w=1200&q=85",
};

const navLinks = [
  ["Shop", "/products"],
  ["Communities", "/communities"],
  ["Journal", "/archives"],
  ["About", "/about"],
];

const values = [
  {
    icon: "diamond",
    title: "Timeless Design",
    text: "Pieces that transcend seasons and trends.",
  },
  {
    icon: "eco",
    title: "Conscious Choices",
    text: "Mindful sourcing, ethical partners, better tomorrow.",
  },
  {
    icon: "groups",
    title: "Community First",
    text: "A global community that shares our values.",
  },
  {
    icon: "explore",
    title: "Meaningful Stories",
    text: "We believe in the power of stories to inspire change.",
  },
];

export default function About() {
  return (
    <main className="min-h-screen bg-surface text-on-background">
      <AboutHero />
      <Story />
      <Values />
      <Craft />
    </main>
  );
}

function AboutHero() {
  return (
    <section className="relative min-h-[720px] overflow-hidden bg-inverse-surface text-white">
      <img
        src={aboutImages.hero}
        alt="Archivist editorial portrait in tailoring"
        className="absolute inset-0 h-full w-full object-cover object-[62%_center] grayscale"
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(14,13,11,0.92)_0%,rgba(14,13,11,0.72)_42%,rgba(14,13,11,0.22)_78%,rgba(14,13,11,0.6)_100%)]" />

      <nav className="relative z-20 flex items-center justify-between px-5 py-6 text-[10px] font-bold uppercase tracking-[0.22em] md:px-10">
        <Link to="/" className="font-headline text-xl font-normal tracking-[0.36em] md:text-2xl">
          Archivist
        </Link>
        <div className="hidden items-center gap-10 lg:flex">
          {navLinks.map(([label, to]) => (
            <Link
              key={label}
              to={to}
              className={`pb-2 transition-opacity hover:opacity-70 ${
                label === "About"
                  ? "font-bold text-white"
                  : "font-normal text-white/65"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-5 md:gap-8">
          <Link to="/products" aria-label="Search products" className="transition-opacity hover:opacity-70">
            <span className="material-symbols-outlined text-xl">search</span>
          </Link>
          <Link to="/signup" aria-label="Account" className="transition-opacity hover:opacity-70">
            <span className="material-symbols-outlined text-xl">person</span>
          </Link>
          <Link
            to="/cart"
            aria-label="Open cart"
            className="transition-opacity hover:opacity-70"
          >
            <span className="material-symbols-outlined text-xl">
              shopping_bag
            </span>
          </Link>
        </div>
      </nav>

      <div className="relative z-10 flex min-h-[620px] items-center px-6 md:px-12 lg:px-36">
        <div className="max-w-xl">
          <p className="mb-8 text-[10px] font-bold uppercase tracking-[0.34em] text-white/85">
            About Archivist
          </p>
          <h1 className="font-headline text-5xl leading-[1.02] text-[#f2eadf] md:text-7xl">
            More than a store.
            <br />
            A way of living.
          </h1>
          <p className="mt-10 max-w-md text-sm leading-7 text-white/72">
            ARCHIVIST is a modern luxury destination curating timeless pieces,
            meaningful stories and a community that values quality over
            quantity.
          </p>
        </div>
      </div>

      <p className="absolute right-8 top-1/2 z-10 hidden -translate-y-1/2 rotate-90 text-[10px] font-bold uppercase tracking-[0.35em] text-white/70 md:block">
        Curated. Conscious. Timeless.
      </p>
    </section>
  );
}

function Story() {
  return (
    <section className="grid gap-14 px-6 py-20 md:grid-cols-[0.08fr_0.38fr_0.54fr] md:px-12 lg:px-24">
      <div className="hidden items-start gap-8 md:flex">
        <span className="writing-mode-vertical text-[10px] font-bold uppercase tracking-[0.28em] text-on-surface-variant [writing-mode:vertical-rl]">
          Our Story
        </span>
        <span className="mt-28 h-24 w-px bg-outline-variant" />
      </div>

      <div className="self-center">
        <h2 className="font-headline text-4xl leading-tight">
          Built on a belief.
          <br />
          Rooted in timelessness.
        </h2>
        <div className="mt-9 max-w-sm space-y-6 text-sm leading-7 text-on-surface">
          <p>
            We created ARCHIVIST for those who seek more meaning, more
            intentionality, and more longevity in the things they choose to be a
            part of.
          </p>
          <p>
            Every piece we offer is thoughtfully selected. Every story we tell
            is intentionally crafted. This is not fast fashion. This is forever
            style.
          </p>
        </div>
        <Link
          to="/archives"
          className="mt-10 inline-flex h-14 items-center gap-12 border border-outline px-7 text-[10px] font-bold uppercase tracking-[0.2em] transition-colors hover:bg-inverse-surface hover:text-white"
        >
          Our Journey
          <span className="material-symbols-outlined text-lg">east</span>
        </Link>
      </div>

      <div className="relative mx-auto w-full max-w-[620px] py-10">
        <img
          src={aboutImages.story}
          alt="Ceramic vessel and books in quiet light"
          className="aspect-[4/5] w-[72%] object-cover grayscale"
        />
        <div className="absolute right-0 top-1/2 w-[56%] -translate-y-1/2 border border-outline-variant bg-tertiary-container p-8 shadow-[0_24px_60px_rgba(24,23,20,0.12)] md:p-12">
          <p className="font-headline text-5xl leading-none">"</p>
          <p className="font-headline text-2xl italic leading-tight text-on-background">
            We do not chase trends. We collect timeless essentials that outlive
            them.
          </p>
          <p className="mt-9 text-[10px] font-bold uppercase tracking-[0.2em]">
            - Archivist
          </p>
        </div>
      </div>
    </section>
  );
}

function Values() {
  return (
    <section className="bg-inverse-surface px-6 py-16 text-white md:px-12 lg:px-24">
      <p className="mb-12 text-[10px] font-bold uppercase tracking-[0.34em] text-white/78">
        Our Values
      </p>
      <div className="grid gap-10 md:grid-cols-4">
        {values.map((value, index) => (
          <div
            key={value.title}
            className={`min-h-40 ${index > 0 ? "md:border-l md:border-white/14 md:pl-12" : ""}`}
          >
            <span className="material-symbols-outlined text-4xl text-white/85">
              {value.icon}
            </span>
            <h3 className="mt-8 text-[12px] font-bold uppercase tracking-[0.24em]">
              {value.title}
            </h3>
            <p className="mt-4 max-w-xs text-sm leading-6 text-white/62">
              {value.text}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Craft() {
  return (
    <section className="grid gap-14 px-6 py-20 md:grid-cols-2 md:px-12 lg:px-24">
      <div className="self-center">
        <div className="mb-7 flex items-center gap-6">
          <span className="h-px w-16 bg-outline-variant" />
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
            Our Craft
          </p>
        </div>
        <h2 className="font-headline text-4xl leading-tight">
          Thoughtfully chosen.
          <br />
          Beautifully made.
        </h2>
        <div className="mt-9 max-w-sm space-y-6 text-sm leading-7 text-on-surface">
          <p>
            We partner with artisans and makers who share our passion for
            quality, detail and integrity.
          </p>
          <p>
            From fabric to finish, every piece is a testament to craftsmanship
            and care.
          </p>
        </div>
        <Link
          to="/products"
          className="mt-10 inline-flex h-14 items-center gap-12 border border-outline px-7 text-[10px] font-bold uppercase tracking-[0.2em] transition-colors hover:bg-inverse-surface hover:text-white"
        >
          Learn More
          <span className="material-symbols-outlined text-lg">east</span>
        </Link>
      </div>

      <div className="relative">
        <img
          src={aboutImages.craft}
          alt="Hands cutting fabric in an atelier"
          className="aspect-[1.45] w-full object-cover grayscale"
        />
        <div className="absolute bottom-7 right-7 hidden h-36 w-36 items-center justify-center rounded-full border border-white/80 text-white md:flex">
          <div className="text-center">
            <p className="font-headline text-5xl">A</p>
            <p className="mt-1 text-[8px] font-bold uppercase tracking-[0.18em]">
              Quality Remembered
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
