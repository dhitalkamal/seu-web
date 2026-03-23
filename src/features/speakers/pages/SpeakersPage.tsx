import AppLayout from "@/shared/layouts/AppLayout";
import { PH, KPI, MS, useToast } from "@/shared/components/v8";

// coming soon - not yet routed; do not add to App.tsx until the backend speaker API is ready
/** Speakers & presenters - reusable speaker profiles assigned across events and sessions. */
export default function SpeakersPage() {
  const { toast, toastEl } = useToast();

  return (
    <AppLayout variant="org">
      {toastEl}
      <PH
        crumbs={["Workspace", "Speakers"]}
        title="Speakers & presenters"
        sub="Reusable speaker profiles, assigned across events and sessions. Bios and headshots stay in sync wherever a speaker appears."
        actions={
          <>
            <button className="btn-sm">
              <MS n="upload_file" size={13} />
              Import CSV
            </button>
            <button className="btn-sm primary" onClick={() => toast("Speaker invite")}>
              <MS n="person_add" size={13} />
              Invite speaker
            </button>
          </>
        }
      />

      <div className="kpi-grid">
        <KPI icon="record_voice_over" color="lav" label="In roster" value="0" />
        <KPI icon="schedule" color="pch" label="Sessions scheduled" value="0" />
        <KPI icon="how_to_reg" color="mnt" label="Confirmed" value="0" />
        <KPI icon="mark_email_unread" color="crl" label="Awaiting reply" value="0" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
        <div className="panel" style={{ gridColumn: "1 / -1" }}>
          <div
            className="panel-body"
            style={{ textAlign: "center", color: "var(--on-mut)", fontSize: 13, padding: "48px 0" }}
          >
            No data yet
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
