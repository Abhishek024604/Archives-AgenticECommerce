import { useState } from "react";

export default function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail("");
      setTimeout(() => setSubscribed(false), 4000);
    }
  };

  return (
    <section className="bg-[#0D0C0A] text-[#f2eadf] py-14 border-b border-white/10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Headline & Subtitle */}
          <div className="lg:col-span-6">
            <h2 className="font-headline text-3xl sm:text-4xl text-[#FAF8F5] font-normal leading-snug">
              Join The Archive
            </h2>
            <p className="mt-3 text-xs sm:text-sm text-stone-400 font-light leading-relaxed max-w-md">
              Be the first to access limited editions, exclusive releases and thoughtful stories.
            </p>
          </div>

          {/* Right Input Form */}
          <div className="lg:col-span-6">
            {subscribed ? (
              <div className="rounded-md bg-stone-900 border border-stone-700 p-4 text-center text-xs font-semibold text-stone-200 tracking-wider">
                Thank you for subscribing to Archivist.
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="flex-1 bg-stone-900 border border-stone-700 px-4 py-3 text-xs text-white outline-none placeholder:text-stone-500 focus:border-stone-400"
                />
                <button
                  type="submit"
                  className="bg-stone-100 text-stone-950 px-8 py-3 text-xs font-bold uppercase tracking-[0.18em] transition-transform hover:bg-white hover:scale-[1.02] shrink-0"
                >
                  Subscribe
                </button>
              </form>
            )}
          </div>

        </div>
      </div>
    </section>
  );
}
