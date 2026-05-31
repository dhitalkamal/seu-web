import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AppLayout from "@/shared/layouts/AppLayout";
import { PH, KPI, MS, useToast } from "@/shared/components/v8";
import paymentApi from "@/features/payment/api/payment.api";
import type {
  PromoCode,
  CreatePromoCodePayload,
  RefundRecord,
} from "@/features/payment/api/payment.api";
import client from "@/shared/api/client";
import { useOrgStore } from "@/shared/store/org.store";

/**
 * Trigger a CSV file download from a 2D string array.
 * @param headers - column header labels
 * @param rows - data rows, each an array of string cells
 * @param filename - base filename (no extension)
 */
function exportCSV(headers: string[], rows: string[][], filename: string): void {
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const lines = [headers.map(escape).join(","), ...rows.map((r) => r.map(escape).join(","))];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// * types

type OrgRevenueAnalytics = {
  gross_revenue: string;
  net_revenue: string;
  refund_total: string;
  refund_count: number;
  orders_count: number;
  orders_30d: number;
  gateway_breakdown: { gateway: string; count: number; total: string }[];
};

type FinanceTab = "overview" | "refunds" | "promo";

type TabDef = { key: FinanceTab; icon: string; label: string };

const TABS: TabDef[] = [
  { key: "overview", icon: "payments", label: "Overview" },
  { key: "refunds", icon: "undo", label: "Refunds" },
  { key: "promo", icon: "local_offer", label: "Promo Codes" },
];

// * tab bar styles

const tabBarStyle: React.CSSProperties = {
  display: "flex",
  gap: 4,
  padding: 4,
  background: "var(--low)",
  borderRadius: 12,
  marginBottom: 20,
  border: "1px solid var(--mid)",
};

/**
 * Unified finance hub combining the ledger overview, refund queue,
 * promo codes, and billing/subscription into a single tabbed page.
 */
export default function FinanceHubPage() {
  const [tab, setTab] = useState<FinanceTab>("overview");
  const { toastEl } = useToast();

  // * export callback registered by the active tab; null when no export is available
  const [exportFn, setExportFn] = useState<(() => void) | null>(null);

  return (
    <AppLayout variant="org">
      {toastEl}
      <PH
        crumbs={["Numbers", "Finance"]}
        title="Finance"
        sub="Revenue, refunds, promo codes, and billing all in one place."
        actions={
          exportFn ? (
            <button className="btn-sm" onClick={exportFn}>
              <MS n="download" size={13} />
              Export
            </button>
          ) : undefined
        }
      />

      {/* tab bar */}
      <div style={tabBarStyle}>
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => {
                setTab(t.key);
                // clear stale export fn when switching tabs; the new tab registers its own
                setExportFn(null);
              }}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 7,
                padding: "9px 0",
                borderRadius: 9,
                border: "none",
                background: active ? "var(--surface)" : "transparent",
                boxShadow: active ? "0 1px 4px rgba(0,0,0,0.06)" : "none",
                cursor: "pointer",
                transition: "all 120ms",
              }}
            >
              <MS
                n={t.icon}
                size={15}
                style={{ color: active ? "var(--primary)" : "var(--on-mut)" }}
              />
              <span
                style={{
                  fontSize: 12.5,
                  fontWeight: active ? 700 : 500,
                  color: active ? "var(--on-bg)" : "var(--on-mut)",
                  fontFamily: "Manrope, sans-serif",
                }}
              >
                {t.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* tab content */}
      {tab === "overview" && <OverviewTab />}
      {tab === "refunds" && <RefundsTab onReady={setExportFn} />}
      {tab === "promo" && <PromoTab />}
      {/* billing moved to /org/pricing */}
    </AppLayout>
  );
}

// * overview tab

/** Format a raw NPR decimal string from the API into a readable label. */
function fmtNPR(raw: string | undefined): string {
  if (!raw) return "N/A";
  const n = parseFloat(raw);
  if (isNaN(n)) return "N/A";
  return `NPR ${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

/** Finance ledger: revenue movement, payouts, invoices, and tax. */
function OverviewTab() {
  const org = useOrgStore((s) => s.org);

  const { data: analytics, isLoading } = useQuery<OrgRevenueAnalytics>({
    queryKey: ["org-revenue-analytics", org?.id],
    queryFn: () =>
      client
        .get<{
          data: OrgRevenueAnalytics;
        }>(`/payment/api/v1/org/analytics/?organization_id=${org!.id}`)
        .then((r) => r.data.data),
    enabled: !!org?.id,
  });

  const gross = isLoading ? "..." : fmtNPR(analytics?.gross_revenue);
  const net = isLoading ? "..." : fmtNPR(analytics?.net_revenue);
  const refunds = isLoading ? "..." : fmtNPR(analytics?.refund_total);
  const orders30d = isLoading ? "..." : String(analytics?.orders_30d ?? "N/A");

  return (
    <>
      <div className="kpi-grid">
        <KPI icon="payments" color="lav" label="Gross revenue YTD" value={gross} />
        <KPI icon="account_balance" color="pch" label="Net revenue" value={net} />
        <KPI icon="schedule" color="crl" label="Orders (30d)" value={orders30d} />
        <KPI icon="undo" color="mnt" label="Refunds (30d)" value={refunds} />
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
            {!analytics?.gateway_breakdown || analytics.gateway_breakdown.length === 0 ? (
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
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "12px 0" }}>
                {analytics.gateway_breakdown.map((gw) => (
                  <div
                    key={gw.gateway}
                    style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}
                  >
                    <span
                      style={{
                        fontWeight: 600,
                        color: "var(--on-bg)",
                        textTransform: "capitalize",
                        fontFamily: "Manrope, sans-serif",
                      }}
                    >
                      {gw.gateway}
                    </span>
                    <span
                      style={{
                        color: "var(--on-var)",
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 12,
                      }}
                    >
                      {gw.count} &times; {fmtNPR(gw.total)}
                    </span>
                  </div>
                ))}
              </div>
            )}
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
            <span className="panel-title">Recent invoices and refunds</span>
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
    </>
  );
}

// * refunds tab

const REFUND_FILTERS = ["All", "Pending", "Approved", "Rejected"] as const;
type RefundFilter = (typeof REFUND_FILTERS)[number];

type RefundsTabProps = { onReady: (fn: (() => void) | null) => void };

/** Refunds queue: live list from payment service with status filter tabs. */
function RefundsTab({ onReady }: RefundsTabProps) {
  const org = useOrgStore((s) => s.org);
  const [filter, setFilter] = useState<RefundFilter>("All");

  // map display filter to API status param
  const apiStatus = filter === "All" ? undefined : filter.toLowerCase();

  const { data: refunds = [], isLoading } = useQuery({
    queryKey: ["refunds", apiStatus],
    queryFn: () => paymentApi.listRefunds(apiStatus),
  });

  // fetch analytics to compute refund rate from orders_count and refund_count
  const { data: analytics } = useQuery<OrgRevenueAnalytics>({
    queryKey: ["org-revenue-analytics", org?.id],
    queryFn: () =>
      client
        .get<{
          data: OrgRevenueAnalytics;
        }>(`/payment/api/v1/org/analytics/?organization_id=${org!.id}`)
        .then((r) => r.data.data),
    enabled: !!org?.id,
  });

  const pending = refunds.filter((r: RefundRecord) => r.status === "pending").length;
  const approved = refunds.filter(
    (r: RefundRecord) => r.status === "approved" || r.status === "completed"
  ).length;
  const rejected = refunds.filter((r: RefundRecord) => r.status === "rejected").length;

  // compute refund rate as percentage: refund_count / orders_count * 100
  const refundRate =
    analytics && analytics.orders_count > 0
      ? `${((analytics.refund_count / analytics.orders_count) * 100).toFixed(1)}%`
      : "N/A";

  // register export function once data is loaded
  useEffect(() => {
    if (isLoading || refunds.length === 0) {
      onReady(null);
      return;
    }
    onReady(() => () => {
      const headers = ["ID", "Order ID", "Amount", "Reason", "Gateway", "Status", "Created"];
      const rows = refunds.map((r: RefundRecord) => [
        r.id,
        r.order_id,
        r.amount != null ? String(r.amount) : "",
        r.reason ?? "",
        r.gateway ?? "",
        r.status,
        new Date(r.created_at).toLocaleDateString(),
      ]);
      exportCSV(headers, rows, "refunds-export");
    });
  }, [isLoading, refunds, onReady]);

  return (
    <>
      <div className="kpi-grid">
        <KPI icon="pending" color="crl" label="Pending review" value={String(pending)} />
        <KPI icon="check_circle" color="lav" label="Approved" value={String(approved)} />
        <KPI icon="block" color="pch" label="Rejected" value={String(rejected)} />
        <KPI icon="percent" color="mnt" label="Refund rate" value={refundRate} />
      </div>

      <div className="chart-grid-21">
        <div className="panel">
          <div className="panel-head">
            <span className="panel-title">All requests</span>
            <div style={{ display: "flex", gap: 6 }}>
              {REFUND_FILTERS.map((t) => (
                <button
                  key={t}
                  className="btn-sm"
                  onClick={() => setFilter(t)}
                  style={{
                    background: filter === t ? "var(--low)" : "white",
                    fontWeight: filter === t ? 700 : 500,
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="panel-body flush">
            <table className="tbl">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Order ID</th>
                  <th>Amount</th>
                  <th>Reason</th>
                  <th>Gateway</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr>
                    <td
                      colSpan={7}
                      style={{
                        textAlign: "center",
                        color: "var(--on-mut)",
                        fontSize: 13,
                        padding: "48px 0",
                      }}
                    >
                      Loading...
                    </td>
                  </tr>
                )}
                {!isLoading && refunds.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      style={{
                        textAlign: "center",
                        color: "var(--on-mut)",
                        fontSize: 13,
                        padding: "48px 0",
                      }}
                    >
                      No refund requests
                    </td>
                  </tr>
                )}
                {refunds.map((r: RefundRecord) => (
                  <tr key={r.id}>
                    <td style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10.5 }}>
                      {r.id.slice(0, 8)}...
                    </td>
                    <td style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10.5 }}>
                      {r.order_id.slice(0, 8)}...
                    </td>
                    <td>{r.amount != null ? `NPR ${r.amount.toLocaleString()}` : "N/A"}</td>
                    <td
                      style={{
                        maxWidth: 160,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {r.reason}
                    </td>
                    <td>{r.gateway ?? "N/A"}</td>
                    <td>
                      <span
                        style={{
                          padding: "2px 8px",
                          borderRadius: 999,
                          fontSize: 10.5,
                          fontWeight: 700,
                          background:
                            r.status === "approved" || r.status === "completed"
                              ? "#dcfce7"
                              : r.status === "rejected"
                                ? "#fee2e2"
                                : "#dbeafe",
                          color:
                            r.status === "approved" || r.status === "completed"
                              ? "#166534"
                              : r.status === "rejected"
                                ? "#991b1b"
                                : "#1e40af",
                        }}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10.5 }}>
                      {new Date(r.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="depth">
            <div className="depth-ic">
              <MS n="undo" size={112} />
            </div>
            <h4>Policy snapshot</h4>
            <p>
              Refunds accepted within 7 days of registration or up to 72h before the event,
              whichever is earlier. Auto-refund on event cancellation.
            </p>
            <div className="depth-status">
              <span className="pulse" />
              Policy applied
            </div>
          </div>
          <div className="panel">
            <div className="panel-head">
              <span className="panel-title">By gateway (30d)</span>
            </div>
            <div className="panel-body">
              <p
                style={{
                  textAlign: "center",
                  color: "var(--on-mut)",
                  fontSize: 13,
                  padding: "24px 0",
                }}
              >
                No data yet
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// * promo codes tab

/** Promo codes: create form and usage table wired to real API data. */
function PromoTab() {
  const [show, setShow] = useState(false);
  const { toast } = useToast();
  const qc = useQueryClient();

  // * form state
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [discountValue, setDiscountValue] = useState("");
  const [validFrom, setValidFrom] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [maxUsage, setMaxUsage] = useState("100");

  // fetch promo codes from the payment service
  const { data: promoCodes = [], isLoading } = useQuery({
    queryKey: ["promo-codes"],
    queryFn: paymentApi.listPromoCodes,
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreatePromoCodePayload) => paymentApi.createPromoCode(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["promo-codes"] });
      toast("Promo code created!");
      resetForm();
    },
    onError: () => toast("Failed to create promo code"),
  });

  /** Reset form fields and close the panel. */
  function resetForm() {
    setShow(false);
    setCode("");
    setDiscountType("percentage");
    setDiscountValue("");
    setValidFrom("");
    setValidUntil("");
    setMaxUsage("100");
  }

  /** Validate and submit the create form. */
  function handleCreate() {
    if (!code.trim() || !discountValue || !validFrom || !validUntil) {
      toast("Please fill all required fields.");
      return;
    }
    createMutation.mutate({
      code: code.trim().toUpperCase(),
      discount_type: discountType,
      discount_value: Number(discountValue),
      valid_from: new Date(validFrom).toISOString(),
      valid_until: new Date(validUntil).toISOString(),
      max_usage_count: Number(maxUsage) || 100,
    });
  }

  const activeCount = promoCodes.filter((p: PromoCode) => p.is_active).length;
  const totalRedemptions = promoCodes.reduce((s: number, p: PromoCode) => s + p.used_count, 0);

  function handleExport() {
    const headers = ["Code", "Type", "Value", "Valid From", "Valid Until", "Used", "Max", "Status"];
    const rows = (promoCodes as PromoCode[]).map((pc) => [
      pc.code,
      pc.discount_type === "percentage" ? "Percentage" : "Fixed",
      pc.discount_type === "percentage" ? `${pc.discount_value}%` : `NPR ${pc.discount_value}`,
      new Date(pc.valid_from).toLocaleDateString(),
      new Date(pc.valid_until).toLocaleDateString(),
      String(pc.used_count),
      String(pc.max_usage_count),
      pc.is_active ? "Active" : "Inactive",
    ]);
    exportCSV(headers, rows, "promo-codes-export");
  }

  return (
    <>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginBottom: 14 }}>
        {promoCodes.length > 0 && (
          <button className="btn-sm" onClick={handleExport}>
            <MS n="download" size={13} />
            Export CSV
          </button>
        )}
        <button className="btn-sm primary" onClick={() => setShow(true)}>
          <MS n="add" size={13} />
          New code
        </button>
      </div>

      <div className="kpi-grid">
        <KPI icon="local_offer" color="lav" label="Active codes" value={String(activeCount)} />
        <KPI icon="redeem" color="pch" label="Total redemptions" value={String(totalRedemptions)} />
        <KPI
          icon="confirmation_number"
          color="crl"
          label="Total codes"
          value={String(promoCodes.length)}
        />
        <KPI icon="trending_up" color="mnt" label="Conversion lift" value="N/A" />
      </div>

      {/* new promo code modal */}
      {show && (
        <div
          onClick={resetForm}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.35)",
            display: "grid",
            placeItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--surface)",
              borderRadius: 20,
              maxWidth: 520,
              width: "100%",
              boxShadow: "0 16px 48px rgba(0,0,0,0.15)",
            }}
          >
            {/* modal header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "18px 24px 16px",
                borderBottom: "1px solid var(--outline)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <MS n="local_offer" size={20} style={{ color: "var(--primary)" }} />
                <div>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: "var(--on-bg)",
                      fontFamily: "'Manrope', sans-serif",
                    }}
                  >
                    New promo code
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--on-mut)",
                      fontFamily: "'Manrope', sans-serif",
                    }}
                  >
                    Create a discount code for events.
                  </div>
                </div>
              </div>
              <button
                onClick={resetForm}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  border: "1px solid var(--mid)",
                  background: "transparent",
                  cursor: "pointer",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <MS n="close" size={14} />
              </button>
            </div>

            {/* modal body */}
            <div
              style={{
                padding: "20px 24px",
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              {/* code */}
              <div>
                <label
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "var(--on-mut)",
                    marginBottom: 6,
                    display: "block",
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  Code <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="AUTUMN20"
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 10,
                    border: "1px solid var(--mid)",
                    background: "var(--low)",
                    fontSize: 14,
                    fontFamily: "'JetBrains Mono', monospace",
                    textTransform: "uppercase",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* discount type + value */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <label
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: "var(--on-mut)",
                      marginBottom: 6,
                      display: "block",
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    Discount type <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as "percentage" | "fixed")}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: 10,
                      border: "1px solid var(--mid)",
                      background: "var(--low)",
                      fontSize: 14,
                      fontFamily: "'Manrope', sans-serif",
                      boxSizing: "border-box",
                    }}
                  >
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed amount</option>
                  </select>
                </div>
                <div>
                  <label
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: "var(--on-mut)",
                      marginBottom: 6,
                      display: "block",
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    Value <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    type="number"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    placeholder="20"
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: 10,
                      border: "1px solid var(--mid)",
                      background: "var(--low)",
                      fontSize: 14,
                      fontFamily: "'Manrope', sans-serif",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              {/* valid from + valid until (2-col) */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <label
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: "var(--on-mut)",
                      marginBottom: 6,
                      display: "block",
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    Valid from <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    type="date"
                    value={validFrom}
                    onChange={(e) => setValidFrom(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: 10,
                      border: "1px solid var(--mid)",
                      background: "var(--low)",
                      fontSize: 14,
                      fontFamily: "'Manrope', sans-serif",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: "var(--on-mut)",
                      marginBottom: 6,
                      display: "block",
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    Valid until <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    type="date"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: 10,
                      border: "1px solid var(--mid)",
                      background: "var(--low)",
                      fontSize: 14,
                      fontFamily: "'Manrope', sans-serif",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              {/* max usage */}
              <div>
                <label
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "var(--on-mut)",
                    marginBottom: 6,
                    display: "block",
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  Max usage
                </label>
                <input
                  type="number"
                  value={maxUsage}
                  onChange={(e) => setMaxUsage(e.target.value)}
                  placeholder="100"
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 10,
                    border: "1px solid var(--mid)",
                    background: "var(--low)",
                    fontSize: 14,
                    fontFamily: "'Manrope', sans-serif",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>

            {/* modal footer */}
            <div
              style={{
                display: "flex",
                gap: 10,
                justifyContent: "flex-end",
                padding: "16px 24px 20px",
                borderTop: "1px solid var(--outline)",
              }}
            >
              <button
                className="btn-sm"
                onClick={resetForm}
                style={{ border: "1px solid var(--mid)", background: "transparent" }}
              >
                Cancel
              </button>
              <button
                className="btn-sm"
                onClick={handleCreate}
                disabled={createMutation.isPending}
                style={{ background: "#050a26", color: "white", border: "none" }}
              >
                {createMutation.isPending ? "Creating..." : "Create code"}
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
                <th>Valid from</th>
                <th>Valid until</th>
                <th>Used</th>
                <th>Max</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
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
                    Loading...
                  </td>
                </tr>
              )}
              {!isLoading && promoCodes.length === 0 && (
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
                    No promo codes yet
                  </td>
                </tr>
              )}
              {promoCodes.map((pc: PromoCode) => (
                <tr key={pc.id}>
                  <td style={{ fontFamily: "JetBrains Mono, monospace", fontWeight: 700 }}>
                    {pc.code}
                  </td>
                  <td>{pc.discount_type === "percentage" ? "Percentage" : "Fixed"}</td>
                  <td>
                    {pc.discount_type === "percentage"
                      ? `${pc.discount_value}%`
                      : `NPR ${pc.discount_value}`}
                  </td>
                  <td style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11 }}>
                    {new Date(pc.valid_from).toLocaleDateString()}
                  </td>
                  <td style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11 }}>
                    {new Date(pc.valid_until).toLocaleDateString()}
                  </td>
                  <td>{pc.used_count}</td>
                  <td>{pc.max_usage_count}</td>
                  <td>
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: 999,
                        fontSize: 10.5,
                        fontWeight: 700,
                        background: pc.is_active ? "#dcfce7" : "#fee2e2",
                        color: pc.is_active ? "#166534" : "#991b1b",
                      }}
                    >
                      {pc.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
