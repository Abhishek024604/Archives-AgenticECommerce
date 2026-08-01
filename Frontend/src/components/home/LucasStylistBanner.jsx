const PROMPT_CHIPS = [
  "Which items are low on stock?",
  "Give me today's store overview",
  "Show my recent orders",
  "What is my total revenue?",
];

export default function LucasStylistBanner({ onOpenLucas }) {
  const handleChipClick = (promptText) => {
    if (onOpenLucas) {
      onOpenLucas(promptText);
    }
    const customEvent = new CustomEvent("open-lucas-chat", {
      detail: { prompt: promptText },
    });
    window.dispatchEvent(customEvent);
  };

  return (
    <section className="bg-white py-12 border-b border-stone-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-xl bg-[#F6F4F0] border border-stone-300/70 p-6 sm:p-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Info Column */}
            <div className="lg:col-span-4">
              <span className="inline-block rounded-xs bg-stone-200/80 px-2.5 py-1 text-[9px] font-bold tracking-[0.2em] uppercase text-stone-700">
                MEET LUCAS
              </span>
              <h2 className="mt-3 font-headline text-3xl sm:text-4xl text-stone-950 font-normal leading-tight">
                Your Business Assistant
              </h2>
              <p className="mt-3 text-xs sm:text-sm text-stone-600 font-light leading-relaxed">
                Tell Lucas what you need and get store insights in seconds.
              </p>
            </div>

            {/* Middle Chips & Action Column */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {PROMPT_CHIPS.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => handleChipClick(chip)}
                    className="rounded-md border border-stone-300 bg-white/90 px-3.5 py-2.5 text-left text-xs font-medium text-stone-800 shadow-2xs transition-all hover:border-stone-900 hover:bg-white hover:shadow-xs"
                  >
                    {chip}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => handleChipClick("Hi Lucas, give me today's store overview")}
                className="mt-2 inline-flex items-center justify-center gap-2 self-start rounded-md bg-stone-950 px-6 py-3 text-xs font-bold uppercase tracking-[0.16em] text-white shadow-xs transition-transform hover:scale-[1.02] hover:bg-black"
              >
                <span className="material-symbols-outlined text-base">chat</span>
                <span>Chat with Lucas</span>
              </button>
            </div>

            {/* Right Lucas Persona Visual */}
            <div className="lg:col-span-3 flex flex-col items-center justify-center lg:items-end text-center lg:text-right border-t border-stone-300/40 lg:border-t-0 pt-6 lg:pt-0">
              <div className="relative h-28 w-28 overflow-hidden rounded-full border-2 border-white shadow-md">
                <img
                  src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80"
                  alt="Lucas AI Assistant"
                  className="h-full w-full object-cover"
                />
              </div>
              <span className="mt-3 font-headline text-lg italic text-stone-900 tracking-wider">
                Lucas
              </span>
              <span className="text-[9px] font-bold tracking-[0.22em] uppercase text-stone-500">
                AI ASSISTANT
              </span>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
