import { Link, useSearchParams } from "react-router-dom";
import PublicLayout from "@/shared/layouts/PublicLayout";

/** Shown after a failed or cancelled payment. */
export default function FailurePage() {
  const [params] = useSearchParams();
  const eventId = params.get("event_id") ?? "";

  return (
    <PublicLayout>
      <div className="flex flex-col items-center text-center" style={{ maxWidth: 520, margin: "0 auto", padding: "60px 24px 80px" }}>
        {/* failure icon */}
        <div
          className="grid place-items-center mb-6"
          style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(232,49,81,0.1)" }}
        >
          <span className="ms" style={{ fontSize: 36, color: "var(--secondary)" }}>cancel</span>
        </div>

        <h1
          style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 32, letterSpacing: "-0.04em", color: "var(--on-bg)", marginBottom: 12 }}
        >
          Payment failed
        </h1>

        <p
          style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: 19, color: "var(--on-var)", lineHeight: 1.5, marginBottom: 28, maxWidth: "34ch" }}
        >
          Your payment could not be processed. You have not been charged.
        </p>

        <div
          style={{ background: "rgba(232,49,81,0.06)", border: "1px solid rgba(232,49,81,0.15)", borderRadius: 12, padding: "14px 20px", marginBottom: 28, width: "100%" }}
        >
          <p style={{ fontSize: 13, color: "var(--secondary)", fontFamily: "Manrope, sans-serif" }}>
            Please check your payment details and try again. If the issue persists, contact your bank.
          </p>
        </div>

        <div className="flex gap-3">
          {eventId && (
            <Link
              to={`/events/${eventId}`}
              className="no-underline font-semibold transition-colors"
              style={{ padding: "11px 22px", borderRadius: 10, border: "1px solid var(--outline)", background: "white", color: "var(--on-bg)", fontSize: 14, fontFamily: "Manrope, sans-serif" }}
            >
              Try again
            </Link>
          )}
          <Link
            to="/"
            className="no-underline font-semibold text-white transition-opacity hover:opacity-90"
            style={{ padding: "11px 22px", borderRadius: 10, background: "linear-gradient(135deg, #050a26, #121d3f)", fontSize: 14, fontFamily: "Manrope, sans-serif" }}
          >
            Browse events
          </Link>
        </div>
      </div>
    </PublicLayout>
  );
}
