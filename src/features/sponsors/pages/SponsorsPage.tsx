import AppLayout from "@/shared/layouts/AppLayout";
import { PH, KPI, MS } from "@/shared/components/v8";

/** Sponsors and partners - coming soon placeholder. */
export default function SponsorsPage() {
  return (
    <AppLayout variant="org">
      <PH
        crumbs={["Workspace", "Sponsors"]}
        title="Sponsors and partners"
        sub="Track sponsorship tiers, logo placement, and commitments. Showcase appears on event landing pages and in the post-event report."
        actions={
          <button
            className="btn-sm"
            disabled
            title="Sponsor management is not yet available"
            style={{ opacity: 0.5, cursor: "not-allowed" }}
          >
            <MS n="handshake" size={13} />
            Add sponsor
          </button>
        }
      />

      <div className="kpi-grid">
        <KPI icon="handshake" color="lav" label="Active sponsors" value="N/A" />
        <KPI icon="payments" color="pch" label="Committed (yr)" value="N/A" />
        <KPI icon="diversity_3" color="mnt" label="Tiers" value="N/A" />
        <KPI icon="event" color="crl" label="Events sponsored" value="N/A" />
      </div>

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
            handshake
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
            Sponsor management coming soon
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
            Track sponsorship tiers, logo placement, and commitments. This section is under
            development and will be available in a future release.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
