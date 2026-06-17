import { useEffect, useRef, useState } from "react";
import socket from "../socket/socket";
import { getMessages } from "../api/message";

export default function CommunityChat({
  communityId,
  Name,
  description,
  memberCount,
  onJoin,
  onLeave,
}) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [chatError, setChatError] = useState("");
  const messagesContainerRef = useRef(null);

  useEffect(() => {
    if (!communityId) return;

    const fetchMessages = async () => {
      try {
        const res = await getMessages(communityId);
        setMessages(res.data?.messages || []);
        setChatError("");
      } catch (err) {
        console.error("Failed to load messages:", err);
        setMessages([]);
        setChatError(
          err?.response?.data?.message || "Failed to load chat messages."
        );
      }
    };

    fetchMessages();

    const onConnect = () => {
      socket.emit("joinCommunity", communityId);
    };

    const onNewMessage = (message) => {
      setMessages((prev) => [...prev, message]);
      setChatError("");
    };

    const onErrorMessage = (msg) => {
      console.warn("Socket error:", msg);
      setChatError(msg || "Failed to send message.");
    };

    const onConnectError = (error) => {
      console.warn("Socket connection failed:", error.message);
      setChatError("Chat connection failed. Please log in again.");
    };

    socket.on("connect", onConnect);
    socket.on("newMessage", onNewMessage);
    socket.on("errorMessage", onErrorMessage);
    socket.on("connect_error", onConnectError);

    if (socket.connected) {
      socket.emit("joinCommunity", communityId);
    } else {
      socket.connect();
    }

    return () => {
      socket.off("connect", onConnect);
      socket.off("newMessage", onNewMessage);
      socket.off("errorMessage", onErrorMessage);
      socket.off("connect_error", onConnectError);
      socket.emit("leaveCommunity", communityId);
    };
  }, [communityId]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    container.scrollTop = container.scrollHeight;
  }, [messages]);

  const sendMessage = () => {
    const trimmed = text.trim();
    if (!trimmed) return;

    setChatError("");

    const payload = {
      communityId,
      content: { text: trimmed },
    };

    if (socket.connected) {
      socket.emit("sendMessage", payload);
    } else {
      socket.once("connect", () => {
        socket.emit("joinCommunity", communityId);
        socket.emit("sendMessage", payload);
      });
      socket.connect();
    }

    setText("");
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-surface">
      <div className="shrink-0 border-b border-outline-variant/20 bg-surface px-8 py-7">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <p className="font-label text-[10px] uppercase tracking-[0.3em] font-bold text-on-surface-variant">
              {Name}
            </p>
            <h3 className="mt-3 font-headline text-3xl tracking-tight text-on-background md:text-4xl">
              Community Room
            </h3>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-on-surface-variant">
              {description}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-3 md:justify-end">
            <p className="mr-1 font-label text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">
              {memberCount} members
            </p>
            <button
              onClick={onJoin}
              className="bg-primary px-6 py-3 font-label text-[10px] font-bold uppercase tracking-[0.2em] text-on-primary transition-opacity hover:opacity-90"
            >
              Join
            </button>
            <button
              onClick={onLeave}
              className="border border-outline px-6 py-3 font-label text-[10px] font-bold uppercase tracking-[0.2em] transition-colors hover:bg-surface-container-low"
            >
              Leave
            </button>
          </div>
        </div>
      </div>

      <div
        ref={messagesContainerRef}
        className="min-h-0 flex-1 overflow-y-auto bg-[linear-gradient(180deg,#12110f_0%,#1b1a17_100%)] px-6 py-6 md:px-8"
      >
        {messages.length === 0 ? (
          <div className="flex h-full min-h-[280px] items-center justify-center text-sm text-on-surface-variant">
            No messages yet. Start the conversation.
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((message) => (
              <div
                key={message._id || `${message.senderId?._id}-${message.createdAt}`}
                className="grid grid-cols-[44px_minmax(0,1fr)] gap-4 border border-outline-variant/20 bg-surface-container-lowest px-4 py-3 shadow-[0_10px_28px_rgba(47,52,48,0.035)]"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-low font-headline text-base text-on-surface-variant">
                  {(message.senderId?.name || "U").slice(0, 1)}
                </div>
                <div className="min-w-0">
                  <p className="mb-1 font-label text-[9px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">
                    {message.senderId?.name || "Unknown"}
                  </p>
                  <p className="break-words text-sm leading-relaxed text-on-surface">
                    {message.content?.text ||
                      (message.content?.image ? "[image]" : "")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-outline-variant/20 bg-surface px-6 py-5 md:px-8">
        {chatError ? (
          <div className="mb-4 border border-error/20 bg-error/5 px-4 py-3 text-sm text-error">
            {chatError}
          </div>
        ) : null}
        <div className="flex flex-col gap-3 md:flex-row">
          <input
            type="text"
            value={text}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && sendMessage()}
            className="min-h-12 flex-1 border border-outline-variant/25 bg-surface-container-low px-4 text-sm transition-colors placeholder:text-outline focus:border-primary focus:outline-none focus:ring-0"
            placeholder="Write your message..."
          />
          <button
            onClick={sendMessage}
            className="inline-flex min-h-12 items-center justify-center gap-2 bg-primary px-7 font-label text-[10px] font-bold uppercase tracking-[0.2em] text-on-primary transition-opacity hover:opacity-90"
          >
            <span>Send</span>
            <span className="material-symbols-outlined text-base">
              arrow_forward
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
