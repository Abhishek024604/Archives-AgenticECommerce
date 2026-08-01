import { Link } from "react-router-dom";

export default function PlatformHeroSection() {
  return (
    <section className="relative w-full h-[600px] md:h-[700px] bg-stone-950 overflow-hidden">
      {/* Background Image with Gradient Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src="/assets/sellersectionbg.png"
          alt="Seller Spotlight"
          className="w-full h-full object-cover object-right"
        />
        {/* Gradient to ensure text readability on the left */}
        <div className="absolute inset-0 bg-gradient-to-r from-stone-950/95 via-stone-950/60 to-transparent"></div>
        {/* Subtle vignette */}
        <div className="absolute inset-0 bg-stone-950/10"></div>
      </div>

      <div className="relative z-10 mx-auto max-w-[1536px] h-full px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
        <div className="max-w-2xl text-white pt-10">
          <p className="text-[10px] font-bold tracking-[0.25em] uppercase text-stone-300 mb-6">
            Seller Spotlight
          </p>
          <h2 className="font-headline text-5xl md:text-7xl lg:text-[80px] leading-[1.1] text-white mb-6">
            Powering<br />Entrepreneurs
          </h2>
          <p className="text-base md:text-lg text-stone-300 font-light max-w-md mb-10 leading-relaxed">
            Every day, sellers like you create, connect and grow with Archivist.
          </p>
          
          <Link
            to="/seller"
            className="inline-flex bg-white text-stone-950 px-8 py-3.5 text-xs font-bold uppercase tracking-widest transition-transform hover:scale-105 hover:bg-stone-100"
          >
            See How It Works
          </Link>

          {/* Stats Row */}
          <div className="mt-16 flex items-center gap-12 md:gap-16">
            <div className="flex flex-col gap-1">
              <span className="font-headline text-3xl md:text-4xl text-white">12K+</span>
              <span className="text-[10px] font-medium tracking-wider uppercase text-stone-400">Active Sellers</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-headline text-3xl md:text-4xl text-white">48K+</span>
              <span className="text-[10px] font-medium tracking-wider uppercase text-stone-400">Products Listed</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-headline text-3xl md:text-4xl text-white">2.3M+</span>
              <span className="text-[10px] font-medium tracking-wider uppercase text-stone-400">Orders Fulfilled</span>
            </div>
          </div>
        </div>
        
        {/* Slider Dots */}
        <div className="absolute bottom-10 left-4 sm:left-6 lg:left-8 flex items-center gap-3">
          <button className="h-1.5 w-6 bg-white rounded-full transition-all" aria-label="Slide 1"></button>
          <button className="h-1.5 w-1.5 bg-stone-500 rounded-full transition-all hover:bg-white" aria-label="Slide 2"></button>
          <button className="h-1.5 w-1.5 bg-stone-500 rounded-full transition-all hover:bg-white" aria-label="Slide 3"></button>
          <button className="h-1.5 w-1.5 bg-stone-500 rounded-full transition-all hover:bg-white" aria-label="Slide 4"></button>
        </div>
      </div>
    </section>
  );
}
