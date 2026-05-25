import type { ReactNode } from "react";
import { Link } from "react-router-dom";

type Props = {
  title: string;
  titleAccent?: string;
  subtitle?: string;
  eyebrow?: string;
  children: ReactNode;
};

/**
 * Clean white auth layout — SEU Platform v8.
 * Light background with subtle accent blobs, centred card with soft shadow.
 */
export default function AuthLayout({ title, titleAccent, subtitle, eyebrow, children }: Props) {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden"
      style={{ background: "#f7f8fa" }}
    >
      {/* subtle decorative blobs — very faint, keeps the page from feeling flat */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 55% 55% at 80% 15%, rgba(5,10,38,0.04), transparent 60%), radial-gradient(ellipse 45% 50% at 10% 85%, rgba(5,10,38,0.03), transparent 60%)",
        }}
      />

      {/* logo top-centre */}
      <Link
        to="/"
        className="absolute top-6 left-1/2 flex items-center gap-3 no-underline"
        style={{ transform: "translateX(-50%)" }}
      >
        <div
          className="grid place-items-center text-white font-bold"
          style={{
            width: 32,
            height: 32,
            borderRadius: 9,
            background: "linear-gradient(135deg, #050a26, #121d3f)",
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 13,
          }}
        >
          S
        </div>
        <span
          className="font-bold"
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 16,
            letterSpacing: "-0.02em",
            color: "#050a26",
          }}
        >
          Sansaar
        </span>
      </Link>

      {/* modal card */}
      <div
        className="relative w-full"
        style={{
          maxWidth: 480,
          background: "#ffffff",
          borderRadius: 24,
          padding: "40px",
          border: "1px solid var(--outline)",
          boxShadow: "0 4px 24px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)",
        }}
      >
        {/* header */}
        <div className="mb-6">
          {eyebrow && (
            <p
              className="mb-2"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10.5,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--on-mut)",
              }}
            >
              {eyebrow}
            </p>
          )}
          <h1
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 600,
              fontSize: 26,
              letterSpacing: "-0.035em",
              lineHeight: 1.1,
              color: "#050a26",
            }}
          >
            {title}{" "}
            {titleAccent && (
              <span
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontStyle: "italic",
                  fontWeight: 500,
                  color: "var(--primary)",
                }}
              >
                {titleAccent}
              </span>
            )}
          </h1>
          {subtitle && (
            <p
              className="mt-2"
              style={{ fontSize: 13.5, color: "var(--on-var)", fontFamily: "Manrope, sans-serif" }}
            >
              {subtitle}
            </p>
          )}
        </div>

        {children}
      </div>
    </div>
  );
}
