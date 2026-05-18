import { Link } from "react-router-dom";

/** Sansaar platform dark footer - shown on all public pages. */
export default function Footer() {
  return (
    <footer
      style={{ background: "var(--primary)", borderTop: "1px solid rgba(255,255,255,0.06)" }}
      className="mt-24 py-14 px-6"
    >
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
          {/* brand */}
          <div className="col-span-2 md:col-span-1">
            <span
              className="text-2xl font-bold tracking-tight"
              style={{ color: "#fff", fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Sansaar
            </span>
            <p className="mt-3 text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
              The Event Universe. Discover, create, and experience events across Nepal.
            </p>
          </div>

          {/* discover */}
          <div>
            <h4
              className="text-xs font-semibold uppercase tracking-widest mb-4"
              style={{ color: "rgba(255,255,255,0.4)" }}
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
                    className="text-sm transition-colors"
                    style={{ color: "rgba(255,255,255,0.6)" }}
                    onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "#fff")}
                    onMouseLeave={(e) =>
                      ((e.target as HTMLElement).style.color = "rgba(255,255,255,0.6)")
                    }
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* organise */}
          <div>
            <h4
              className="text-xs font-semibold uppercase tracking-widest mb-4"
              style={{ color: "rgba(255,255,255,0.4)" }}
            >
              Organise
            </h4>
            <ul className="space-y-2">
              {[
                { label: "Create Event", to: "/events/create" },
                { label: "My Events", to: "/events/mine" },
                { label: "Analytics", to: "/events/mine" },
              ].map(({ label, to }) => (
                <li key={label}>
                  <Link
                    to={to}
                    className="text-sm transition-colors"
                    style={{ color: "rgba(255,255,255,0.6)" }}
                    onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "#fff")}
                    onMouseLeave={(e) =>
                      ((e.target as HTMLElement).style.color = "rgba(255,255,255,0.6)")
                    }
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
              style={{ color: "rgba(255,255,255,0.4)" }}
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
                    className="text-sm transition-colors"
                    style={{ color: "rgba(255,255,255,0.6)" }}
                    onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "#fff")}
                    onMouseLeave={(e) =>
                      ((e.target as HTMLElement).style.color = "rgba(255,255,255,0.6)")
                    }
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
          style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
        >
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
            &copy; {new Date().getFullYear()} Sansaar. All rights reserved.
          </p>
          <div className="flex gap-6">
            {["Privacy", "Terms", "Contact"].map((item) => (
              <span
                key={item}
                className="text-xs cursor-pointer transition-colors"
                style={{ color: "rgba(255,255,255,0.3)" }}
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
