import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import intelligenceApi from "@/features/intelligence/api/intelligence.api";
import eventsApi from "@/features/events/api/events.api";
import { useAuthStore } from "@/shared/store/auth.store";

type EventCard = {
  id: string;
  title: string;
  event_type: string;
  is_free: boolean;
  start_date: string;
  registered_count?: number;
};
type Message = { role: "user" | "assistant"; content: string; events?: EventCard[] };

// quick-tap suggestions shown before the user has sent anything
const SUGGESTIONS = [
  "Help me find events",
  "Show me free events",
  "How do I register for an event?",
  "What are the subscription plans?",
];

/**
 * Floating chat assistant widget.
 * Only renders when the user is authenticated.
 * Sits fixed at bottom-right of the viewport.
 */
export default function ChatWidget() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Namaste! I am the Sansaar assistant. How can I help you today?",
    },
  ]);
  const bottomRef = useRef<HTMLDivElement>(null);

  // prefetch public events so we can send them as context with every chat message
  const { data: eventsPage } = useQuery({
    queryKey: ["public-events-chat"],
    queryFn: () => eventsApi.listPublicEvents(),
    staleTime: 5 * 60 * 1000,
    enabled: isAuthenticated,
  });
  const contextEvents = (eventsPage?.results ?? []).slice(0, 30) as unknown as EventCard[];

  const chatMutation = useMutation({
    mutationFn: ({ message, history }: { message: string; history: Message[] }) =>
      intelligenceApi.chat(message, history, contextEvents as EventCard[]),
    onSuccess: (data) => {
      const events = (data.events ?? []) as EventCard[];
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply, events: events.length > 0 ? events : undefined },
      ]);
    },
    onError: () => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I am having trouble connecting. Please try again in a moment.",
        },
      ]);
    },
  });

  // scroll to bottom whenever messages change or while loading
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, chatMutation.isPending]);

  /**
   * Submit a message to the chat endpoint.
   * @param text - optional override; falls back to the input field value
   */
  function send(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg || chatMutation.isPending) return;
    const userMessage: Message = { role: "user", content: msg };
    const next = [...messages, userMessage];
    setMessages(next);
    setInput("");
    chatMutation.mutate({ message: msg, history: messages });
  }

  // hide entirely for unauthenticated visitors
  if (!isAuthenticated) return null;

  return (
    <>
      {/* floating toggle button */}
      <button
        onClick={() => setOpen((p) => !p)}
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 200,
          width: 52,
          height: 52,
          borderRadius: "50%",
          background: "linear-gradient(135deg,#e83151,#dba13d)",
          border: "none",
          cursor: "pointer",
          display: "grid",
          placeItems: "center",
          boxShadow: "0 4px 20px rgba(232,49,81,0.4)",
          transition: "transform 0.15s",
        }}
        aria-label="Open chat assistant"
      >
        <span className="ms" style={{ fontSize: 22, color: "white" }}>
          {open ? "close" : "chat"}
        </span>
      </button>

      {/* chat window */}
      {open && (
        <div
          style={{
            position: "fixed",
            bottom: 88,
            right: 24,
            zIndex: 200,
            width: 360,
            height: 520,
            background: "var(--surface)",
            borderRadius: 20,
            border: "1px solid var(--outline)",
            boxShadow: "0 16px 60px rgba(0,0,0,0.18)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* header */}
          <div
            style={{
              padding: "14px 18px",
              background: "linear-gradient(135deg,#050a26,#121d3f)",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "linear-gradient(135deg,#e83151,#dba13d)",
                display: "grid",
                placeItems: "center",
              }}
            >
              <span className="ms" style={{ fontSize: 16, color: "white" }}>
                smart_toy
              </span>
            </div>
            <div>
              <p
                style={{
                  fontFamily: "Space Grotesk, sans-serif",
                  fontWeight: 700,
                  fontSize: 14,
                  color: "white",
                  letterSpacing: "-0.02em",
                }}
              >
                Sansaar Assistant
              </p>
              <p
                style={{
                  fontSize: 10.5,
                  color: "rgba(255,255,255,0.6)",
                  fontFamily: "Manrope, sans-serif",
                }}
              >
                Powered by NLP
              </p>
            </div>
            {/* online indicator */}
            <div
              style={{
                marginLeft: "auto",
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#16a34a",
              }}
            />
          </div>

          {/* message list */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "14px 16px",
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: m.role === "user" ? "flex-end" : "flex-start",
                  gap: 8,
                }}
              >
                <div
                  style={{
                    maxWidth: "80%",
                    padding: "10px 14px",
                    borderRadius: m.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                    background:
                      m.role === "user" ? "linear-gradient(135deg,#e83151,#dba13d)" : "var(--low)",
                    color: m.role === "user" ? "white" : "var(--on-bg)",
                    fontSize: 13,
                    fontFamily: "Manrope, sans-serif",
                    lineHeight: 1.55,
                  }}
                >
                  {m.content}
                </div>
                {/* event cards attached to assistant messages */}
                {m.events && m.events.length > 0 && (
                  <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 6 }}>
                    {m.events.map((ev) => (
                      <div
                        key={ev.id}
                        onClick={() => navigate(`/events/${ev.id}`)}
                        style={{
                          padding: "10px 14px",
                          borderRadius: 12,
                          border: "1px solid var(--outline)",
                          background: "var(--surface)",
                          cursor: "pointer",
                          transition: "background 0.15s",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--low)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "var(--surface)")}
                      >
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: 12.5,
                            marginBottom: 4,
                            fontFamily: "Manrope, sans-serif",
                          }}
                        >
                          {ev.title}
                        </div>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <span
                            style={{
                              fontSize: 10.5,
                              fontFamily: "JetBrains Mono, monospace",
                              color: "var(--on-mut)",
                              textTransform: "uppercase",
                            }}
                          >
                            {ev.event_type}
                          </span>
                          <span
                            style={{
                              fontSize: 10.5,
                              padding: "1px 8px",
                              borderRadius: 10,
                              background: ev.is_free ? "#dcfce7" : "#eff6ff",
                              color: ev.is_free ? "#166534" : "#1e40af",
                              fontWeight: 700,
                            }}
                          >
                            {ev.is_free ? "Free" : "Paid"}
                          </span>
                          {ev.start_date && (
                            <span
                              style={{
                                fontSize: 10,
                                color: "var(--on-mut)",
                                fontFamily: "JetBrains Mono, monospace",
                                marginLeft: "auto",
                              }}
                            >
                              {new Date(ev.start_date).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* typing indicator while waiting for a response */}
            {chatMutation.isPending && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div
                  style={{
                    padding: "10px 16px",
                    borderRadius: "16px 16px 16px 4px",
                    background: "var(--low)",
                    display: "flex",
                    gap: 4,
                    alignItems: "center",
                  }}
                >
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: "var(--on-mut)",
                        display: "inline-block",
                        animation: `bounce 1.2s ${i * 0.2}s infinite`,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* suggestion chips - only visible before the first user message */}
          {messages.length === 1 && (
            <div
              style={{
                padding: "0 12px 8px",
                display: "flex",
                flexWrap: "wrap",
                gap: 6,
              }}
            >
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  style={{
                    padding: "5px 10px",
                    borderRadius: 20,
                    border: "1px solid var(--outline)",
                    background: "var(--surface)",
                    cursor: "pointer",
                    fontSize: 11,
                    fontFamily: "Manrope, sans-serif",
                    color: "var(--on-var)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* input bar */}
          <div
            style={{
              padding: "10px 14px",
              borderTop: "1px solid var(--outline)",
              display: "flex",
              gap: 8,
              alignItems: "center",
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
              placeholder="Ask me anything..."
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                background: "transparent",
                fontFamily: "Manrope, sans-serif",
                fontSize: 13,
                color: "var(--on-bg)",
              }}
            />
            <button
              onClick={() => send()}
              disabled={!input.trim() || chatMutation.isPending}
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: input.trim() ? "linear-gradient(135deg,#e83151,#dba13d)" : "var(--mid)",
                border: "none",
                cursor: input.trim() ? "pointer" : "default",
                display: "grid",
                placeItems: "center",
                transition: "background 0.15s",
                flexShrink: 0,
              }}
            >
              <span className="ms" style={{ fontSize: 16, color: "white" }}>
                send
              </span>
            </button>
          </div>
        </div>
      )}

      {/* keyframe for the typing-indicator dots */}
      <style>{`@keyframes bounce { 0%,80%,100% { transform: scale(0); } 40% { transform: scale(1); } }`}</style>
    </>
  );
}
