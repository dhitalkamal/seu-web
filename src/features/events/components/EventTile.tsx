import { Link } from "react-router-dom";
import type { Event } from "@/features/events/types/event.types";

type Props = { event: Event };

/** SEU-design event card — image hero, serif description, price/spots footer. */
export default function EventTile({ event }: Props) {
  const date = new Date(event.start_date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  const spots = event.capacity - event.registered_count;
  const priceDisplay = event.is_free ? "Free" : `NPR ${parseFloat(event.price).toLocaleString()}`;

  return (
    <Link
      to={`/events/${event.id}`}
      className="block no-underline group"
      style={{ textDecoration: "none" }}
    >
      <article
        className="overflow-hidden transition-all duration-200"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--outline)",
          borderRadius: 18,
          boxShadow: "0 2px 12px rgba(18,29,63,0.06), 0 6px 24px rgba(18,29,63,0.04)",
        }}
      >
        {/* image area */}
        <div
          className="relative overflow-hidden"
          style={{
            height: 180,
            background: "linear-gradient(135deg, var(--low), var(--mid))",
          }}
        >
          {/* placeholder gradient with event initial */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className="font-bold text-[var(--on-mut)] opacity-30"
              style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 64, letterSpacing: "-0.04em" }}
            >
              {event.title.charAt(0)}
            </span>
          </div>

          {/* date pill */}
          <div
            className="absolute top-3 left-3 z-10"
            style={{
              padding: "4px 10px",
              borderRadius: 8,
              background: "rgba(255,255,255,0.95)",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
              fontWeight: 700,
              color: "var(--primary)",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            {date}
          </div>

          {/* status pill */}
          {event.status !== "published" && (
            <div
              className="absolute top-3 right-3 z-10"
              style={{
                padding: "3px 9px",
                borderRadius: 999,
                background: event.status === "draft" ? "var(--low)" : "rgba(232,49,81,0.1)",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 9,
                fontWeight: 700,
                color: event.status === "draft" ? "var(--on-var)" : "var(--secondary)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              {event.status}
            </div>
          )}
        </div>

        {/* body */}
        <div style={{ padding: "18px 20px 0" }}>
          {/* org/location eyebrow */}
          <p
            className="mb-2 truncate"
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--secondary)",
            }}
          >
            {event.location}
          </p>

          {/* title */}
          <h3
            className="line-clamp-2 leading-tight mb-2"
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 600,
              fontSize: 17,
              letterSpacing: "-0.02em",
              color: "var(--on-surf)",
            }}
          >
            {event.title}
          </h3>

          {/* description — serif italic */}
          <p
            className="line-clamp-2 mb-4"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontStyle: "italic",
              fontSize: 15,
              lineHeight: 1.5,
              color: "var(--on-var)",
            }}
          >
            {event.description}
          </p>
        </div>

        {/* footer */}
        <div
          className="flex items-center justify-between"
          style={{
            padding: "12px 20px 16px",
            borderTop: "1px solid var(--outline)",
          }}
        >
          <span
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 700,
              fontSize: 15,
              letterSpacing: "-0.02em",
              color: "var(--on-surf)",
            }}
          >
            {priceDisplay}
          </span>
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
              fontWeight: 500,
              color: "var(--on-mut)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            {spots > 0 ? `${spots.toLocaleString()} spots` : "Sold out"}
          </span>
        </div>
      </article>
    </Link>
  );
}
