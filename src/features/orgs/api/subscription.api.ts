/** API calls for organisation subscription billing. */

import client from "@/shared/api/client";

const BASE = "/payment/api/v1";

/** Plan catalogue — must stay in sync with the backend PLAN_PRICES. */
export const PLAN_CATALOGUE = [
  {
    name: "free" as const,
    label: "Free",
    price: 0,
    fee: "5%",
    features: ["Up to 100 registrations/event", "5% platform fee", "Basic analytics"],
  },
  {
    name: "starter" as const,
    label: "Starter",
    price: 999,
    fee: "3%",
    features: [
      "Up to 1,000 registrations/event",
      "3% platform fee",
      "Advanced analytics",
      "Priority support",
    ],
  },
  {
    name: "pro" as const,
    label: "Pro",
    price: 4999,
    fee: "1%",
    features: [
      "Unlimited registrations",
      "1% platform fee",
      "Full analytics suite",
      "Dedicated support",
      "Custom domain",
    ],
  },
  {
    name: "ngo" as const,
    label: "NGO",
    price: 0,
    fee: "0%",
    features: [
      "Unlimited registrations",
      "0% platform fee",
      "Full analytics suite",
      "Priority support",
      "Verified NGO badge",
    ],
  },
  {
    name: "enterprise" as const,
    label: "Enterprise",
    price: 14999,
    fee: "0%",
    features: [
      "Unlimited everything",
      "0% platform fee",
      "White-label branding",
      "SLA guarantee",
      "Dedicated account manager",
    ],
  },
] as const;

export type PlanName = (typeof PLAN_CATALOGUE)[number]["name"];

export type Subscription = {
  id: string;
  org_id: string;
  plan: string;
  status: "active" | "cancelled" | "past_due" | "expired";
  gateway: string;
  amount: string;
  currency: string;
  current_period_start: string;
  current_period_end: string;
  cancelled_at: string | null;
  created_at: string;
};

export type SubscriptionPayment = {
  id: string;
  subscription_id: string;
  amount: string;
  currency: string;
  status: string;
  period_start: string;
  period_end: string;
  paid_at: string;
};

const subscriptionApi = {
  /** Get the org's current active subscription. */
  getCurrent: (orgId: string) =>
    client
      .get<{ data: Subscription }>(`${BASE}/subscriptions/current/?org_id=${orgId}`)
      .then((r) => r.data.data),

  /** Subscribe the org to a plan. Returns payment_url for paid plans. */
  create: (payload: { org_id: string; plan: string; gateway: string }) =>
    client
      .post<{
        data: Subscription & {
          payment_url?: string;
          esewa_form_data?: Record<string, string>;
          esewa_form_url?: string;
        };
      }>(`${BASE}/subscriptions/`, payload)
      .then((r) => r.data.data),

  /** Cancel the org's active subscription. */
  cancel: (orgId: string) =>
    client
      .post<{ data: Subscription }>(`${BASE}/subscriptions/cancel/`, { org_id: orgId })
      .then((r) => r.data.data),

  /** Get payment history for a subscription. */
  payments: (subscriptionId: string) =>
    client
      .get<{ data: SubscriptionPayment[] }>(`${BASE}/subscriptions/${subscriptionId}/payments/`)
      .then((r) => r.data.data),
};

export default subscriptionApi;
