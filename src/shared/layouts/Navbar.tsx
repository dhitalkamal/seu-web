import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth/hooks/useAuth";

const NAV_LINKS = [
  { to: "/events", label: "Events" },
  { to: "/events/mine", label: "My events", auth: true },
  { to: "/tickets", label: "Tickets", auth: true },
];

/** Floating frosted-glass pill navbar — fixed, scroll-aware. */
export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logoutMutation } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 20);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function handleLogout() {
    logoutMutation.mutate(undefined, { onSettled: () => navigate("/login") });
  }

  return (
    <nav
      className="fixed top-4 left-1/2 z-50 flex items-center justify-between px-6 transition-all duration-300"
      style={{
        transform: "translateX(-50%)",
        width: "calc(100% - 48px)",
        maxWidth: "1280px",
        borderRadius: "16px",
        padding: "12px 20px",
        background: scrolled ? "rgba(255,255,255,0.97)" : "rgba(255,255,255,0.72)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        boxShadow: scrolled
          ? "0 4px 24px rgba(18,29,63,0.12), 0 1px 4px rgba(18,29,63,0.06)"
          : "0 8px 32px rgba(0,0,0,0.06)",
      }}
    >
      {/* logo */}
      <Link to="/" className="flex items-center gap-3 no-underline">
        <div
          className="grid place-items-center text-white font-bold text-sm flex-shrink-0"
          style={{
            width: 34,
            height: 34,
            borderRadius: 9,
            background: "linear-gradient(135deg, #050a26, #121d3f)",
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 14,
          }}
        >
          S
        </div>
        <span
          className="font-bold text-[var(--on-bg)] leading-none"
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 17,
            letterSpacing: "-0.02em",
          }}
        >
          Sansaar
        </span>
      </Link>

      {/* centre links */}
      <div className="hidden sm:flex items-center gap-7">
        {NAV_LINKS.filter((l) => !l.auth || isAuthenticated).map((l) => {
          const active = location.pathname === l.to || location.pathname.startsWith(l.to + "/");
          return (
            <Link
              key={l.to}
              to={l.to}
              className="relative text-sm font-medium transition-colors no-underline"
              style={{
                color: active ? "var(--on-bg)" : "var(--on-var)",
                fontFamily: "Manrope, sans-serif",
              }}
            >
              {l.label}
              {active && (
                <span
                  className="absolute left-0 right-0"
                  style={{ bottom: -4, height: 2, background: "var(--secondary)", borderRadius: 2 }}
                />
              )}
            </Link>
          );
        })}
        {isAuthenticated && (
          <Link
            to="/notifications"
            className="text-sm font-medium text-[var(--on-var)] hover:text-[var(--on-bg)] transition-colors no-underline"
            style={{ fontFamily: "Manrope, sans-serif" }}
          >
            🔔
          </Link>
        )}
      </div>

      {/* right CTAs */}
      <div className="flex items-center gap-2">
        {isAuthenticated ? (
          <>
            <Link
              to="/settings"
              className="text-sm font-semibold text-[var(--on-bg)] no-underline"
              style={{ fontFamily: "Manrope, sans-serif" }}
            >
              {user?.first_name ?? "Account"}
            </Link>
            <button
              onClick={handleLogout}
              className="text-sm font-medium text-[var(--on-var)] hover:text-[var(--secondary)] transition-colors"
              style={{
                fontFamily: "Manrope, sans-serif",
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              Sign out
            </button>
          </>
        ) : (
          <>
            <Link
              to="/login"
              className="text-sm font-semibold no-underline transition-colors"
              style={{
                padding: "8px 14px",
                borderRadius: 10,
                color: "var(--on-bg)",
                fontFamily: "Manrope, sans-serif",
                border: "1px solid var(--outline-strong)",
              }}
            >
              Sign in
            </Link>
            <Link
              to="/register"
              className="text-sm font-semibold text-white no-underline transition-all hover:opacity-90"
              style={{
                padding: "8px 16px",
                borderRadius: 10,
                background: "linear-gradient(135deg, #050a26, #121d3f)",
                fontFamily: "Manrope, sans-serif",
              }}
            >
              Get started
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
