import { useNavigate, useSearchParams } from "react-router-dom";
import { MS } from "@/shared/components/v8";

export default function SuccessPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const sessionId = params.get("session_id") ?? params.get("paypal_token") ?? "";

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "grid", placeItems: "center", padding: 32 }}>
      <div style={{ textAlign: "center", maxWidth: 440 }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#dcfce7", display: "grid", placeItems: "center", margin: "0 auto 20px" }}>
          <MS n="check_circle" size={40} style={{ color: "#166534" }} />
        </div>
        <h1 style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: 28, letterSpacing: "-0.03em", marginBottom: 8 }}>
          Payment successful
        </h1>
        <p style={{ fontSize: 14, color: "var(--on-var)", fontFamily: "Manrope, sans-serif", lineHeight: 1.6, marginBottom: 24 }}>
          Your payment has been processed. You can now access all features included in your plan.
        </p>
        {sessionId && (
          <p style={{ fontSize: 11, color: "var(--on-mut)", fontFamily: "JetBrains Mono, monospace", marginBottom: 20 }}>
            Reference: {sessionId.slice(0, 16)}...
          </p>
        )}
        <button
          onClick={() => navigate("/org/dashboard")}
          style={{
            padding: "12px 28px", borderRadius: 12, border: "none",
            background: "#050a26", color: "white", fontSize: 14, fontWeight: 700,
            fontFamily: "Manrope, sans-serif", cursor: "pointer",
          }}
        >
          Go to dashboard
        </button>
      </div>
    </div>
  );
}
