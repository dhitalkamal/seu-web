import AppLayout from "@/shared/layouts/AppLayout";
import { PH, KPI, MS, useToast } from "@/shared/components/v8";

/** Sponsors & partners - sponsorship tiers, logo placement, and per-event linkage. */
export default function SponsorsPage() {
  const { toast, toastEl } = useToast();

  return (
    <AppLayout variant="org">
      {toastEl}
      <PH
        crumbs={["Workspace", "Sponsors"]}
        title="Sponsors & partners"
        sub="Sponsorship tiers, logo placement, and per-event linkage. Showcase appears on event landing pages and in the post-event report."
        actions={
          <>
            <button className="btn-sm">
              <MS n="palette" size={13} />
              Branding kit
            </button>
            <button className="btn-sm primary" onClick={() => toast("Sponsor invited")}>
              <MS n="handshake" size={13} />
              Add sponsor
            </button>
          </>
        }
      />

      <div className="kpi-grid">
        <KPI icon="handshake" color="lav" label="Active sponsors" value="0" />
        <KPI icon="payments" color="pch" label="Committed (yr)" value="—" />
        <KPI icon="diversity_3" color="mnt" label="Tiers" value="0" />
        <KPI icon="event" color="crl" label="Events sponsored" value="0" />
      </div>

      <div className="panel">
        <div
          className="panel-body"
          style={{ textAlign: "center", color: "var(--on-mut)", fontSize: 13, padding: "48px 0" }}
        >
          No data yet
        </div>
      </div>
    </AppLayout>
  );
}
