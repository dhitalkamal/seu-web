import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import PublicLayout from "@/shared/layouts/PublicLayout";
import paymentApi from "../api/payment.api";

/** Shown after a successful payment gateway redirect. */
export default function SuccessPage() {
  const [params] = useSearchParams();
  const orderId = params.get("order_id") ?? "";

  const { data: order } = useQuery({
    queryKey: ["order", orderId],
    queryFn: () => paymentApi.getOrder(orderId),
    enabled: !!orderId,
  });

  return (
    <PublicLayout>
      <div
        className="flex flex-col items-center text-center"
        style={{ maxWidth: 520, margin: "0 auto", padding: "60px 24px 80px" }}
      >
        {/* success icon */}
        <div
          className="grid place-items-center mb-6"
          style={{ width: 72, height: 72, borderRadius: "50%", background: "#d8efe2" }}
        >
          <span className="ms" style={{ fontSize: 36, color: "var(--success)" }}>
            check_circle
          </span>
        </div>

        <h1
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 600,
            fontSize: 32,
            letterSpacing: "-0.04em",
            color: "var(--on-bg)",
            marginBottom: 12,
          }}
        >
          Payment successful!
        </h1>

        <p
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontStyle: "italic",
            fontSize: 19,
            color: "var(--on-var)",
            lineHeight: 1.5,
            marginBottom: 28,
            maxWidth: "34ch",
          }}
        >
          Your registration is confirmed. Check My Tickets for your QR code.
        </p>

        {order && (
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--outline)",
              borderRadius: 14,
              padding: "20px 28px",
              marginBottom: 28,
              width: "100%",
            }}
          >
            <p
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--on-mut)",
                marginBottom: 6,
              }}
            >
              Order #{order.id.slice(0, 8)}
            </p>
            <div className="flex justify-between items-center">
              <span
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontWeight: 700,
                  fontSize: 20,
                  color: "var(--on-bg)",
                  letterSpacing: "-0.03em",
                }}
              >
                NPR {order.total_amount}
              </span>
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 10,
                  padding: "3px 9px",
                  borderRadius: 999,
                  background: "#dcfce7",
                  color: "#16a34a",
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}
              >
                {order.status}
              </span>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <Link
            to="/tickets"
            className="no-underline font-semibold transition-colors"
            style={{
              padding: "11px 22px",
              borderRadius: 10,
              border: "1px solid var(--outline)",
              background: "white",
              color: "var(--on-bg)",
              fontSize: 14,
              fontFamily: "Manrope, sans-serif",
            }}
          >
            My tickets
          </Link>
          <Link
            to="/"
            className="no-underline font-semibold text-white transition-opacity hover:opacity-90"
            style={{
              padding: "11px 22px",
              borderRadius: 10,
              background: "linear-gradient(135deg, #050a26, #121d3f)",
              fontSize: 14,
              fontFamily: "Manrope, sans-serif",
            }}
          >
            Browse events
          </Link>
        </div>
      </div>
    </PublicLayout>
  );
}
