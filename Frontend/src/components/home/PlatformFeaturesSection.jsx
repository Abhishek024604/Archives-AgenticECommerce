import { Link } from "react-router-dom";

export default function PlatformFeaturesSection() {
  return (
    <section className="bg-stone-950 py-24 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-stone-800 rounded-full blur-[120px] opacity-20 pointer-events-none"></div>

      <div className="mx-auto max-w-[1536px] px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Lucas Showcase inside Seller Feature Section */}
        <div className="border border-stone-800 rounded-md bg-[#0A0A0A] overflow-hidden relative flex flex-col lg:flex-row items-center justify-between group transition-colors hover:border-stone-600">
          <div className="absolute inset-0 bg-gradient-to-r from-stone-900 to-stone-950 opacity-50 z-0"></div>
          
          <div className="relative z-10 p-8 lg:p-12 max-w-2xl">
            <p className="text-[10px] font-bold tracking-[0.25em] uppercase text-stone-400 mb-4">
              AI Powered Growth
            </p>
            <h2 className="font-headline text-3xl md:text-5xl text-white mb-4">
              Meet Lucas: Your AI Seller Assistant
            </h2>
            <p className="text-xs md:text-sm text-stone-400 font-light leading-relaxed mb-8 max-w-lg">
              Lucas is your intelligent seller assistant. From drafting high-converting product descriptions to recommending optimal tags and managing your inventory insights, Lucas automates the heavy lifting so you can focus on growing your brand.
            </p>
            <Link
              to="/product/ai-stylist"
              className="inline-flex items-center gap-3 bg-stone-800 text-white border border-stone-700 px-6 py-3 text-[11px] font-bold uppercase tracking-widest transition-colors hover:bg-stone-700 hover:border-stone-500"
            >
              <span>Learn about Lucas</span>
              <span className="material-symbols-outlined text-sm">auto_awesome</span>
            </Link>
          </div>

          <div className="relative z-10 w-full lg:w-[400px] h-[300px] lg:h-[400px] shrink-0 p-8 flex items-center justify-center">
            {/* Abstract visual for AI */}
            <div className="relative w-full h-full border border-stone-800 rounded-full flex items-center justify-center bg-stone-900/50 backdrop-blur-md overflow-hidden group-hover:border-stone-600 transition-colors duration-700">
               <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-stone-700/20 via-transparent to-transparent"></div>
               <span className="material-symbols-outlined text-8xl text-stone-500 animate-pulse">
                 smart_toy
               </span>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
