import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AppLayout from "@/shared/layouts/AppLayout";
import { PH, MS, useToast } from "@/shared/components/v8";
import { useAuthStore } from "@/shared/store/auth.store";
import subscriptionApi, { PLAN_CATALOGUE } from "@/features/orgs/api/subscription.api";
import { submitEsewaForm } from "@/features/payment/api/payment.api";
import type { Gateway } from "@/features/payment/types";
import type { PlanName } from "@/features/orgs/api/subscription.api";

const GATEWAY_LABELS: Record<Gateway, string> = {
  khalti: "Khalti",
  esewa: "eSewa",
  stripe: "Stripe",
  paypal: "PayPal",
};

/** Organization billing page — view current plan, upgrade, payment history. */
export default function OrgBillingPage() {
  const user = useAuthStore((s) => s.user);
  const orgId = user?.org_id ?? "";
  const queryClient = useQueryClient();
  const { toast, toastEl } = useToast();

  const [selectedPlan, setSelectedPlan] = useState<PlanName | null>(null);
  const [gateway, setGateway] = useState<Gateway>("khalti");

  // * fetch current subscription (404 = no active sub = free plan)
  const { data: currentSub } = useQuery({
    queryKey: ["subscription", orgId],
    queryFn: () => subscriptionApi.getCurrent(orgId).catch(() => null),
    enabled: !!orgId,
  });

  // * subscribe mutation
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

  // * cancel mutation
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
    <AppLayout variant="org">
      {toastEl}
      <PH
        crumbs={["Numbers", "Billing"]}
        title="Billing & plan"
        sub="Manage your organization's subscription plan."
        actions={
          currentSub?.status === "active" ? (
            <button
              className="btn-sm"
              onClick={() => cancelMutation.mutate()}
              disabled={cancelMutation.isPending}
            >
              <MS n="cancel" size={13} />
              {cancelMutation.isPending ? "Cancelling..." : "Cancel plan"}
            </button>
          ) : undefined
        }
      />

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
          <span className="pill" style={{ background: "rgba(255,255,255,0.15)", color: "white" }}>
            {currentLabel}
          </span>
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
                      <span style={{ color: "#16a34a", fontSize: 12 }}>✓</span> {f}
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
                : `Subscribe — NPR ${(PLAN_CATALOGUE.find((p) => p.name === selectedPlan)?.price ?? 0).toLocaleString()}/mo`}
            </button>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
