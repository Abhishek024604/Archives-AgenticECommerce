import { useEffect, useRef, useState } from "react";
import { chatWithLucas } from "../api/lucas";
import { useAuth } from "../context/AuthContext";

const QUICK_PROMPTS = [
  "Beach wedding outfit under ₹15k",
  "Minimal white sneakers for men",
  "Which items are low on stock?",
  "Give me today's store overview",
];

const TOOL_LABELS = {
  getSellerOverview: "store overview",
  searchProducts: "products catalog",
  getInventory: "inventory status",
  getOrders: "recent orders",
  getRevenue: "revenue metrics",
  getCustomers: "customer data",
  getCommunities: "community circles",
};

export default function LucasSeller() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleEscape = (event) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [isOpen, messages, isThinking]);

  useEffect(() => {
    const handleOpenLucas = (event) => {
      setIsOpen(true);
      if (event.detail?.prompt) {
        submitMessage(event.detail.prompt);
      }
    };

    window.addEventListener("open-lucas-chat", handleOpenLucas);
    return () => window.removeEventListener("open-lucas-chat", handleOpenLucas);
  }, []);

  const submitMessage = async (content) => {
    const trimmed = content.trim();
    if (!trimmed || isThinking) return;

    const userMessage = { role: "user", content: trimmed };
    const nextMessages = [...messages, userMessage];

    setMessages(nextMessages);
    setInput("");
    setError("");
    setIsThinking(true);

    try {
      const response = await chatWithLucas(
        nextMessages.map(({ role, content: messageContent }) => ({
          role,
          content: messageContent,
        }))
      );

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: response.data.answer,
          toolsUsed: response.data.toolsUsed || [],
        },
      ]);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Lucas could not complete that request. Please try again."
      );
    } finally {
      setIsThinking(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    submitMessage(input);
  };

  if (!user || user.role !== "seller") {
    return null;
  }

  return (
    <>
      {isOpen ? (
        <section
          aria-label="Lucas AI Assistant Window"
          className="fixed inset-x-3 bottom-24 z-[70] flex max-h-[min(42rem,calc(100vh-7rem))] flex-col overflow-hidden rounded-2xl border border-stone-300 bg-white text-stone-900 shadow-[0_24px_70px_rgba(0,0,0,0.3)] sm:inset-x-auto sm:right-6 sm:w-[26rem]"
        >
          {/* Header */}
          <header className="flex items-center justify-between border-b border-stone-800 bg-stone-950 px-5 py-4 text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-stone-900 border border-amber-400/40 text-amber-400">
                <span className="material-symbols-outlined text-lg">auto_awesome</span>
              </div>
              <div>
                <h2 className="font-headline text-base font-medium text-white flex items-center gap-2">
                  <span>Lucas</span>
                  <span className="text-[9px] bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-full uppercase tracking-widest font-bold">
                    Business Assistant
                  </span>
                </h2>
                <p className="text-[10px] text-stone-400 font-light">
                  Store Operations & Intelligence
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex h-8 w-8 items-center justify-center text-stone-400 transition-colors hover:bg-stone-800 hover:text-white rounded-full"
              aria-label="Close Lucas"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </header>

          {/* Chat Messages */}
          <div
            ref={scrollRef}
            className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-[#F9F9F8] p-5"
          >
            {messages.length === 0 ? (
              <div>
                <p className="font-headline text-lg text-stone-950">
                  How can Lucas assist you today?
                </p>
                <p className="mt-1.5 text-xs leading-relaxed text-stone-600 font-light">
                  Ask for inventory status, order updates, revenue metrics, or live store data.
                </p>
                <div className="mt-4 grid gap-2">
                  {QUICK_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => submitMessage(prompt)}
                      className="border border-stone-200 bg-white px-3.5 py-2.5 text-left text-xs text-stone-800 transition-colors hover:border-stone-950 hover:bg-[#F6F4F0] rounded-lg shadow-2xs font-medium"
                    >
                      ✨ {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={
                    message.role === "user"
                      ? "ml-8 rounded-2xl rounded-tr-xs bg-stone-950 px-4 py-3 text-xs leading-relaxed text-white shadow-xs"
                      : "mr-4 rounded-2xl rounded-tl-xs border border-stone-200 bg-white px-4 py-3 text-xs leading-relaxed text-stone-800 shadow-xs"
                  }
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  {message.toolsUsed?.length ? (
                    <p className="mt-2.5 border-t border-stone-200/80 pt-2 text-[9px] font-bold uppercase tracking-widest text-stone-400">
                      Consulted{" "}
                      {[...new Set(message.toolsUsed)]
                        .map((tool) => TOOL_LABELS[tool] || tool)
                        .join(", ")}
                    </p>
                  ) : null}
                </div>
              ))
            )}

            {isThinking ? (
              <div className="mr-12 rounded-xl border border-stone-200 bg-white p-3.5 text-xs text-stone-600 shadow-2xs">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-amber-500 animate-spin text-base">
                    progress_activity
                  </span>
                  <span>Lucas is analyzing your business data...</span>
                </div>
              </div>
            ) : null}

            {error ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs leading-relaxed text-red-700">
                {error}
              </div>
            ) : null}
          </div>

          {/* Input Form */}
          <form
            onSubmit={handleSubmit}
            className="border-t border-stone-200 bg-white p-4"
          >
            <div className="flex items-center gap-2 border border-stone-300 bg-stone-50 px-3 py-1.5 rounded-xl focus-within:border-stone-950 focus-within:bg-white">
              <input
                type="text"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    submitMessage(input);
                  }
                }}
                maxLength={2000}
                placeholder="Ask Lucas AI..."
                className="flex-1 bg-transparent py-2 text-xs text-stone-900 outline-none placeholder:text-stone-400"
              />
              <button
                type="submit"
                disabled={!input.trim() || isThinking}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-stone-950 text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Send message to Lucas"
              >
                <span className="material-symbols-outlined text-base">arrow_upward</span>
              </button>
            </div>
          </form>
        </section>
      ) : null}

      {/* Floating Lucas AI Assistant Button */}
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="fixed bottom-6 right-6 z-[70] flex h-14 w-14 items-center justify-center gap-0 rounded-full bg-stone-950 border border-amber-400/40 text-white shadow-[0_16px_40px_rgba(0,0,0,0.4)] transition-all hover:scale-105 active:scale-95 hover:border-amber-400 hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)] group"
        aria-label={isOpen ? "Close Lucas AI" : "Open Lucas AI"}
        aria-expanded={isOpen}
      >
        <span className="absolute top-0 right-0 -mt-1 -mr-1 flex h-3 w-3 items-center justify-center">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-400" />
        </span>

        <span className="material-symbols-outlined text-amber-400 text-2xl">
          {isOpen ? "close" : "auto_awesome"}
        </span>

        {/* Tooltip */}
        <span className="absolute right-full mr-4 whitespace-nowrap rounded-lg bg-stone-950 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-amber-400 opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:mr-3 pointer-events-none shadow-lg border border-amber-400/20">
          Lucas AI
        </span>
      </button>
    </>
  );
}
