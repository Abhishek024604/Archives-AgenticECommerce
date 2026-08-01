import { useState } from "react";

export default function PlatformNewsletterSection() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) return;
    setStatus("Subscribed!");
    setTimeout(() => {
      setEmail("");
      setStatus("");
    }, 3000);
  };

  return (
    <section className="bg-[#F5F4F0] py-24 border-y border-stone-200">
      <div className="mx-auto max-w-[1536px] px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-12 bg-stone-100 p-10 md:p-16 rounded-md shadow-sm border border-stone-200">
          
          <div className="max-w-xl text-center md:text-left">
            <p className="text-[10px] font-bold tracking-[0.25em] uppercase text-stone-500 mb-4">
              Stay Inspired
            </p>
            <h2 className="font-headline text-3xl md:text-4xl text-stone-950 mb-4">
              From Stories to Strategies
            </h2>
            <p className="text-xs md:text-sm text-stone-600 font-light leading-relaxed">
              Subscribe to get the latest journal updates, seller tips and community highlights, straight to your inbox.
            </p>
          </div>

          <div className="w-full max-w-md shrink-0">
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="flex-1 bg-stone-950 text-white border border-stone-900 px-4 py-3.5 text-xs outline-none placeholder:text-stone-500 focus:border-stone-400 transition-colors"
              />
              <button
                type="submit"
                className="bg-white text-stone-950 border border-stone-900 px-8 py-3.5 text-xs font-bold uppercase tracking-widest transition-colors hover:bg-stone-200"
              >
                {status || "Subscribe"}
              </button>
            </form>
          </div>
          
        </div>
      </div>
    </section>
  );
}
