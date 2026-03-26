import AppLayout from "@/shared/layouts/AppLayout";
import { PH, KPI, MS, useToast } from "@/shared/components/v8";

// coming soon - not yet routed; do not add to App.tsx until the comms backend API is ready
/** Email templates - transactional and lifecycle emails with variable tokens. */
export default function EmailTemplatesPage() {
  const { toast, toastEl } = useToast();

  return (
    <AppLayout variant="org">
      {toastEl}
      <PH
        crumbs={["Communications", "Email Templates"]}
        title="Email templates"
        sub="Transactional and lifecycle emails sent by the platform. All editable; variable tokens are interpolated at send time."
        actions={
          <>
            <button className="btn-sm" onClick={() => toast("Test email sent")}>
              <MS n="send" size={13} />
              Send test
            </button>
            <button className="btn-sm primary" onClick={() => toast("New template")}>
              <MS n="add" size={13} />
              New template
            </button>
          </>
        }
      />

      <div className="kpi-grid">
        <KPI icon="mail" color="lav" label="Templates" value="0" />
        <KPI icon="send" color="pch" label="Sent (30d)" value="0" />
        <KPI icon="drafts" color="mnt" label="Avg open rate" value="-" />
        <KPI icon="warning" color="crl" label="Bounces (30d)" value="0" />
      </div>

      <div
        style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 18, alignItems: "start" }}
      >
        {/* template list */}
        <div className="panel">
          <div className="panel-head">
            <span className="panel-title">All templates</span>
          </div>
          <div className="panel-body" style={{ padding: "6px 0" }}>
            <p
              style={{
                textAlign: "center",
                color: "var(--on-mut)",
                fontSize: 13,
                padding: "48px 0",
              }}
            >
              No templates yet
            </p>
          </div>
        </div>

        {/* editor */}
        <div className="panel">
          <div className="panel-head">
            <span className="panel-title">Template editor</span>
          </div>
          <div className="panel-body">
            <p
              style={{
                textAlign: "center",
                color: "var(--on-mut)",
                fontSize: 13,
                padding: "48px 0",
              }}
            >
              Select a template to edit
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
