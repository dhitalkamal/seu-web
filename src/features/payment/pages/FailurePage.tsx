import { useNavigate } from "react-router-dom";
import { MS } from "@/shared/components/v8";

export default function FailurePage() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "grid", placeItems: "center", padding: 32 }}>
      <div style={{ textAlign: "center", maxWidth: 440 }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#fee2e2", display: "grid", placeItems: "center", margin: "0 auto 20px" }}>
          <MS n="cancel" size={40} style={{ color: "#991b1b" }} />
        </div>
        <h1 style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: 28, letterSpacing: "-0.03em", marginBottom: 8 }}>
          Payment failed
        </h1>
        <p style={{ fontSize: 14, color: "var(--on-var)", fontFamily: "Manrope, sans-serif", lineHeight: 1.6, marginBottom: 8 }}>
          Your payment could not be processed. You have not been charged.
        </p>
        <p style={{ fontSize: 13, color: "var(--on-mut)", fontFamily: "Manrope, sans-serif", lineHeight: 1.6, marginBottom: 24 }}>
          Please check your payment details and try again. If the issue persists, contact your bank or try a different payment method.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <button
            onClick={() => navigate("/org/pricing")}
            style={{
              padding: "12px 28px", borderRadius: 12, border: "none",
              background: "#050a26", color: "white", fontSize: 14, fontWeight: 700,
              fontFamily: "Manrope, sans-serif", cursor: "pointer",
            }}
          >
            Try again
          </button>
          <button
            onClick={() => navigate("/events")}
            style={{
              padding: "12px 28px", borderRadius: 12, border: "1px solid var(--mid)",
              background: "transparent", color: "var(--on-var)", fontSize: 14, fontWeight: 600,
              fontFamily: "Manrope, sans-serif", cursor: "pointer",
            }}
          >
            Browse events
          </button>
        </div>
      </div>
    </div>
  );
}
