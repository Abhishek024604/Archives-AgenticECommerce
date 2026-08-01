import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const HERO_SLIDES = [
  {
    title: "spark your\nfestive style.",
    image: "/assets/image.png",
    linkPrimary: { text: "SHOP NOW", url: "/products" },
    isSpecial: true,
  },
  {
    subtitle: "SUMMER ESCAPES",
    title: "Vacations\nBegin Here",
    description: "Breezy styles for sun-soaked\nescapes and endless memories.",
    image: "/assets/image2.png",
    linkPrimary: { text: "Shop Vacation", url: "/products?category=women" },
    linkSecondary: { text: "Explore Collection", url: "/products" },
  },
  {
    subtitle: "TIMELESS ALWAYS",
    title: "The Classics\nNever Fade",
    description: "Styles that stay with you,\nseason after season.",
    image: "/assets/image3.png",
    linkPrimary: { text: "Shop Classics", url: "/products?category=men" },
    linkSecondary: { text: "Explore Collection", url: "/products" },
  },
  {
    subtitle: "STREET EDIT",
    title: "Street\nState of Mind",
    description: "Bold graphics and relaxed fits\nfor everyday expression.",
    image: "/assets/image4.png",
    linkPrimary: { text: "Shop Streetwear", url: "/products" },
    linkSecondary: { text: "Explore Collection", url: "/products" },
  },
];

export default function HeroSection() {
  const [activeSlide, setActiveSlide] = useState(0);

  const nextSlide = () => setActiveSlide((prev) => (prev + 1) % HERO_SLIDES.length);
  const prevSlide = () => setActiveSlide((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);

  // Auto-advance slides every 6 seconds
  useEffect(() => {
    const timer = setInterval(nextSlide, 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="bg-stone-950 relative">
      <div className="relative">

        {/* Full-width Hero Container */}
        <div className="relative overflow-hidden bg-stone-900 min-h-[460px] lg:min-h-[550px] flex items-center group">

          {/* Slider Wrapper */}
          <div
            className="absolute inset-0 w-full h-full flex transition-transform duration-1000 ease-in-out"
            style={{ transform: `translateX(-${activeSlide * 100}%)` }}
          >
            {HERO_SLIDES.map((slide, index) => (
              <div key={`slide-${index}`} className="w-full h-full flex-shrink-0 relative">
                <img
                  src={slide.image}
                  alt={slide.title ? slide.title.replace('\n', ' ') : ''}
                  className="w-full h-full object-cover object-top"
                />
                {/* Subtle dark gradient overlay to ensure text readability */}
                <div className={`absolute top-0 bottom-0 ${slide.isSpecial ? 'right-0 bg-gradient-to-l' : 'left-0 bg-gradient-to-r'} from-black/60 via-black/30 to-transparent w-full md:w-[70%] lg:w-[50%]`}></div>

                {/* Text Content Area for this slide */}
                <div className={`absolute inset-0 z-10 px-6 py-10 md:px-12 lg:px-20 w-full h-full flex items-center ${slide.isSpecial ? 'justify-end' : ''}`}>
                  <div className={`relative w-full max-w-2xl h-full flex items-center ${slide.isSpecial ? 'justify-end' : ''}`}>
                    <div
                      className={`w-full transition-all duration-700 delay-300 ease-out flex flex-col ${slide.isSpecial ? 'items-center lg:items-end lg:pr-8' : 'items-start'} ${index === activeSlide
                        ? "opacity-100 translate-y-0"
                        : "opacity-0 translate-y-8"
                        }`}
                    >
                      {slide.subtitle && (
                        <div className="flex items-center gap-4 mb-6">
                          <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-stone-300">
                            {slide.subtitle}
                          </span>
                          <div className="h-[1px] w-12 bg-stone-500"></div>
                        </div>
                      )}

                      <h1 className={`font-headline ${slide.isSpecial ? 'text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tighter text-center lg:text-right' : 'text-4xl sm:text-5xl lg:text-6xl font-normal text-left'} leading-[1.1] text-white mb-6 whitespace-pre-line`}>
                        {slide.isSpecial ? (
                          <>
                            <span className="block mb-1">spark your</span>
                            <span className="italic font-light">festive style.</span>
                          </>
                        ) : (
                          slide.title
                        )}
                      </h1>

                      {slide.description && (
                        <p className="text-sm sm:text-base font-light text-stone-200 leading-relaxed mb-10 max-w-md whitespace-pre-line text-left">
                          {slide.description}
                        </p>
                      )}

                      <div className={`flex flex-wrap items-center gap-4 ${slide.description ? 'mb-10' : ''}`}>
                        {slide.isSpecial ? (
                          <Link
                            to={slide.linkPrimary.url}
                            className="inline-flex items-center justify-center bg-white text-stone-950 px-8 py-3 text-[11px] font-bold tracking-[0.15em] uppercase transition-transform hover:scale-[1.02] hover:bg-stone-100 pointer-events-auto"
                          >
                            {slide.linkPrimary.text}
                          </Link>
                        ) : (
                          <>
                            <Link
                              to={slide.linkPrimary.url}
                              className="inline-flex items-center justify-center gap-2 bg-white text-stone-950 px-7 py-3.5 text-xs font-bold transition-transform hover:scale-[1.02] hover:bg-stone-200 rounded-md shadow-sm pointer-events-auto"
                            >
                              {slide.linkPrimary.text}
                              <span className="material-symbols-outlined text-sm">arrow_forward</span>
                            </Link>
                            {slide.linkSecondary && (
                              <Link
                                to={slide.linkSecondary.url}
                                className="inline-flex items-center justify-center border border-white/30 bg-black/20 backdrop-blur-md text-white px-7 py-3.5 text-xs font-medium transition-colors hover:border-white/60 hover:bg-black/40 rounded-md shadow-sm pointer-events-auto"
                              >
                                {slide.linkSecondary.text}
                              </Link>
                            )}
                          </>
                        )}
                      </div>


                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation Arrows */}
          <button
            onClick={prevSlide}
            aria-label="Previous slide"
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60 z-20 border border-white/20"
          >
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <button
            onClick={nextSlide}
            aria-label="Next slide"
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60 z-20 border border-white/20"
          >
            <span className="material-symbols-outlined">chevron_right</span>
          </button>

          {/* Carousel Pagination Controls */}
          <div className="absolute bottom-6 left-6 md:left-12 lg:left-20 z-20 flex items-center gap-3">
            {HERO_SLIDES.map((_, index) => (
              <button
                key={`dot-${index}`}
                onClick={() => setActiveSlide(index)}
                className={`h-1.5 transition-all duration-300 rounded-full ${index === activeSlide ? "w-8 bg-white" : "w-3 bg-white/40 hover:bg-white/70"
                  }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>

        </div>

      </div>
    </section>
  );
}
