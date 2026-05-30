import { Link } from "react-router-dom";

/** light-themed platform footer shown on all public pages */
export default function Footer() {
  return (
    <footer
      style={{
        background: "var(--bg)",
        borderTop: "1px solid var(--outline)",
      }}
      className="py-14 px-6"
    >
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
          {/* brand */}
          <div className="col-span-2 md:col-span-1">
            <span
              className="text-2xl font-bold tracking-tight"
              style={{
                color: "var(--on-bg)",
                fontFamily: "'Space Grotesk', sans-serif",
              }}
            >
              Sansaar
            </span>
            <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--on-var)" }}>
              The Event Universe. Discover, create, and experience events across Nepal.
            </p>
          </div>

          {/* discover */}
          <div>
            <h4
              className="text-xs font-semibold uppercase tracking-widest mb-4"
              style={{ color: "var(--on-mut)" }}
            >
              Discover
            </h4>
            <ul className="space-y-2">
              {[
                { label: "Browse Events", to: "/events" },
                { label: "Categories", to: "/events" },
                { label: "Near Me", to: "/events" },
              ].map(({ label, to }) => (
                <li key={label}>
                  <Link
                    to={to}
                    className="text-sm transition-colors hover:text-(--on-bg)"
                    style={{ color: "var(--on-var)" }}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* organize */}
          <div>
            <h4
              className="text-xs font-semibold uppercase tracking-widest mb-4"
              style={{ color: "var(--on-mut)" }}
            >
              Organize
            </h4>
            <ul className="space-y-2">
              {[
                { label: "Create Event", to: "/org/events/create" },
                { label: "My Events", to: "/org/events" },
                { label: "Analytics", to: "/org/analytics" },
              ].map(({ label, to }) => (
                <li key={label}>
                  <Link
                    to={to}
                    className="text-sm transition-colors hover:text-(--on-bg)"
                    style={{ color: "var(--on-var)" }}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* account */}
          <div>
            <h4
              className="text-xs font-semibold uppercase tracking-widest mb-4"
              style={{ color: "var(--on-mut)" }}
            >
              Account
            </h4>
            <ul className="space-y-2">
              {[
                { label: "My Tickets", to: "/tickets" },
                { label: "Notifications", to: "/notifications" },
                { label: "Settings", to: "/settings" },
              ].map(({ label, to }) => (
                <li key={label}>
                  <Link
                    to={to}
                    className="text-sm transition-colors hover:text-(--on-bg)"
                    style={{ color: "var(--on-var)" }}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* bottom bar */}
        <div
          className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4"
          style={{ borderTop: "1px solid var(--outline)" }}
        >
          <p className="text-xs" style={{ color: "var(--on-mut)" }}>
            &copy; {new Date().getFullYear()} Sansaar. All rights reserved.
          </p>
          <div className="flex gap-6">
            {["Privacy", "Terms", "Contact"].map((item) => (
              <span
                key={item}
                className="text-xs cursor-pointer transition-colors hover:text-(--on-bg)"
                style={{ color: "var(--on-mut)" }}
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
