import AppLayout from "@/shared/layouts/AppLayout";
import { PH, MS, useToast } from "@/shared/components/v8";

/** Landing page templates - pre-built visual systems for event landing pages. */
export default function LandingTemplatesPage() {
  const { toast, toastEl } = useToast();

  return (
    <AppLayout variant="org">
      {toastEl}
      <PH
        crumbs={["Workspace", "Landing templates"]}
        title="Landing page templates"
        sub="Pre-built visual systems for your event landing pages. Choose per event; mix and match."
        actions={
          <>
            <button className="btn-sm" onClick={() => toast("Custom CSS open")}>
              <MS n="code" size={13} />
              Custom CSS
            </button>
            <button className="btn-sm primary" onClick={() => toast("No template selected")}>
              <MS n="check" size={13} />
              Set as default
            </button>
          </>
        }
      />

      <div className="panel">
        <div
          className="panel-body"
          style={{ textAlign: "center", color: "var(--on-mut)", fontSize: 13, padding: "48px 0" }}
        >
          No templates available yet
        </div>
      </div>
    </AppLayout>
  );
}
