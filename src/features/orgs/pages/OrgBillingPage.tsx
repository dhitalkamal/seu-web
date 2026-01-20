import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AppLayout from "@/shared/layouts/AppLayout";
import { useAuthStore } from "@/shared/store/auth.store";
import subscriptionApi, { PLAN_CATALOGUE, type PlanName } from "../api/subscription.api";
import { submitEsewaForm } from "@/features/payment/api/payment.api";
import type { Gateway } from "@/features/payment/types";

const GATEWAY_LABELS: Record<Gateway, string> = {
  khalti: "Khalti",
  esewa: "eSewa",
  stripe: "Stripe",
  paypal: "PayPal",
};

/** Organisation billing page — view current plan, upgrade/downgrade, payment history. */
export default function OrgBillingPage() {
  const user = useAuthStore((s) => s.user);
  // ! for now we use the first org the user belongs to — multi-org support can come later
  const orgId = user?.org_id ?? "";
  const queryClient = useQueryClient();

  const [selectedPlan, setSelectedPlan] = useState<PlanName | null>(null);
  const [gateway, setGateway] = useState<Gateway>("khalti");

  // * fetch current subscription
  const { data: currentSub, isLoading } = useQuery({
    queryKey: ["subscription", orgId],
    queryFn: () => subscriptionApi.getCurrent(orgId),
    enabled: !!orgId,
    retry: false,
  });

  // * subscribe mutation
  const subscribeMutation = useMutation({
    mutationFn: (plan: string) => subscriptionApi.create({ org_id: orgId, plan, gateway }),
    onSuccess: (res) => {
      // * eSewa form POST
      if (gateway === "esewa" && res.esewa_form_data) {
        submitEsewaForm(res.esewa_form_url ?? res.payment_url ?? "", res.esewa_form_data);
        return;
      }
      // * redirect to gateway
      if (res.payment_url) {
        window.location.href = res.payment_url;
        return;
      }
      // * NGO plan (free) — immediate activation, refresh
      queryClient.invalidateQueries({ queryKey: ["subscription", orgId] });
      setSelectedPlan(null);
    },
  });

  // * cancel mutation
  const cancelMutation = useMutation({
    mutationFn: () => subscriptionApi.cancel(orgId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription", orgId] });
    },
  });

  if (!orgId) {
    return (
      <AppLayout title="Billing">
        <div className="max-w-3xl mx-auto px-4 py-20 text-center">
          <p className="text-sm text-[#6b6c75] font-['Manrope']">
            You need to belong to an organisation to manage billing.
          </p>
        </div>
      </AppLayout>
    );
  }

  const currentPlan = currentSub?.plan ?? "free";

  return (
    <AppLayout title="Billing">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-[#19191e] font-['Manrope'] mb-2">
          Billing & Subscription
        </h1>
        <p className="text-sm text-[#6b6c75] font-['Manrope'] mb-8">
          Manage your organisation's plan and payment history.
        </p>

        {/* current plan banner */}
        {!isLoading && (
          <div className="bg-white border border-[#e0dfd8] rounded-2xl p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-[#6b6c75] font-['Manrope'] uppercase tracking-wider mb-1">
                  Current plan
                </p>
                <p className="text-xl font-bold text-[#19191e] font-['Manrope']">
                  {PLAN_CATALOGUE.find((p) => p.name === currentPlan)?.label ?? "Free"}
                </p>
                {currentSub && (
                  <p className="text-xs text-[#6b6c75] font-['Manrope'] mt-1">
                    {currentSub.status === "active"
                      ? `Renews ${new Date(currentSub.current_period_end).toLocaleDateString()}`
                      : currentSub.status === "cancelled"
                        ? `Active until ${new Date(currentSub.current_period_end).toLocaleDateString()}`
                        : currentSub.status}
                  </p>
                )}
              </div>
              {currentSub?.status === "active" && (
                <button
                  onClick={() => cancelMutation.mutate()}
                  disabled={cancelMutation.isPending}
                  className="text-sm font-semibold text-red-600 hover:text-red-700 font-['Manrope'] disabled:opacity-50"
                >
                  {cancelMutation.isPending ? "Cancelling..." : "Cancel plan"}
                </button>
              )}
            </div>
          </div>
        )}

        {/* plan cards */}
        <h2 className="text-lg font-bold text-[#19191e] font-['Manrope'] mb-4">Available Plans</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {PLAN_CATALOGUE.filter((p) => p.name !== "free").map((plan) => {
            const isCurrent = plan.name === currentPlan;
            const isSelected = plan.name === selectedPlan;
            return (
              <div
                key={plan.name}
                className={`border rounded-2xl p-5 transition-all cursor-pointer ${
                  isSelected
                    ? "border-[#19191e] bg-[#f8f8f6]"
                    : isCurrent
                      ? "border-green-400 bg-green-50"
                      : "border-[#e0dfd8] bg-white hover:border-[#c0bfb8]"
                }`}
                onClick={() => !isCurrent && setSelectedPlan(plan.name)}
              >
                <p className="text-base font-bold text-[#19191e] font-['Manrope']">{plan.label}</p>
                <p className="text-xl font-bold text-[#19191e] font-['Manrope'] mt-1">
                  {plan.price === 0 ? "Free" : `NPR ${plan.price.toLocaleString()}/mo`}
                </p>
                <ul className="mt-3 space-y-1.5">
                  {plan.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-2 text-xs text-[#6b6c75] font-['Manrope']"
                    >
                      <span className="text-green-600 mt-0.5">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                {isCurrent && (
                  <p className="mt-3 text-xs font-semibold text-green-700 font-['Manrope']">
                    Current plan
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* gateway selection + subscribe button */}
        {selectedPlan && (
          <div className="bg-white border border-[#e0dfd8] rounded-2xl p-6 mb-8">
            <p className="text-sm font-semibold text-[#19191e] font-['Manrope'] mb-3">Pay with</p>
            <div className="flex gap-3 mb-4">
              {(Object.keys(GATEWAY_LABELS) as Gateway[]).map((gw) => (
                <button
                  key={gw}
                  onClick={() => setGateway(gw)}
                  className={`border rounded-xl px-4 py-2.5 text-sm font-semibold font-['Manrope'] transition-colors ${
                    gateway === gw
                      ? "border-[#19191e] bg-[#19191e] text-white"
                      : "border-[#e0dfd8] text-[#19191e] hover:bg-[#f3f2ef]"
                  }`}
                >
                  {GATEWAY_LABELS[gw]}
                </button>
              ))}
            </div>

            {subscribeMutation.isError && (
              <p className="text-sm text-red-600 font-['Manrope'] mb-3">
                Subscription failed. Please try again.
              </p>
            )}

            <button
              onClick={() => subscribeMutation.mutate(selectedPlan)}
              disabled={subscribeMutation.isPending}
              className="w-full bg-[#19191e] text-white text-sm font-bold font-['Manrope'] rounded-2xl py-3.5 hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {subscribeMutation.isPending
                ? "Processing..."
                : `Subscribe to ${PLAN_CATALOGUE.find((p) => p.name === selectedPlan)?.label} — NPR ${PLAN_CATALOGUE.find((p) => p.name === selectedPlan)?.price.toLocaleString()}/mo`}
            </button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
