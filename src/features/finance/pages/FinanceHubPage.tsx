import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AppLayout from "@/shared/layouts/AppLayout";
import { PH, KPI, MS, useToast } from "@/shared/components/v8";
import { useAuthStore } from "@/shared/store/auth.store";
import subscriptionApi, { PLAN_CATALOGUE } from "@/features/orgs/api/subscription.api";
import paymentApi from "@/features/payment/api/payment.api";
import { submitEsewaForm } from "@/features/payment/api/payment.api";
import type {
  PromoCode,
  CreatePromoCodePayload,
  RefundRecord,
} from "@/features/payment/api/payment.api";
import type { Gateway } from "@/features/payment/types";
import type { PlanName } from "@/features/orgs/api/subscription.api";

// * types

type FinanceTab = "overview" | "refunds" | "promo" | "billing";

type TabDef = { key: FinanceTab; icon: string; label: string };

const TABS: TabDef[] = [
  { key: "overview", icon: "payments", label: "Overview" },
  { key: "refunds", icon: "undo", label: "Refunds" },
  { key: "promo", icon: "local_offer", label: "Promo Codes" },
  { key: "billing", icon: "credit_card", label: "Billing" },
];

const GATEWAY_LABELS: Record<Gateway, string> = {
  khalti: "Khalti",
  esewa: "eSewa",
  stripe: "Stripe",
  paypal: "PayPal",
};

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
  const { toast, toastEl } = useToast();

  return (
    <AppLayout variant="org">
      {toastEl}
      <PH
        crumbs={["Numbers", "Finance"]}
        title="Finance"
        sub="Revenue, refunds, promo codes, and billing all in one place."
        actions={
          tab === "overview" ? (
            <button className="btn-sm" onClick={() => toast("Export started")}>
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
              onClick={() => setTab(t.key)}
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
      {tab === "refunds" && <RefundsTab />}
      {tab === "promo" && <PromoTab />}
      {tab === "billing" && <BillingTab />}
    </AppLayout>
  );
}

// * overview tab

/** Finance ledger: revenue movement, payouts, invoices, and tax. */
function OverviewTab() {
  return (
    <>
      <div className="kpi-grid">
        <KPI icon="payments" color="lav" label="Gross revenue YTD" value="N/A" />
        <KPI icon="account_balance" color="pch" label="Net revenue" value="N/A" />
        <KPI icon="schedule" color="crl" label="Outstanding" value="N/A" />
        <KPI icon="undo" color="mnt" label="Refunds (30d)" value="N/A" />
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

// filter options for the refund status tabs
const REFUND_FILTERS = ["All", "Pending", "Approved", "Rejected"] as const;
type RefundFilter = (typeof REFUND_FILTERS)[number];

/** Refunds queue: live list from payment service with status filter tabs. */
function RefundsTab() {
  const [filter, setFilter] = useState<RefundFilter>("All");

  // map display filter to API status param
  const apiStatus = filter === "All" ? undefined : filter.toLowerCase();

  const { data: refunds = [], isLoading } = useQuery({
    queryKey: ["refunds", apiStatus],
    queryFn: () => paymentApi.listRefunds(apiStatus),
  });

  const pending = refunds.filter((r: RefundRecord) => r.status === "pending").length;
  const approved = refunds.filter(
    (r: RefundRecord) => r.status === "approved" || r.status === "completed"
  ).length;
  const rejected = refunds.filter((r: RefundRecord) => r.status === "rejected").length;

  return (
    <>
      <div className="kpi-grid">
        <KPI icon="pending" color="crl" label="Pending review" value={String(pending)} />
        <KPI icon="check_circle" color="lav" label="Approved" value={String(approved)} />
        <KPI icon="block" color="pch" label="Rejected" value={String(rejected)} />
        <KPI icon="percent" color="mnt" label="Refund rate" value="N/A" />
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

  return (
    <>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
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
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="AUTUMN20"
                  style={{ fontFamily: "JetBrains Mono, monospace", textTransform: "uppercase" }}
                />
              </div>
              <div className="field">
                <label className="field-lab">Discount type</label>
                <select
                  className="field-in"
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value as "percentage" | "fixed")}
                >
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed amount</option>
                </select>
              </div>
              <div className="field">
                <label className="field-lab">Value</label>
                <input
                  className="field-in"
                  type="number"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  placeholder="20"
                />
              </div>
              <div className="field">
                <label className="field-lab">Valid from</label>
                <input
                  className="field-in"
                  type="date"
                  value={validFrom}
                  onChange={(e) => setValidFrom(e.target.value)}
                />
              </div>
              <div className="field">
                <label className="field-lab">Valid until</label>
                <input
                  className="field-in"
                  type="date"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                />
              </div>
              <div className="field">
                <label className="field-lab">Max usage</label>
                <input
                  className="field-in"
                  type="number"
                  value={maxUsage}
                  onChange={(e) => setMaxUsage(e.target.value)}
                  placeholder="100"
                />
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button className="btn-sm" onClick={resetForm}>
                Cancel
              </button>
              <button
                className="btn-sm primary"
                onClick={handleCreate}
                disabled={createMutation.isPending}
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

// * billing tab

/** Billing and subscription: current plan, available plans, gateway selection. */
function BillingTab() {
  const user = useAuthStore((s) => s.user);
  const orgId = user?.org_id ?? "";
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [selectedPlan, setSelectedPlan] = useState<PlanName | null>(null);
  const [gateway, setGateway] = useState<Gateway>("khalti");

  // fetch current subscription (404 means no active sub = free plan)
  const { data: currentSub } = useQuery({
    queryKey: ["subscription", orgId],
    queryFn: () => subscriptionApi.getCurrent(orgId).catch(() => null),
    enabled: !!orgId,
  });

  // subscribe mutation
  const subscribeMutation = useMutation({
    mutationFn: (plan: string) => subscriptionApi.create({ org_id: orgId, plan, gateway }),
    onSuccess: (res) => {
      if (gateway === "esewa" && res.esewa_form_data) {
        submitEsewaForm(res.esewa_form_url ?? res.payment_url ?? "", res.esewa_form_data);
        return;
      }
      if (res.payment_url) {
        window.location.href = res.payment_url;
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["subscription", orgId] });
      setSelectedPlan(null);
      toast("Plan updated!");
    },
  });

  // cancel mutation
  const cancelMutation = useMutation({
    mutationFn: () => subscriptionApi.cancel(orgId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription", orgId] });
      toast("Subscription cancelled");
    },
  });

  const currentPlan = currentSub?.plan ?? "free";
  const currentLabel = PLAN_CATALOGUE.find((p) => p.name === currentPlan)?.label ?? "Free";
  const currentPrice = PLAN_CATALOGUE.find((p) => p.name === currentPlan)?.price ?? 0;

  return (
    <>
      {/* current plan card */}
      <div
        className="panel"
        style={{
          background: "linear-gradient(135deg,#050a26,#121d3f)",
          color: "white",
          border: 0,
          marginBottom: 18,
        }}
      >
        <div className="panel-head" style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
          <span className="panel-title" style={{ color: "white" }}>
            Current plan
          </span>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span className="pill" style={{ background: "rgba(255,255,255,0.15)", color: "white" }}>
              {currentLabel}
            </span>
            {currentSub?.status === "active" && (
              <button
                className="btn-sm"
                onClick={() => cancelMutation.mutate()}
                disabled={cancelMutation.isPending}
                style={{ color: "rgba(255,255,255,0.7)", borderColor: "rgba(255,255,255,0.2)" }}
              >
                <MS n="cancel" size={13} />
                {cancelMutation.isPending ? "Cancelling..." : "Cancel plan"}
              </button>
            )}
          </div>
        </div>
        <div className="panel-body" style={{ color: "white" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
            {[
              [
                "Monthly",
                currentPrice === 0 ? "Free" : `NPR ${currentPrice.toLocaleString()}`,
                "per month",
              ],
              [
                "Status",
                currentSub ? currentSub.status.replace("_", " ") : "Free tier",
                currentSub
                  ? `since ${new Date(currentSub.created_at).toLocaleDateString()}`
                  : "no subscription",
              ],
              [
                "Next renewal",
                currentSub?.current_period_end
                  ? new Date(currentSub.current_period_end).toLocaleDateString()
                  : "N/A",
                currentSub?.status === "cancelled" ? "will not renew" : "auto-renew",
              ],
            ].map(([s, v, d]) => (
              <div
                key={s}
                style={{ padding: 14, background: "rgba(255,255,255,0.06)", borderRadius: 10 }}
              >
                <div
                  style={{
                    fontSize: 9.5,
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.5)",
                  }}
                >
                  {s}
                </div>
                <div
                  style={{
                    fontFamily: "Space Grotesk",
                    fontWeight: 700,
                    fontSize: 22,
                    letterSpacing: "-0.035em",
                    marginTop: 4,
                    color: "white",
                  }}
                >
                  {v}
                </div>
                <div
                  style={{
                    fontSize: 10.5,
                    color: "rgba(255,255,255,0.55)",
                    marginTop: 3,
                    fontFamily: "JetBrains Mono, monospace",
                  }}
                >
                  {d}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* plan cards */}
      <div className="panel" style={{ marginBottom: 18 }}>
        <div className="panel-head">
          <span className="panel-title">Available plans</span>
        </div>
        <div className="panel-body">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
            {PLAN_CATALOGUE.filter((p) => p.name !== "free").map((plan) => {
              const isCurrent = plan.name === currentPlan;
              const isSelected = plan.name === selectedPlan;
              return (
                <div
                  key={plan.name}
                  onClick={() => !isCurrent && setSelectedPlan(plan.name)}
                  style={{
                    padding: 18,
                    borderRadius: 14,
                    border: isSelected
                      ? "2px solid #050a26"
                      : isCurrent
                        ? "2px solid #16a34a"
                        : "1px solid var(--outline)",
                    background: isSelected ? "var(--low)" : "var(--surface)",
                    cursor: isCurrent ? "default" : "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{plan.label}</div>
                  <div
                    style={{
                      fontFamily: "Space Grotesk",
                      fontWeight: 700,
                      fontSize: 24,
                      letterSpacing: "-0.035em",
                    }}
                  >
                    {plan.price === 0 ? "Free" : `NPR ${plan.price.toLocaleString()}`}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--on-mut)", marginBottom: 12 }}>
                    {plan.price > 0 ? "per month" : ""}
                  </div>
                  {plan.features.map((f) => (
                    <div
                      key={f}
                      style={{
                        fontSize: 11.5,
                        color: "var(--on-var)",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        marginBottom: 4,
                      }}
                    >
                      <span style={{ color: "#16a34a", fontSize: 12 }}>v</span> {f}
                    </div>
                  ))}
                  {isCurrent && (
                    <div style={{ marginTop: 10 }}>
                      <span className="pill active">Current plan</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* gateway selection + subscribe button */}
      {selectedPlan && (
        <div className="panel" style={{ marginBottom: 18 }}>
          <div className="panel-head">
            <span className="panel-title">
              Subscribe to {PLAN_CATALOGUE.find((p) => p.name === selectedPlan)?.label}
            </span>
          </div>
          <div className="panel-body">
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Payment method</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              {(Object.keys(GATEWAY_LABELS) as Gateway[]).map((gw) => (
                <button
                  key={gw}
                  onClick={() => setGateway(gw)}
                  className={`btn-sm ${gateway === gw ? "primary" : ""}`}
                >
                  {GATEWAY_LABELS[gw]}
                </button>
              ))}
            </div>

            {subscribeMutation.isError && (
              <div style={{ color: "#e83151", fontSize: 13, marginBottom: 10 }}>
                Subscription failed. Please try again.
              </div>
            )}

            <button
              className="btn-sm primary"
              onClick={() => subscribeMutation.mutate(selectedPlan)}
              disabled={subscribeMutation.isPending}
              style={{ width: "100%", justifyContent: "center", padding: "12px 0" }}
            >
              <MS n="rocket_launch" size={14} />
              {subscribeMutation.isPending
                ? "Processing..."
                : `Subscribe NPR ${(PLAN_CATALOGUE.find((p) => p.name === selectedPlan)?.price ?? 0).toLocaleString()}/mo`}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
