import { useState } from "react";
import AppLayout from "@/shared/layouts/AppLayout";
import { PH, KPI, MS, useToast } from "@/shared/components/v8";

/** Promo codes - create form and usage bars. */
export default function PromoCodesPage() {
  const [show, setShow] = useState(false);
  const { toast, toastEl } = useToast();

  return (
    <AppLayout variant="org">
      {toastEl}
      <PH
        crumbs={["Numbers", "Promo codes"]}
        title="Promo codes"
        sub="Percentage or fixed-amount discounts, with validity windows and usage caps."
        actions={
          <>
            <button className="btn-sm" onClick={() => toast("CSV exported")}>
              <MS n="download" size={13} />
              Export
            </button>
            <button className="btn-sm primary" onClick={() => setShow(true)}>
              <MS n="add" size={13} />
              New code
            </button>
          </>
        }
      />

      <div className="kpi-grid">
        <KPI icon="local_offer" color="lav" label="Active codes" value="0" />
        <KPI icon="redeem" color="pch" label="Redemptions (30d)" value="0" />
        <KPI icon="savings" color="crl" label="Discount given" value="—" />
        <KPI icon="trending_up" color="mnt" label="Conversion lift" value="—" />
      </div>

      {show && (
        <div className="panel" style={{ marginBottom: 18, borderColor: "var(--primary)" }}>
          <div className="panel-head">
            <span className="panel-title">New promo code</span>
            <button className="modal-x" onClick={() => setShow(false)}>
              <MS n="close" size={14} />
            </button>
          </div>
          <div className="panel-body">
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: 14,
                marginBottom: 14,
              }}
            >
              <div className="field">
                <label className="field-lab">Code</label>
                <input
                  className="field-in"
                  placeholder="AUTUMN20"
                  style={{ fontFamily: "JetBrains Mono, monospace", textTransform: "uppercase" }}
                />
              </div>
              <div className="field">
                <label className="field-lab">Discount type</label>
                <select className="field-in">
                  <option>Percentage</option>
                  <option>Fixed amount</option>
                </select>
              </div>
              <div className="field">
                <label className="field-lab">Value</label>
                <input className="field-in" placeholder="20" />
              </div>
              <div className="field">
                <label className="field-lab">Valid from</label>
                <input className="field-in" type="date" />
              </div>
              <div className="field">
                <label className="field-lab">Valid until</label>
                <input className="field-in" type="date" />
              </div>
              <div className="field">
                <label className="field-lab">Max usage</label>
                <input className="field-in" placeholder="100" />
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button className="btn-sm" onClick={() => setShow(false)}>
                Cancel
              </button>
              <button
                className="btn-sm primary"
                onClick={() => {
                  setShow(false);
                  toast("Promo code created");
                }}
              >
                Create code
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="panel">
        <div className="panel-body flush">
          <table className="tbl">
            <thead>
              <tr>
                <th>Code</th>
                <th>Type</th>
                <th>Value</th>
                <th>Validity</th>
                <th>Used</th>
                <th>Revenue impact</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              <tr>
                <td
                  colSpan={8}
                  style={{
                    textAlign: "center",
                    color: "var(--on-mut)",
                    fontSize: 13,
                    padding: "48px 0",
                  }}
                >
                  No data yet
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}
