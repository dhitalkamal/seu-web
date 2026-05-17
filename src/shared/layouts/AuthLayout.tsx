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
 * Glass-modal auth layout on a dark radial gradient background.
 * SEU Platform v8 sign-up/sign-in modal design.
 */
export default function AuthLayout({ title, titleAccent, subtitle, eyebrow, children }: Props) {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden"
      style={{ background: "radial-gradient(ellipse at top, #1a2750 0%, #050a26 70%)" }}
    >
      {/* bloom accents */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 50% 60% at 80% 20%, rgba(232,49,81,0.2), transparent 60%), radial-gradient(ellipse 40% 50% at 15% 80%, rgba(219,161,61,0.14), transparent 60%)",
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
            background: "linear-gradient(135deg, #e83151, #dba13d)",
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 13,
          }}
        >
          S
        </div>
        <span
          className="font-bold text-white"
          style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, letterSpacing: "-0.02em" }}
        >
          Sansaar
        </span>
      </Link>

      {/* modal card */}
      <div
        className="relative w-full"
        style={{
          maxWidth: 480,
          background: "var(--surface)",
          borderRadius: 24,
          padding: "40px",
          boxShadow: "0 32px 80px rgba(0,0,0,0.3), 0 8px 24px rgba(0,0,0,0.15)",
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
                color: "var(--secondary)",
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
              color: "var(--on-bg)",
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
            <p className="mt-2" style={{ fontSize: 13.5, color: "var(--on-var)", fontFamily: "Manrope, sans-serif" }}>
              {subtitle}
            </p>
          )}
        </div>

        {children}
      </div>
    </div>
  );
}
