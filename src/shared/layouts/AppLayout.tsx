import type { ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useAuthStore } from "@/shared/store/auth.store";

type NavItem = { to: string; icon: string; label: string; badge?: string };

const ORG_NAV: NavItem[] = [
  { to: "/events/mine", icon: "event", label: "Events" },
  { to: "/events/create", icon: "add_circle", label: "Create event" },
  { to: "/tickets", icon: "confirmation_number", label: "My tickets" },
  { to: "/notifications", icon: "notifications", label: "Notifications" },
  { to: "/settings", icon: "settings", label: "Settings" },
];


type Props = {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
};

/**
 * Authenticated app shell — sidebar + frosted topbar, matches SEU v8 .app-shell design.
 * Used by all organiser, attendee, and profile pages.
 */
export default function AppLayout({ children, title, subtitle, actions }: Props) {
  const navigate = useNavigate();
  const { logoutMutation } = useAuth();
  const user = useAuthStore((s) => s.user);

  const navItems = ORG_NAV;
  const initials = user ? `${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`.toUpperCase() || "U" : "U";

  function handleLogout() {
    logoutMutation.mutate(undefined, { onSettled: () => navigate("/login") });
  }

  return (
    <div
      className="flex min-h-screen"
      style={{ background: "var(--bg)" }}
    >
      {/* sidebar */}
      <aside
        className="hidden md:flex flex-col gap-3 h-screen sticky top-0 flex-shrink-0 overflow-hidden"
        style={{
          width: 260,
          background: "var(--surface)",
          borderRight: "1px solid var(--outline)",
          padding: "18px 14px",
        }}
      >
        {/* brand */}
        <div
          className="flex items-center gap-3 pb-4"
          style={{ borderBottom: "1px solid var(--outline)" }}
        >
          <div
            className="grid place-items-center text-white font-bold flex-shrink-0"
            style={{
              width: 36,
              height: 36,
              borderRadius: 9,
              background: "linear-gradient(135deg, #050a26, #121d3f)",
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 15,
            }}
          >
            S
          </div>
          <div>
            <p
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 700,
                fontSize: 14.5,
                letterSpacing: "-0.02em",
                color: "var(--on-bg)",
              }}
            >
              Sansaar
            </p>
            <p
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.04em",
                color: "var(--secondary)",
                marginTop: 1,
              }}
            >
              Event Universe
            </p>
          </div>
        </div>

        {/* user chip */}
        <div
          className="flex items-center gap-3 rounded-xl"
          style={{ background: "var(--low)", padding: "9px 11px" }}
        >
          <div
            className="grid place-items-center text-white font-bold flex-shrink-0"
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #050a26, #121d3f)",
              fontSize: 11,
              fontFamily: "Manrope, sans-serif",
            }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p
              className="truncate"
              style={{ fontWeight: 700, fontSize: 12.5, color: "var(--on-bg)", fontFamily: "Manrope, sans-serif" }}
            >
              {user?.first_name} {user?.last_name}
            </p>
            <p
              className="truncate"
              style={{ fontSize: 10, color: "var(--on-mut)", marginTop: 1, fontFamily: "Manrope, sans-serif" }}
            >
              {user?.email}
            </p>
          </div>
        </div>

        {/* nav */}
        <nav className="flex flex-col gap-0.5 flex-1">
          {navItems.map(({ to, icon, label, badge }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/events/mine"}
              className="no-underline"
              style={({ isActive }) => ({
                display: "flex",
                alignItems: "center",
                gap: 11,
                padding: "7px 10px",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: isActive ? 600 : 500,
                fontFamily: "Manrope, sans-serif",
                color: isActive ? "white" : "var(--on-var)",
                background: isActive ? "#050a26" : "transparent",
                transition: "all 150ms",
              })}
            >
              {({ isActive }) => (
                <>
                  <span
                    className="ms"
                    style={{ fontSize: 17, color: isActive ? "var(--tertiary)" : "var(--on-mut)", flexShrink: 0 }}
                  >
                    {icon}
                  </span>
                  <span className="flex-1">{label}</span>
                  {badge && (
                    <span
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 9.5,
                        padding: "1px 6px",
                        borderRadius: 4,
                        background: isActive ? "rgba(255,255,255,0.12)" : "var(--mid)",
                        color: isActive ? "white" : "var(--on-mut)",
                      }}
                    >
                      {badge}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* sign out */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full text-left rounded-lg transition-colors hover:bg-[var(--low)]"
          style={{
            padding: "7px 10px",
            fontSize: 13,
            fontFamily: "Manrope, sans-serif",
            color: "var(--on-mut)",
            background: "none",
            border: "none",
            cursor: "pointer",
          }}
        >
          <span className="ms" style={{ fontSize: 17 }}>logout</span>
          Sign out
        </button>
      </aside>

      {/* main col */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* topbar */}
        <header
          className="flex items-center justify-between flex-shrink-0"
          style={{
            background: "rgba(244,245,247,0.85)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderBottom: "1px solid var(--outline)",
            padding: "14px 28px",
          }}
        >
          <div />
          <div className="flex items-center gap-2">
            <NavLink
              to="/notifications"
              className="grid place-items-center no-underline"
              style={{
                width: 36,
                height: 36,
                borderRadius: 9,
                border: "1px solid var(--outline)",
                background: "transparent",
                color: "var(--on-var)",
              }}
            >
              <span className="ms" style={{ fontSize: 18 }}>notifications</span>
            </NavLink>
            <NavLink
              to="/events/create"
              className="inline-flex items-center gap-1 text-white no-underline font-semibold"
              style={{
                padding: "7px 14px",
                borderRadius: 9,
                background: "linear-gradient(135deg, #050a26, #121d3f)",
                fontSize: 12.5,
                fontFamily: "Manrope, sans-serif",
              }}
            >
              <span className="ms" style={{ fontSize: 15 }}>add</span>
              New event
            </NavLink>
          </div>
        </header>

        {/* page content */}
        <main className="flex-1 overflow-y-auto" style={{ padding: "28px 32px 60px" }}>
          {(title || actions) && (
            <div
              className="flex items-start justify-between gap-6 flex-wrap mb-7"
            >
              <div>
                {title && (
                  <h1
                    style={{
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontWeight: 600,
                      fontSize: 28,
                      letterSpacing: "-0.035em",
                      lineHeight: 1.05,
                      color: "var(--on-bg)",
                      marginBottom: subtitle ? 6 : 0,
                    }}
                  >
                    {title}
                  </h1>
                )}
                {subtitle && (
                  <p style={{ fontSize: 14, color: "var(--on-var)", fontFamily: "Manrope, sans-serif" }}>
                    {subtitle}
                  </p>
                )}
              </div>
              {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
