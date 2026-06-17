import { useEffect, useRef, useState } from "react";
import { chatWithLucas } from "../api/lucas";
import { useAuth } from "../context/AuthContext";

const QUICK_PROMPTS = [
  "Give me today's operations overview",
  "Which products are low on stock?",
  "How much revenue is waiting to be processed?",
  "Show my latest unprocessed orders",
];

const TOOL_LABELS = {
  getSellerOverview: "store overview",
  searchProducts: "products",
  getInventory: "inventory",
  getOrders: "orders",
  getRevenue: "revenue",
  getCustomers: "customers",
  getCommunities: "communities",
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

  if (user?.role !== "seller") {
    return null;
  }

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

  return (
    <>
      {isOpen ? (
        <section
          aria-label="Lucas Seller Operating System"
          className="fixed inset-x-3 bottom-24 z-[70] flex max-h-[min(42rem,calc(100vh-7rem))] flex-col overflow-hidden border border-outline-variant bg-surface-container-lowest shadow-[0_28px_80px_rgba(0,0,0,0.55)] sm:inset-x-auto sm:right-6 sm:w-[25rem]"
        >
          <header className="flex items-center justify-between border-b border-outline-variant/40 bg-surface-container px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-on-primary">
                <span className="material-symbols-outlined">work</span>
              </div>
              <div>
                <h2 className="font-headline text-lg font-bold text-on-background">
                  Lucas
                </h2>
                <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                  Seller Operations
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex h-9 w-9 items-center justify-center text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-background"
              aria-label="Close Lucas"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </header>

          <div
            ref={scrollRef}
            className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5"
          >
            {messages.length === 0 ? (
              <div>
                <p className="font-headline text-xl text-on-background">
                  What needs attention at{" "}
                  {user.sellerInfo?.storeName || "your store"}?
                </p>
                <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
                  I can check live inventory, orders, revenue, customers, and
                  communities.
                </p>
                <div className="mt-5 grid gap-2">
                  {QUICK_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => submitMessage(prompt)}
                      className="border border-outline-variant/50 bg-surface px-4 py-3 text-left text-xs leading-relaxed text-on-surface transition-colors hover:border-primary hover:bg-surface-container"
                    >
                      {prompt}
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
                      ? "ml-10 bg-primary px-4 py-3 text-sm leading-relaxed text-on-primary"
                      : "mr-4 border border-outline-variant/30 bg-surface px-4 py-3 text-sm leading-relaxed text-on-surface"
                  }
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  {message.toolsUsed?.length ? (
                    <p className="mt-3 border-t border-outline-variant/30 pt-2 text-[9px] font-bold uppercase tracking-widest text-on-surface-variant">
                      Checked{" "}
                      {[...new Set(message.toolsUsed)]
                        .map((tool) => TOOL_LABELS[tool] || tool)
                        .join(", ")}
                    </p>
                  ) : null}
                </div>
              ))
            )}

            {isThinking ? (
              <div className="mr-16 border border-outline-variant/30 bg-surface px-4 py-3 text-sm text-on-surface-variant">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined animate-pulse">
                    progress_activity
                  </span>
                  Checking your live store data...
                </div>
              </div>
            ) : null}

            {error ? (
              <div className="border border-error/30 bg-error-container/40 px-4 py-3 text-xs leading-relaxed text-on-error-container">
                {error}
              </div>
            ) : null}
          </div>

          <form
            onSubmit={handleSubmit}
            className="border-t border-outline-variant/40 bg-surface-container p-4"
          >
            <div className="flex items-end gap-2 border border-outline-variant bg-surface px-3 py-2 focus-within:border-primary">
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    submitMessage(input);
                  }
                }}
                rows={1}
                maxLength={2000}
                placeholder="Ask Lucas about your store..."
                className="max-h-28 min-h-10 flex-1 resize-none bg-transparent py-2 text-sm text-on-surface outline-none placeholder:text-on-surface-variant"
              />
              <button
                type="submit"
                disabled={!input.trim() || isThinking}
                className="flex h-10 w-10 shrink-0 items-center justify-center bg-primary text-on-primary transition-colors hover:bg-primary-dim disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Send message to Lucas"
              >
                <span className="material-symbols-outlined">arrow_upward</span>
              </button>
            </div>
            <p className="mt-2 text-center text-[9px] text-on-surface-variant">
              Lucas reads live seller data. This version cannot change it.
            </p>
          </form>
        </section>
      ) : null}

      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="fixed bottom-6 right-6 z-[70] flex h-14 items-center gap-3 rounded-full bg-primary px-4 text-on-primary shadow-[0_16px_40px_rgba(0,0,0,0.45)] transition-transform hover:scale-105 active:scale-95"
        aria-label={isOpen ? "Close Lucas" : "Open Lucas"}
        aria-expanded={isOpen}
      >
        <span className="material-symbols-outlined">
          {isOpen ? "close" : "work"}
        </span>
        <span className="pr-1 text-[10px] font-bold uppercase tracking-[0.18em]">
          Lucas
        </span>
      </button>
    </>
  );
}
