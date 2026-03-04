import AppLayout from "@/shared/layouts/AppLayout";
import { PH, MS } from "@/shared/components/v8";

/** Landing page templates - coming soon placeholder. */
export default function LandingTemplatesPage() {
  return (
    <AppLayout variant="org">
      <PH
        crumbs={["Workspace", "Landing templates"]}
        title="Landing page templates"
        sub="Pre-built visual systems for your event landing pages. Choose per event; mix and match."
        actions={
          <>
            <button
              className="btn-sm"
              disabled
              style={{ opacity: 0.5, cursor: "not-allowed" }}
              title="Coming soon"
            >
              <MS n="code" size={13} />
              Custom CSS
            </button>
            <button
              className="btn-sm primary"
              disabled
              style={{ opacity: 0.5, cursor: "not-allowed" }}
              title="Coming soon"
            >
              <MS n="check" size={13} />
              Set as default
            </button>
          </>
        }
      />

      <div className="panel">
        <div className="panel-body" style={{ textAlign: "center", padding: "64px 28px" }}>
          <span
            className="ms"
            style={{
              fontSize: 48,
              color: "var(--on-mut)",
              opacity: 0.25,
              display: "block",
              marginBottom: 16,
            }}
          >
            web
          </span>
          <p
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 700,
              fontSize: 18,
              color: "var(--on-bg)",
              marginBottom: 8,
            }}
          >
            Landing page templates coming soon
          </p>
          <p
            style={{
              fontSize: 13.5,
              color: "var(--on-var)",
              fontFamily: "Manrope, sans-serif",
              lineHeight: 1.6,
              maxWidth: 460,
              margin: "0 auto",
            }}
          >
            Choose and customise pre-built visual themes for your event landing pages. This section
            is under development and will be available in a future release.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
