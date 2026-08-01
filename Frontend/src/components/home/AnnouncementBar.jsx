import { useEffect, useState } from "react";

const ANNOUNCEMENTS = [
  "Complimentary shipping on all orders above ₹4999  |  Easy 14-day returns",
  "Autumn Collection 2026  |  New Arrivals Now Live",
  "Authentic Luxury Guaranteed  |  100% Original Products",
];

// Clone first item to end for 1-direction continuous looping
const SLIDES = [...ANNOUNCEMENTS, ANNOUNCEMENTS[0]];

export default function AnnouncementBar() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [withTransition, setWithTransition] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return undefined;

    const timer = setInterval(() => {
      setWithTransition(true);
      setCurrentIndex((prev) => prev + 1);
    }, 3000); // 3 seconds display pause!

    return () => clearInterval(timer);
  }, [isPaused]);

  useEffect(() => {
    // When reaching the cloned slide (index 3), instantly jump back to index 0 after transition completes (300ms)
    if (currentIndex === ANNOUNCEMENTS.length) {
      const resetTimer = setTimeout(() => {
        setWithTransition(false);
        setCurrentIndex(0);
      }, 300); // Fast 300ms transition speed!

      return () => clearTimeout(resetTimer);
    }
  }, [currentIndex]);

  const prevAnnouncement = () => {
    if (currentIndex === 0) {
      setWithTransition(false);
      setCurrentIndex(ANNOUNCEMENTS.length);
      setTimeout(() => {
        setWithTransition(true);
        setCurrentIndex(ANNOUNCEMENTS.length - 1);
      }, 20);
    } else {
      setWithTransition(true);
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const nextAnnouncement = () => {
    setWithTransition(true);
    setCurrentIndex((prev) => prev + 1);
  };

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="relative z-30 bg-[#0c0c0b] text-[#d4ceb8] border-b border-white/10 px-4 py-2 text-[10px] sm:text-[11px] font-medium tracking-[0.16em] uppercase selection:bg-stone-800"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <button
          type="button"
          onClick={prevAnnouncement}
          className="z-10 flex h-5 w-5 shrink-0 items-center justify-center text-white/50 transition-colors hover:text-white"
          aria-label="Previous announcement"
        >
          <span className="material-symbols-outlined text-sm">chevron_left</span>
        </button>

        {/* 1-Direction Right-To-Left Fast Slide Container */}
        <div className="relative min-h-[1.2rem] flex-1 overflow-hidden px-4">
          <div
            className={`flex ${withTransition ? "transition-transform duration-300 ease-out" : "transition-none"}`}
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {SLIDES.map((item, idx) => (
              <p
                key={idx}
                className="w-full shrink-0 text-center truncate px-2"
              >
                {item}
              </p>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={nextAnnouncement}
          className="z-10 flex h-5 w-5 shrink-0 items-center justify-center text-white/50 transition-colors hover:text-white"
          aria-label="Next announcement"
        >
          <span className="material-symbols-outlined text-sm">chevron_right</span>
        </button>
      </div>
    </div>
  );
}
