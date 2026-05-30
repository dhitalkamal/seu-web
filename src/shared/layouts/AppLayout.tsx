import { useState, useRef, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth, useProfileBootstrap } from "@/features/auth/hooks/useAuth";
import { useAuthStore } from "@/shared/store/auth.store";
import { useOrgStore, isOrgActive } from "@/shared/store/org.store";
import { usePreferencesStore } from "@/shared/store/preferences.store";
import { useOrgContext } from "@/features/orgs/hooks/useOrgContext";
import UserAvatar from "@/shared/components/UserAvatar";
import { useCrumbStore } from "@/shared/hooks/useCrumbs";
import eventsApi from "@/features/events/api/events.api";
import type { Event } from "@/features/events/types/event.types";
import notificationsApi from "@/features/notifications/api/notifications.api";
import type { Notification } from "@/features/notifications/api/notifications.api";

type NavItem = { to: string; icon: string; label: string; badge?: string };
type NavSection = { section: string; items: NavItem[] };

const ORG_NAV: NavSection[] = [
  {
    section: "Workspace",
    items: [
      { to: "/org/dashboard", icon: "space_dashboard", label: "Overview" },
      { to: "/org/events", icon: "event", label: "Events" },
      { to: "/org/participation", icon: "how_to_reg", label: "Participation" },
      { to: "/org/sponsors", icon: "handshake", label: "Sponsors" },
      { to: "/org/taxonomy", icon: "category", label: "Taxonomy" },
    ],
  },
  {
    section: "Operations",
    items: [
      { to: "/org/venues", icon: "place", label: "Venues" },
      { to: "/org/volunteer-apps", icon: "assignment_ind", label: "Volunteer Apps", badge: "12" },
      { to: "/org/checkin", icon: "qr_code_scanner", label: "Check-in" },
      { to: "/org/waitlist", icon: "hourglass_top", label: "Waitlist", badge: "34" },
      { to: "/org/team", icon: "group", label: "Team" },
    ],
  },
  {
    section: "Numbers",
    items: [
      { to: "/org/analytics", icon: "analytics", label: "Analytics" },
      { to: "/org/event-health", icon: "monitor_heart", label: "Event Health" },
      { to: "/org/finance", icon: "payments", label: "Finance" },
      { to: "/org/reports", icon: "description", label: "Reports" },
      { to: "/org/pricing", icon: "workspace_premium", label: "Pricing & Plans" },
    ],
  },
  {
    section: "Help",
    items: [{ to: "/org/support", icon: "support_agent", label: "Support" }],
  },
];

/** Nav sections for user/attendee context - discover, tickets, saved events.
 *  Profile & Settings are accessed from the topbar avatar, not the sidebar. */
const USER_NAV: NavSection[] = [
  {
    section: "Discover",
    items: [
      { to: "/events", icon: "explore", label: "Browse Events" },
      { to: "/search", icon: "search", label: "Search" },
    ],
  },
  {
    section: "My Events",
    items: [
      { to: "/tickets", icon: "confirmation_number", label: "My Tickets" },
      { to: "/history", icon: "history", label: "Past Events" },
      { to: "/saved", icon: "bookmark", label: "Saved Events" },
    ],
  },
  {
    section: "Connect",
    items: [
      { to: "/community", icon: "forum", label: "Community" },
      { to: "/networking", icon: "diversity_3", label: "Networking" },
    ],
  },
  {
    section: "Help",
    items: [{ to: "/support", icon: "support_agent", label: "Support" }],
  },
];

/** Nav sections for volunteer context - dashboard, shifts, applications, progress. */
const VOLUNTEER_NAV: NavSection[] = [
  {
    section: "Dashboard",
    items: [
      { to: "/volunteer", icon: "volunteer_activism", label: "Overview" },
      { to: "/volunteer/applications", icon: "assignment", label: "Applications" },
    ],
  },
  {
    section: "My Work",
    items: [
      { to: "/volunteer/shifts", icon: "schedule", label: "My Shifts" },
      { to: "/volunteer/hours", icon: "timer", label: "Hours Log" },
    ],
  },
  {
    section: "Achievements",
    items: [{ to: "/volunteer/certificates", icon: "workspace_premium", label: "Certificates" }],
  },
];

type Props = {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  crumbs?: string[];
  variant?: "org" | "user" | "volunteer";
};

/** Authenticated two-column shell: SEU v8 sidebar + frosted topbar. */
export default function AppLayout({
  children,
  title,
  subtitle,
  actions,
  crumbs: propCrumbs,
  variant = "org",
}: Props) {
  const navigate = useNavigate();
  const storeCrumbs = useCrumbStore((s) => s.crumbs);
  const crumbs = propCrumbs && propCrumbs.length > 0 ? propCrumbs : storeCrumbs;
  const location = useLocation();
  const { logoutMutation } = useAuth();
  const user = useAuthStore((s) => s.user);

  // ! fetch full user profile on mount - replaces the login skeleton with real data
  useProfileBootstrap();

  // ! only fetch org from the API when we're actually on the org dashboard
  // for attendee/volunteer pages we just read the persisted store (no network call)
  useOrgContext({ enabled: variant === "org" });
  const org = useOrgStore((s) => s.org);
  const hasActiveOrg = isOrgActive(org);

  const fullName = user ? `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() : "Account";

  // ! Volunteer mode must be enabled in settings before it shows in the switcher
  const volunteerEnabled = usePreferencesStore((s) => s.volunteerEnabled);

  // ! Derive nav sections and role label from the variant
  const sections = variant === "org" ? ORG_NAV : variant === "volunteer" ? VOLUNTEER_NAV : USER_NAV;
  const roleLabel =
    variant === "org" ? "Organizer" : variant === "volunteer" ? "Volunteer" : "Attendee";

  // ! Build the list of dashboards available to switch TO (excludes current)
  const switchOptions: { label: string; target: string; icon: string }[] = [];
  if (variant !== "user") {
    switchOptions.push({ label: "Attendee", target: "/events", icon: "person" });
  }
  if (variant !== "volunteer" && volunteerEnabled) {
    switchOptions.push({ label: "Volunteer", target: "/volunteer", icon: "volunteer_activism" });
  }
  if (variant !== "org" && hasActiveOrg) {
    switchOptions.push({ label: "Organizer", target: "/org/dashboard", icon: "domain" });
  }

  function handleLogout() {
    logoutMutation.mutate(undefined, { onSettled: () => navigate("/login") });
  }

  return (
    <div className="flex min-h-screen" style={{ background: "var(--bg)" }}>
      {/* sidebar */}
      <aside
        className="hidden md:flex flex-col flex-shrink-0 h-screen sticky top-0 overflow-y-auto"
        style={{
          width: 260,
          background: "var(--surface)",
          borderRight: "1px solid var(--outline)",
          padding: "18px 14px",
          gap: 10,
        }}
      >
        {/* brand */}
        <div
          className="flex items-center gap-3"
          style={{ paddingBottom: 14, borderBottom: "1px solid var(--outline)", flexShrink: 0 }}
        >
          <div
            className="grid place-items-center text-white flex-shrink-0"
            style={{
              width: 36,
              height: 36,
              borderRadius: 9,
              background: "linear-gradient(135deg, #050a26, #121d3f)",
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 700,
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

        {/* nav sections */}
        <nav className="flex flex-col flex-1" style={{ gap: 0, overflowY: "auto" }}>
          {sections.map(({ section, items }) => (
            <div key={section} style={{ marginBottom: 12 }}>
              <p
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 9,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "var(--on-mut)",
                  padding: "4px 10px",
                  marginBottom: 2,
                }}
              >
                {section}
              </p>
              {items.map(({ to, icon, label, badge }) => {
                // ! Exact match for root-level routes that are prefixes of siblings
                const exactRoutes = ["/", "/volunteer", "/org/dashboard", "/org"];
                const isActive = exactRoutes.includes(to)
                  ? location.pathname === to
                  : location.pathname === to || location.pathname.startsWith(to + "/");
                return (
                  <NavLink
                    key={to}
                    to={to}
                    className="no-underline flex items-center gap-3"
                    style={{
                      padding: "7px 10px",
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: isActive ? 600 : 500,
                      fontFamily: "Manrope, sans-serif",
                      color: isActive ? "white" : "var(--on-var)",
                      background: isActive ? "#050a26" : "transparent",
                      marginBottom: 1,
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <span
                      className="ms"
                      style={{
                        fontSize: 17,
                        flexShrink: 0,
                        color: isActive ? "var(--tertiary)" : "var(--on-mut)",
                      }}
                    >
                      {icon}
                    </span>
                    <span className="flex-1">{label}</span>
                    {badge !== undefined && badge !== "" && (
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
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        {/* bottom */}
        <div
          style={{
            paddingTop: 8,
            borderTop: "1px solid var(--outline)",
            display: "flex",
            flexDirection: "column",
            gap: 1,
            flexShrink: 0,
          }}
        >
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full text-left rounded-lg"
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
            <span className="ms" style={{ fontSize: 17 }}>
              logout
            </span>
            Sign out
          </button>
        </div>
      </aside>

      {/* main column - h-screen + overflow-y-auto makes this the scroll container
           so the header inside can be position:sticky relative to it */}
      <div className="flex flex-col flex-1 min-w-0 h-screen overflow-y-auto">
        {/* topbar - always sticky */}
        <header
          className="flex items-center justify-between flex-shrink-0"
          style={{
            position: "sticky",
            top: 0,
            zIndex: 40,
            background: "rgba(244,245,247,0.85)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderBottom: "1px solid var(--outline)",
            padding: "10px 28px",
          }}
        >
          {/* inline global search */}
          <GlobalSearch onNavigate={(path) => navigate(path)} />

          {/* right: role switcher + notifications + profile */}
          <div className="flex items-center gap-3">
            {/* single switcher dropdown - one button, options appear below */}
            {switchOptions.length > 0 && (
              <>
                <RoleSwitcher current={roleLabel} options={switchOptions} />
                {/* divider */}
                <div style={{ width: 1, height: 24, background: "var(--outline)" }} />
              </>
            )}

            <NotificationBell />

            {/* vertical divider between notification bell and profile */}
            <div style={{ width: 1, height: 24, background: "var(--outline)" }} />

            {/* profile display: name + avatar + role badge - org variant goes to org settings */}
            <button
              onClick={() => navigate(variant === "org" ? "/org/settings" : "/profile")}
              className="flex items-center gap-3"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "4px 8px",
                borderRadius: 10,
              }}
            >
              <div style={{ textAlign: "right" }}>
                <p
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontWeight: 700,
                    fontSize: 13.5,
                    letterSpacing: "-0.02em",
                    color: "var(--on-bg)",
                    lineHeight: 1.2,
                    whiteSpace: "nowrap",
                  }}
                >
                  {fullName}
                </p>
                <span
                  style={{
                    display: "inline-block",
                    marginTop: 3,
                    padding: "2px 8px",
                    borderRadius: 5,
                    background: "#fce8d4",
                    color: "#b07030",
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: 10.5,
                    fontWeight: 800,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                  }}
                >
                  {roleLabel}
                </span>
              </div>
              <UserAvatar
                src={user?.avatar_url}
                uid={user?.id ?? ""}
                size={40}
                radius={10}
                style={{ border: "2px solid var(--outline)" }}
              />
            </button>
          </div>
        </header>

        {/* breadcrumb bar - fixed below topbar */}
        {crumbs && crumbs.length > 0 && (
          <div
            className="flex items-center gap-2 flex-shrink-0"
            style={{
              position: "sticky",
              top: 56,
              zIndex: 39,
              background: "var(--bg)",
              borderBottom: "1px solid var(--outline)",
              padding: "0 32px",
              height: 32,
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            {crumbs.map((c, i) => (
              <span key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {i > 0 && (
                  <span style={{ opacity: 0.4, fontFamily: "Manrope, sans-serif", fontSize: 12 }}>
                    /
                  </span>
                )}
                <span
                  style={{
                    color: i === crumbs.length - 1 ? "var(--secondary)" : "var(--on-mut)",
                  }}
                >
                  {c}
                </span>
              </span>
            ))}
          </div>
        )}

        {/* page content */}
        <main className="flex-1" style={{ padding: "28px 32px 60px" }}>

          {(title || actions) && (
            <div className="flex items-start justify-between gap-6 flex-wrap mb-7">
              <div>
                {title && (
                  <h1
                    style={{
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontWeight: 600,
                      fontSize: 32,
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
                  <p
                    style={{
                      fontSize: 14.5,
                      color: "var(--on-var)",
                      fontFamily: "Manrope, sans-serif",
                      maxWidth: "65ch",
                      lineHeight: 1.55,
                    }}
                  >
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

// * --- Role Switcher Dropdown --------------------------------------------------

/** Single-button dropdown to switch between Attendee / Volunteer / Organizer dashboards. */
function RoleSwitcher({
  current,
  options,
}: {
  current: string;
  options: { label: string; target: string; icon: string }[];
}) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // ! Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // ! If there's only one option, just navigate directly - no dropdown needed
  if (options.length === 1) {
    return (
      <button
        onClick={() => navigate(options[0].target)}
        className="flex items-center gap-2"
        style={{
          padding: "6px 14px",
          borderRadius: 9,
          border: "1px solid var(--outline)",
          background: "var(--surface)",
          cursor: "pointer",
          fontSize: 12.5,
          fontFamily: "Manrope, sans-serif",
          fontWeight: 600,
          color: "var(--on-var)",
        }}
      >
        <span className="ms" style={{ fontSize: 16, color: "var(--on-mut)" }}>
          swap_horiz
        </span>
        Switch to {options[0].label}
      </button>
    );
  }

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2"
        style={{
          padding: "6px 14px",
          borderRadius: 9,
          border: "1px solid var(--outline)",
          background: open ? "var(--low)" : "var(--surface)",
          cursor: "pointer",
          fontSize: 12.5,
          fontFamily: "Manrope, sans-serif",
          fontWeight: 600,
          color: "var(--on-var)",
        }}
      >
        <span className="ms" style={{ fontSize: 16, color: "var(--on-mut)" }}>
          swap_horiz
        </span>
        {current}
        <span
          className="ms"
          style={{
            fontSize: 14,
            color: "var(--on-mut)",
            transition: "transform 150ms",
            transform: open ? "rotate(180deg)" : "none",
          }}
        >
          expand_more
        </span>
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            right: 0,
            minWidth: 180,
            background: "var(--surface)",
            border: "1px solid var(--outline)",
            borderRadius: 12,
            boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
            padding: 4,
            zIndex: 100,
          }}
        >
          {options.map((opt) => (
            <button
              key={opt.label}
              onClick={() => {
                setOpen(false);
                navigate(opt.target);
              }}
              className="flex items-center gap-3 w-full"
              style={{
                padding: "9px 12px",
                borderRadius: 8,
                border: "none",
                background: "transparent",
                cursor: "pointer",
                fontSize: 13,
                fontFamily: "Manrope, sans-serif",
                fontWeight: 600,
                color: "var(--on-var)",
                textAlign: "left",
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLElement).style.background = "var(--low)";
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLElement).style.background = "transparent";
              }}
            >
              <span className="ms" style={{ fontSize: 17, color: "var(--on-mut)" }}>
                {opt.icon}
              </span>
              Switch to {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// * --- Global Search ---------------------------------------------------------

type GlobalSearchProps = { onNavigate: (path: string) => void };

/** Inline search bar - type to search events, results drop down without navigation. */
function GlobalSearch({ onNavigate }: GlobalSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const inputRef = useRef<HTMLInputElement>(null);

  /** Debounced search - fires 300ms after the user stops typing. */
  const handleChange = useCallback((value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim()) {
      setResults([]);
      setOpen(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await eventsApi.listPublicEvents({ search: value.trim() });
        setResults(res.results ?? []);
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  }, []);

  /** Close dropdown when clicking outside. */
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /** Keyboard shortcut - Cmd+K or Ctrl+K to focus the search bar. */
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Escape") {
        setOpen(false);
        inputRef.current?.blur();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div ref={wrapperRef} style={{ position: "relative", width: 320 }}>
      <div
        className="flex items-center gap-2"
        style={{
          background: "var(--surface)",
          border: open ? "1px solid var(--primary)" : "1px solid var(--outline)",
          borderRadius: 10,
          padding: "7px 12px",
          transition: "border-color 150ms",
        }}
      >
        <span className="ms" style={{ fontSize: 17, color: "var(--on-mut)" }}>
          search
        </span>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => {
            if (query.trim() && results.length > 0) setOpen(true);
          }}
          placeholder="Search events..."
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
        {loading ? (
          <span
            className="ms"
            style={{ fontSize: 15, color: "var(--on-mut)", animation: "spin 1s linear infinite" }}
          >
            progress_activity
          </span>
        ) : (
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
              padding: "1px 5px",
              borderRadius: 4,
              background: "var(--low)",
              color: "var(--on-mut)",
            }}
          >
            ⌘K
          </span>
        )}
      </div>

      {/* dropdown results */}
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            right: 0,
            background: "var(--surface)",
            border: "1px solid var(--mid)",
            borderRadius: 12,
            boxShadow: "0 12px 40px rgba(0,0,0,0.12)",
            maxHeight: 360,
            overflowY: "auto",
            zIndex: 100,
          }}
        >
          {results.length === 0 ? (
            <div style={{ padding: "24px 16px", textAlign: "center" }}>
              <span
                className="ms"
                style={{
                  fontSize: 28,
                  color: "var(--on-mut)",
                  opacity: 0.3,
                  display: "block",
                  marginBottom: 8,
                }}
              >
                search_off
              </span>
              <p
                style={{ fontSize: 13, color: "var(--on-mut)", fontFamily: "Manrope, sans-serif" }}
              >
                No events found for "{query}"
              </p>
            </div>
          ) : (
            <div style={{ padding: 6 }}>
              <p
                style={{
                  padding: "6px 10px",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--on-mut)",
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                {results.length} result{results.length !== 1 ? "s" : ""}
              </p>
              {results.slice(0, 8).map((evt) => (
                <button
                  key={evt.id}
                  onClick={() => {
                    setOpen(false);
                    setQuery("");
                    onNavigate(`/events/${evt.id}`);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 10px",
                    borderRadius: 8,
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    width: "100%",
                    textAlign: "left",
                    transition: "background 100ms",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--low)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      background: "var(--low)",
                      display: "grid",
                      placeItems: "center",
                      flexShrink: 0,
                    }}
                  >
                    <span className="ms" style={{ fontSize: 16, color: "var(--primary)" }}>
                      event
                    </span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "var(--on-bg)",
                        fontFamily: "Manrope, sans-serif",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {evt.title}
                    </p>
                    <p
                      style={{
                        fontSize: 11,
                        color: "var(--on-mut)",
                        fontFamily: "'JetBrains Mono', monospace",
                        marginTop: 1,
                      }}
                    >
                      {new Date(evt.start_date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}{" "}
                      · {evt.location || "Online"}
                    </p>
                  </div>
                  {evt.is_free ? (
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: "2px 6px",
                        borderRadius: 4,
                        background: "rgba(34,197,94,0.1)",
                        color: "#16a34a",
                        fontFamily: "Manrope, sans-serif",
                      }}
                    >
                      Free
                    </span>
                  ) : (
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: "2px 6px",
                        borderRadius: 4,
                        background: "var(--low)",
                        color: "var(--on-var)",
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      {evt.price}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// * --- Notification Bell + Dropdown ---------------------------------------------

/** Navbar bell icon that opens a dropdown panel with recent notifications. */
function NotificationBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // ! Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  // fetch unread count on mount and periodically
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30_000);
    return () => clearInterval(interval);
  }, []);

  /** Grab the unread count from the backend. */
  async function fetchUnreadCount() {
    try {
      const count = await notificationsApi.unreadCount();
      setUnread(count);
    } catch {
      // silent - bell still works, just no count badge
    }
  }

  /** Load full notification list when the dropdown opens. */
  const handleToggle = useCallback(async () => {
    const willOpen = !open;
    setOpen(willOpen);
    if (willOpen && notifications.length === 0) {
      setLoading(true);
      try {
        const data = await notificationsApi.list();
        setNotifications(data);
      } catch {
        // silent - show empty state
      } finally {
        setLoading(false);
      }
    }
  }, [open, notifications.length]);

  /** Mark a single notification as read. */
  async function handleMarkRead(id: string) {
    try {
      await notificationsApi.markRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
      setUnread((c) => Math.max(0, c - 1));
    } catch {
      // silent
    }
  }

  /** Mark every notification as read. */
  async function handleMarkAllRead() {
    try {
      await notificationsApi.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnread(0);
    } catch {
      // silent
    }
  }

  /** Human-friendly relative time - "2m ago", "3h ago", "Jan 12". */
  function timeAgo(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  /** Pick an icon based on notification_type. */
  function typeIcon(type: string): string {
    const map: Record<string, string> = {
      event_reminder: "event",
      registration_confirmed: "how_to_reg",
      payment_received: "payments",
      org_approved: "verified",
      org_suspended: "block",
      ticket_cancelled: "cancel",
      announcement: "campaign",
    };
    return map[type] ?? "notifications";
  }

  return (
    <div ref={ref} style={{ position: "relative" }}>
      {/* bell button */}
      <button
        onClick={handleToggle}
        className="grid place-items-center relative"
        style={{
          width: 36,
          height: 36,
          borderRadius: 9,
          border: "1px solid var(--outline)",
          background: open ? "var(--low)" : "transparent",
          color: "var(--on-var)",
          cursor: "pointer",
        }}
      >
        <span className="ms" style={{ fontSize: 18 }}>
          notifications
        </span>
        {unread > 0 && (
          <span
            className="absolute"
            style={{
              top: 4,
              right: 4,
              minWidth: 16,
              height: 16,
              borderRadius: 8,
              background: "var(--secondary)",
              border: "2px solid var(--bg)",
              display: "grid",
              placeItems: "center",
              fontSize: 9,
              fontWeight: 700,
              color: "white",
              fontFamily: "'JetBrains Mono', monospace",
              padding: "0 3px",
              lineHeight: 1,
            }}
          >
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {/* dropdown panel */}
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            width: 380,
            maxHeight: 460,
            background: "var(--surface)",
            border: "1px solid var(--outline)",
            borderRadius: 14,
            boxShadow: "0 12px 40px rgba(0,0,0,0.12)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            zIndex: 100,
          }}
        >
          {/* header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 16px 10px",
              borderBottom: "1px solid var(--outline)",
              flexShrink: 0,
            }}
          >
            <p
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 700,
                fontSize: 15,
                letterSpacing: "-0.02em",
                color: "var(--on-bg)",
              }}
            >
              Notifications
              {unread > 0 && (
                <span
                  style={{
                    marginLeft: 8,
                    padding: "2px 7px",
                    borderRadius: 5,
                    background: "rgba(239,68,68,0.1)",
                    color: "#dc2626",
                    fontSize: 11,
                    fontWeight: 700,
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {unread}
                </span>
              )}
            </p>
            <div style={{ display: "flex", gap: 6 }}>
              {unread > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: 11.5,
                    fontWeight: 600,
                    color: "var(--primary)",
                    cursor: "pointer",
                    fontFamily: "Manrope, sans-serif",
                    padding: "4px 8px",
                    borderRadius: 6,
                  }}
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => {
                  setOpen(false);
                  navigate("/profile");
                }}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: 11.5,
                  fontWeight: 600,
                  color: "var(--on-mut)",
                  cursor: "pointer",
                  fontFamily: "Manrope, sans-serif",
                  padding: "4px 8px",
                  borderRadius: 6,
                }}
              >
                Settings
              </button>
            </div>
          </div>

          {/* notification list */}
          <div style={{ flex: 1, overflowY: "auto", padding: "6px 0" }}>
            {loading && (
              <p
                style={{
                  textAlign: "center",
                  color: "var(--on-mut)",
                  fontSize: 13,
                  padding: "32px 0",
                  fontFamily: "Manrope, sans-serif",
                }}
              >
                Loading...
              </p>
            )}
            {!loading && notifications.length === 0 && (
              <div style={{ textAlign: "center", padding: "40px 20px" }}>
                <span className="ms" style={{ fontSize: 36, color: "var(--on-mut)", opacity: 0.4 }}>
                  notifications_off
                </span>
                <p
                  style={{
                    fontSize: 13,
                    color: "var(--on-mut)",
                    marginTop: 10,
                    fontFamily: "Manrope, sans-serif",
                  }}
                >
                  No notifications yet
                </p>
              </div>
            )}
            {!loading &&
              notifications.slice(0, 20).map((n) => (
                <button
                  key={n.id}
                  onClick={() => !n.is_read && handleMarkRead(n.id)}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 12,
                    width: "100%",
                    padding: "10px 16px",
                    background: n.is_read ? "transparent" : "rgba(99,102,241,0.04)",
                    border: "none",
                    cursor: n.is_read ? "default" : "pointer",
                    textAlign: "left",
                    transition: "background 100ms",
                  }}
                >
                  {/* type icon */}
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: n.is_read ? "var(--low)" : "rgba(99,102,241,0.08)",
                      display: "grid",
                      placeItems: "center",
                      flexShrink: 0,
                      marginTop: 2,
                    }}
                  >
                    <span
                      className="ms"
                      style={{
                        fontSize: 16,
                        color: n.is_read ? "var(--on-mut)" : "var(--primary)",
                      }}
                    >
                      {typeIcon(n.notification_type)}
                    </span>
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        fontSize: 13,
                        fontWeight: n.is_read ? 500 : 650,
                        color: "var(--on-bg)",
                        fontFamily: "Manrope, sans-serif",
                        lineHeight: 1.35,
                        marginBottom: 2,
                      }}
                    >
                      {n.title}
                    </p>
                    <p
                      style={{
                        fontSize: 12,
                        color: "var(--on-mut)",
                        fontFamily: "Manrope, sans-serif",
                        lineHeight: 1.4,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {n.message}
                    </p>
                  </div>

                  {/* timestamp + unread dot */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      flexShrink: 0,
                      marginTop: 2,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 10.5,
                        color: "var(--on-mut)",
                        fontFamily: "'JetBrains Mono', monospace",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {timeAgo(n.created_at)}
                    </span>
                    {!n.is_read && (
                      <span
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: "50%",
                          background: "var(--primary)",
                          flexShrink: 0,
                        }}
                      />
                    )}
                  </div>
                </button>
              ))}
          </div>

          {/* footer */}
          {notifications.length > 0 && (
            <div
              style={{
                borderTop: "1px solid var(--outline)",
                padding: "10px 16px",
                flexShrink: 0,
              }}
            >
              <button
                onClick={() => {
                  setOpen(false);
                  navigate("/profile");
                }}
                style={{
                  width: "100%",
                  padding: "8px 0",
                  background: "none",
                  border: "none",
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: "var(--primary)",
                  cursor: "pointer",
                  fontFamily: "Manrope, sans-serif",
                  textAlign: "center",
                }}
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
