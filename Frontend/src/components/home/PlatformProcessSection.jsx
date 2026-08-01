import { Link } from "react-router-dom";

const PROCESS_STEPS = [
  {
    icon: "sell",
    title: "List Products",
    desc: "Add and organize your products with ease.",
  },
  {
    icon: "inventory_2",
    title: "Manage Orders",
    desc: "Track, pack and ship seamlessly.",
  },
  {
    icon: "groups",
    title: "Engage Community",
    desc: "Connect with buyers and build trust.",
  },
  {
    icon: "monitoring",
    title: "Track Performance",
    desc: "Insights that help you grow faster.",
  },
  {
    icon: "workspace_premium",
    title: "Grow Your Brand",
    desc: "Tools and features to elevate your brand.",
  }
];

export default function PlatformProcessSection() {
  return (
    <section className="bg-[#FAFAFA] py-24 border-y border-stone-200">
      <div className="mx-auto max-w-[1536px] px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col xl:flex-row gap-16 xl:gap-8 items-center xl:items-start justify-between">
          
          {/* Left Text Content */}
          <div className="w-full xl:w-[350px] shrink-0 text-center xl:text-left">
            <p className="text-[10px] font-bold tracking-[0.25em] uppercase text-stone-500 mb-4">
              Behind Every Success
            </p>
            <h2 className="font-headline text-3xl md:text-4xl lg:text-5xl leading-tight text-stone-950 mb-6">
              Seller Activities<br className="hidden xl:block" /> That Drive Growth
            </h2>
            <p className="text-xs md:text-sm text-stone-500 font-light mb-8 max-w-md mx-auto xl:mx-0 leading-relaxed">
              From listing your products to building your brand, every step is designed to help you thrive on Archivist.
            </p>
            <Link
              to="/seller"
              className="inline-flex bg-stone-950 text-white px-8 py-3.5 text-xs font-bold uppercase tracking-widest transition-transform hover:bg-stone-800"
            >
              Explore Seller Hub
            </Link>
          </div>

          {/* Right Process Flow */}
          <div className="flex-1 w-full max-w-5xl relative mt-10 xl:mt-0 overflow-x-auto pb-4 custom-scrollbar">
            {/* The dotted connecting line */}
            <div className="absolute top-[35px] left-[5%] right-[5%] h-px border-t-2 border-dotted border-stone-300 hidden md:block z-0"></div>

            <div className="flex items-start justify-between min-w-[800px] md:min-w-0 relative z-10">
              {PROCESS_STEPS.map((step, idx) => (
                <div key={idx} className="flex flex-col items-center text-center w-40">
                  <div className="h-[70px] w-[70px] rounded-full bg-white border border-stone-200 flex items-center justify-center shadow-sm mb-6 relative z-10 transition-transform hover:scale-110">
                    <span className="material-symbols-outlined text-3xl text-stone-800">
                      {step.icon}
                    </span>
                  </div>
                  <h3 className="text-xs font-bold text-stone-950 mb-3">{step.title}</h3>
                  <p className="text-[10px] text-stone-500 font-medium leading-relaxed mb-4 px-2">
                    {step.desc}
                  </p>
                  <Link
                    to="/seller"
                    className="group flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-stone-900 transition-colors hover:text-stone-500"
                  >
                    <span>Learn more</span>
                    <span className="material-symbols-outlined text-sm transition-transform group-hover:translate-x-1">
                      arrow_right_alt
                    </span>
                  </Link>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
