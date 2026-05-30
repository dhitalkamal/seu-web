import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AppLayout from "@/shared/layouts/AppLayout";
import { PH, MS, useToast } from "@/shared/components/v8";
import { useOrgStore } from "@/shared/store/org.store";
import subscriptionApi, { PLAN_CATALOGUE } from "@/features/orgs/api/subscription.api";
import { submitEsewaForm } from "@/features/payment/api/payment.api";
import type { Gateway } from "@/features/payment/types";
import type { PlanName } from "@/features/orgs/api/subscription.api";

// * types

const GATEWAY_LABELS: Record<Gateway, string> = {
  khalti: "Khalti",
  esewa: "eSewa",
  stripe: "Stripe",
  paypal: "PayPal",
};

/** Standalone pricing page listing all plans from PLAN_CATALOGUE with upgrade flow. */
export default function PricingPage() {
  const navigate = useNavigate();
  const { toast, toastEl } = useToast();
  const org = useOrgStore((s) => s.org);
  const orgId = org?.id ?? "";
  const queryClient = useQueryClient();

  const [searchParams] = useSearchParams();
  const [selectedPlan, setSelectedPlan] = useState<PlanName | null>(null);
  const [gateway, setGateway] = useState<Gateway>("khalti");

  useEffect(() => {
    if (searchParams.get("payment_error") === "true") {
      toast("Subscription payment failed. Please try again.");
    }
    if (searchParams.get("cancelled") === "true") {
      toast("Payment was cancelled.");
    }
  }, []);

  // fetch current subscription - 404 means free plan
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
    onError: () => toast("Subscription failed. Please try again."),
  });

  const currentPlan = currentSub?.plan ?? "free";

  return (
    <AppLayout variant="org">
      {toastEl}
      <PH
        crumbs={["Workspace", "Pricing & Plans"]}
        title="Pricing & Plans"
        sub="Choose the plan that fits your organization. Upgrade or downgrade at any time."
        actions={
          <button className="btn-sm" onClick={() => navigate("/org/finance")}>
            <MS n="receipt_long" size={13} />
            View billing details
          </button>
        }
      />

      {/* plan grid - all plans including free and ngo */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 18,
          marginBottom: 28,
        }}
      >
        {PLAN_CATALOGUE.map((plan) => {
          const isCurrent = plan.name === currentPlan;
          const isSelected = plan.name === selectedPlan;
          const isFree = plan.name === "free";
          const isNgo = plan.name === "ngo";

          // determine button label
          let btnLabel = "Upgrade";
          const planIdx = PLAN_CATALOGUE.findIndex((p) => p.name === plan.name);
          const currentIdx = PLAN_CATALOGUE.findIndex((p) => p.name === currentPlan);
          if (planIdx < currentIdx) btnLabel = "Downgrade";
          if (isFree) btnLabel = "Free forever";
          if (isNgo) btnLabel = "Apply for NGO status";

          return (
            <div
              key={plan.name}
              style={{
                padding: 22,
                borderRadius: 16,
                border: isCurrent
                  ? "2px solid #16a34a"
                  : isSelected
                    ? "2px solid #050a26"
                    : "1px solid var(--outline)",
                background: isSelected ? "var(--low)" : "var(--surface)",
                display: "flex",
                flexDirection: "column",
                gap: 0,
                position: "relative",
                transition: "all 0.15s",
              }}
            >
              {/* current plan badge */}
              {isCurrent && (
                <div style={{ position: "absolute", top: 14, right: 14 }}>
                  <span
                    style={{
                      padding: "3px 10px",
                      borderRadius: 999,
                      fontSize: 10.5,
                      fontWeight: 700,
                      background: "#dcfce7",
                      color: "#166534",
                    }}
                  >
                    Current Plan
                  </span>
                </div>
              )}

              {/* plan name */}
              <div
                style={{
                  fontFamily: "Space Grotesk, sans-serif",
                  fontWeight: 700,
                  fontSize: 18,
                  letterSpacing: "-0.02em",
                  color: "var(--on-bg)",
                  marginBottom: 8,
                }}
              >
                {plan.label}
              </div>

              {/* price */}
              <div style={{ marginBottom: 4 }}>
                <span
                  style={{
                    fontFamily: "Space Grotesk, sans-serif",
                    fontWeight: 700,
                    fontSize: 32,
                    letterSpacing: "-0.04em",
                    color: "var(--on-bg)",
                  }}
                >
                  {plan.price === 0 ? "Free" : `NPR ${plan.price.toLocaleString()}`}
                </span>
                {plan.price > 0 && (
                  <span
                    style={{
                      fontSize: 12,
                      color: "var(--on-mut)",
                      fontFamily: "Manrope, sans-serif",
                      marginLeft: 4,
                    }}
                  >
                    /month
                  </span>
                )}
              </div>

              {/* fee percentage */}
              <div
                style={{
                  fontSize: 11.5,
                  color: "var(--on-mut)",
                  fontFamily: "JetBrains Mono, monospace",
                  marginBottom: 18,
                }}
              >
                {plan.fee} platform fee
              </div>

              {/* feature list */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  flex: 1,
                  marginBottom: 20,
                }}
              >
                {plan.features.map((f) => (
                  <div
                    key={f}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 8,
                      fontSize: 12.5,
                      color: "var(--on-var)",
                      fontFamily: "Manrope, sans-serif",
                      lineHeight: 1.4,
                    }}
                  >
                    <MS
                      n="check"
                      size={14}
                      style={{ color: "#16a34a", flexShrink: 0, marginTop: 1 }}
                    />
                    {f}
                  </div>
                ))}
              </div>

              {/* action button */}
              {isCurrent ? (
                <div
                  style={{
                    padding: "10px 0",
                    textAlign: "center",
                    borderRadius: 10,
                    border: "1px solid #16a34a",
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#166534",
                    fontFamily: "Manrope, sans-serif",
                    background: "#f0fdf4",
                  }}
                >
                  Current Plan
                </div>
              ) : isFree ? (
                <div
                  style={{
                    padding: "10px 0",
                    textAlign: "center",
                    borderRadius: 10,
                    border: "1px solid var(--outline)",
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--on-mut)",
                    fontFamily: "Manrope, sans-serif",
                  }}
                >
                  Free forever
                </div>
              ) : isNgo ? (
                <a
                  href="mailto:hello@sansaar.io?subject=NGO Plan Application"
                  style={{
                    display: "block",
                    padding: "10px 0",
                    textAlign: "center",
                    borderRadius: 10,
                    border: "1px solid var(--outline)",
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--on-var)",
                    fontFamily: "Manrope, sans-serif",
                    textDecoration: "none",
                    background: "var(--low)",
                  }}
                >
                  Apply for NGO status
                </a>
              ) : (
                <button
                  onClick={() => setSelectedPlan(isSelected ? null : plan.name)}
                  style={{
                    padding: "10px 0",
                    borderRadius: 10,
                    border: isSelected ? "none" : "1px solid #050a26",
                    background: isSelected ? "#050a26" : "transparent",
                    color: isSelected ? "white" : "#050a26",
                    fontSize: 13,
                    fontWeight: 700,
                    fontFamily: "Manrope, sans-serif",
                    cursor: "pointer",
                    transition: "all 120ms",
                  }}
                >
                  {isSelected ? "Selected" : btnLabel}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* gateway selection modal overlay */}
      {selectedPlan && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.45)",
          }}
          onClick={() => setSelectedPlan(null)}
        >
          <div
            style={{
              background: "var(--surface)",
              borderRadius: 18,
              border: "1px solid var(--outline)",
              width: "100%",
              maxWidth: 480,
              padding: 28,
              boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20,
                paddingBottom: 14,
                borderBottom: "1px solid var(--outline)",
              }}
            >
              <span
                style={{
                  fontFamily: "Space Grotesk, sans-serif",
                  fontWeight: 700,
                  fontSize: 18,
                  color: "var(--on-bg)",
                }}
              >
                Subscribe to {PLAN_CATALOGUE.find((p) => p.name === selectedPlan)?.label}
              </span>
              <button className="btn-sm" onClick={() => setSelectedPlan(null)}>
                <MS n="close" size={13} />
                Cancel
              </button>
            </div>

            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, color: "var(--on-bg)" }}>
              Select payment method
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 22 }}>
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
              <div style={{ color: "#e83151", fontSize: 13, marginBottom: 12 }}>
                Subscription failed. Please try again.
              </div>
            )}

            <button
              className="btn-sm primary"
              onClick={() => subscribeMutation.mutate(selectedPlan)}
              disabled={subscribeMutation.isPending}
              style={{
                width: "100%",
                justifyContent: "center",
                padding: "14px 0",
                borderRadius: 12,
              }}
            >
              <MS n="rocket_launch" size={14} />
              {subscribeMutation.isPending
                ? "Processing..."
                : `Subscribe - NPR ${(PLAN_CATALOGUE.find((p) => p.name === selectedPlan)?.price ?? 0).toLocaleString()}/mo via ${GATEWAY_LABELS[gateway]}`}
            </button>
          </div>
        </div>
      )}

      {/* FAQ / fine print */}
      <div
        style={{
          padding: "18px 22px",
          background: "var(--low)",
          borderRadius: 14,
          border: "1px solid var(--mid)",
        }}
      >
        <p
          style={{
            fontSize: 12.5,
            color: "var(--on-mut)",
            fontFamily: "Manrope, sans-serif",
            lineHeight: 1.6,
          }}
        >
          Plans are billed monthly. Cancel anytime from the{" "}
          <span
            style={{ color: "var(--primary)", cursor: "pointer", fontWeight: 600 }}
            onClick={() => navigate("/org/finance")}
          >
            Billing page
          </span>
          . NGO pricing requires manual verification by our team. Enterprise pricing includes a
          dedicated onboarding call. All prices in NPR.
        </p>
      </div>
    </AppLayout>
  );
}
