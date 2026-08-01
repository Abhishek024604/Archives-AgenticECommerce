import { useEffect, useRef, useState } from "react";
import socket from "../socket/socket";
import { getMessages } from "../api/message";

const formatDateLabel = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return "Today";
  } else if (date.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  } else {
    return new Intl.DateTimeFormat("en", {
      month: "long",
      day: "numeric",
      year: "numeric"
    }).format(date);
  }
};

export default function CommunityChat({
  communityId,
  Name,
  description,
  memberCount,
  onJoin,
  onLeave,
  onDelete,
  isAdmin,
  isMember,
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
    <div className="flex h-full min-h-0 flex-col bg-white text-stone-900 font-sans">
      {/* Light Theme Header */}
      <div className="shrink-0 border-b border-stone-200 bg-[#FAFAFA] px-6 py-6 sm:px-8 sm:py-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-stone-500">
              {Name || "Circle"}
            </span>
            <h3 className="font-headline text-2xl sm:text-3xl font-normal text-stone-950 mt-1">
              Community Room
            </h3>
            <p className="mt-1.5 max-w-xl text-xs sm:text-sm text-stone-600 font-light leading-relaxed">
              {description || "Welcome to the circle discussion."}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              {memberCount} members
            </span>

            {isAdmin ? (
              <button
                type="button"
                onClick={onDelete}
                className="bg-red-600 text-white px-5 py-2 text-xs font-bold uppercase tracking-wider transition-colors hover:bg-red-700 rounded-none"
              >
                Delete Community
              </button>
            ) : isMember ? (
              <button
                type="button"
                onClick={onLeave}
                className="border border-stone-300 bg-white text-stone-800 px-5 py-2 text-xs font-bold uppercase tracking-wider transition-colors hover:bg-stone-100 rounded-none"
              >
                Leave
              </button>
            ) : (
              <button
                type="button"
                onClick={onJoin}
                className="bg-stone-950 text-white px-5 py-2 text-xs font-bold uppercase tracking-wider transition-colors hover:bg-black rounded-none"
              >
                Join
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Light Theme Messages Area */}
      <div
        ref={messagesContainerRef}
        className="min-h-0 flex-1 overflow-y-auto bg-[#F9F9F8] px-6 py-6 sm:px-8 space-y-4"
      >
        {messages.length === 0 ? (
          <div className="flex h-full min-h-[260px] flex-col items-center justify-center text-center text-stone-400">
            <span className="material-symbols-outlined text-4xl mb-2 text-stone-300">
              chat_bubble_outline
            </span>
            <p className="text-xs font-medium">No messages yet.</p>
            <p className="text-[11px] text-stone-400 mt-0.5">Start the conversation in this circle!</p>
          </div>
        ) : (
          messages.map((message, index) => {
            const currentMessageDate = message.createdAt ? formatDateLabel(message.createdAt) : "";
            const previousMessage = index > 0 ? messages[index - 1] : null;
            const previousMessageDate = previousMessage?.createdAt ? formatDateLabel(previousMessage.createdAt) : "";
            
            const showDateHeader = currentMessageDate && currentMessageDate !== previousMessageDate;

            return (
              <div key={message._id || `${message.senderId?._id}-${message.createdAt}`} className="flex flex-col gap-4">
                {showDateHeader && (
                  <div className="flex justify-center my-2">
                    <span className="bg-stone-200/60 text-stone-600 px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-none">
                      {currentMessageDate}
                    </span>
                  </div>
                )}
                <div
                  className="flex items-start gap-3.5 border border-stone-200 bg-white p-4 rounded-none shadow-2xs"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-none bg-stone-900 text-white font-headline text-sm font-bold">
                    {(message.senderId?.name || "U").slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-bold text-stone-950">
                        {message.senderId?.name || "Member"}
                      </span>
                      <span className="text-[10px] text-stone-400">
                        {message.createdAt
                          ? new Intl.DateTimeFormat("en", {
                              hour: "numeric",
                              minute: "numeric",
                            }).format(new Date(message.createdAt))
                          : ""}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-stone-700 leading-relaxed break-words font-light">
                      {message.content?.text ||
                        (message.content?.image ? "[image]" : "")}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Light Theme Message Input Bar */}
      <div className="shrink-0 border-t border-stone-200 bg-white px-6 py-4 sm:px-8">
        {chatError ? (
          <div className="mb-3 border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-700 rounded-none">
            {chatError}
          </div>
        ) : null}
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={text}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && sendMessage()}
            className="flex-1 border border-stone-300 bg-stone-50 px-4 py-3 text-xs text-stone-900 outline-none focus:border-stone-900 rounded-none"
            placeholder="Write your message..."
          />
          <button
            type="button"
            onClick={sendMessage}
            className="inline-flex items-center gap-2 bg-stone-950 text-white px-6 py-3 text-xs font-bold uppercase tracking-wider hover:bg-black transition-colors rounded-none shrink-0"
          >
            <span>Send</span>
            <span className="material-symbols-outlined text-base">arrow_forward</span>
          </button>
        </div>
      </div>
    </div>
  );
}
