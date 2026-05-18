import AppLayout from "@/shared/layouts/AppLayout";
import { PH, KPI, MS, useToast } from "@/shared/components/v8";

/** Finance ledger - revenue movement, payouts, refunds, invoices, and tax. */
export default function FinancePage() {
  const { toast, toastEl } = useToast();

  return (
    <AppLayout variant="org">
      {toastEl}
      <PH
        crumbs={["Numbers", "Finance"]}
        title="Finance ledger"
        sub="Revenue movement, payouts, refunds, invoices, and tax."
        actions={
          <>
            <button className="btn-sm" onClick={() => toast("Export started")}>
              <MS n="download" size={13} />
              Export
            </button>
            <button className="btn-sm primary" onClick={() => toast("New invoice")}>
              <MS n="receipt_long" size={13} />
              New invoice
            </button>
          </>
        }
      />

      <div className="kpi-grid">
        <KPI icon="payments" color="lav" label="Gross revenue YTD" value="—" />
        <KPI icon="account_balance" color="pch" label="Net revenue" value="—" />
        <KPI icon="schedule" color="crl" label="Outstanding" value="—" />
        <KPI icon="undo" color="mnt" label="Refunds (30d)" value="—" />
      </div>

      <div className="panel" style={{ marginBottom: 18 }}>
        <div className="panel-head">
          <span className="panel-title">Revenue movement</span>
        </div>
        <div className="panel-body" style={{ paddingBottom: 36 }}>
          <p
            style={{ textAlign: "center", color: "var(--on-mut)", fontSize: 13, padding: "48px 0" }}
          >
            No data yet
          </p>
        </div>
      </div>

      <div className="chart-grid-2">
        <div className="panel">
          <div className="panel-head">
            <span className="panel-title">Revenue by event category</span>
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
              No data yet
            </p>
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <span className="panel-title">Payment methods</span>
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
              No data yet
            </p>
          </div>
        </div>
      </div>

      <div className="chart-grid-2">
        <div className="panel">
          <div className="panel-head">
            <span className="panel-title">Upcoming payouts</span>
          </div>
          <div className="panel-body flush">
            <p
              style={{
                textAlign: "center",
                color: "var(--on-mut)",
                fontSize: 13,
                padding: "48px 0",
              }}
            >
              No data yet
            </p>
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <span className="panel-title">Recent invoices &amp; refunds</span>
          </div>
          <div className="panel-body flush">
            <p
              style={{
                textAlign: "center",
                color: "var(--on-mut)",
                fontSize: 13,
                padding: "48px 0",
              }}
            >
              No data yet
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
