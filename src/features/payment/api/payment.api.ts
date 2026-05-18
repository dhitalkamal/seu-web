/** API calls for the payment feature. */

import client from "@/shared/api/client";
import type { CreateOrderPayload, CreateOrderResponse, PaymentOrder } from "../types";

const BASE = "/payment/api/v1";

export type PromoCode = {
  id: string;
  code: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  valid_from: string;
  valid_until: string;
  max_usage_count: number;
  used_count: number;
  is_active: boolean;
  created_at: string;
};

export type CreatePromoCodePayload = {
  code: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  valid_from: string;
  valid_until: string;
  max_usage_count?: number;
};

export type Dispute = {
  id: string;
  order_id: string;
  user_id: string;
  status: "open" | "under_review" | "resolved" | "closed";
  reason: "duplicate" | "fraudulent" | "not_received" | "subscription_cancelled" | "other";
  description: string;
  evidence: Record<string, unknown>;
  gateway_dispute_id: string;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
};

const paymentApi = {
  /** Create a payment order, returns flat order fields + payment_url from the gateway. */
  createOrder: (payload: CreateOrderPayload) =>
    client
      .post<{
        data: CreateOrderResponse;
        error: unknown;
        meta: unknown;
      }>(`${BASE}/orders/`, payload)
      .then((r) => r.data.data),

  /** Fetch a single order by ID. */
  getOrder: (orderId: string) =>
    client.get<{ data: PaymentOrder }>(`${BASE}/orders/${orderId}/`).then((r) => r.data.data),

  /** List all promo codes for the org. */
  listPromoCodes: () =>
    client.get<{ data: PromoCode[] }>(`${BASE}/promo-codes/`).then((r) => r.data.data ?? []),

  /** Create a new promo code. */
  createPromoCode: (payload: CreatePromoCodePayload) =>
    client.post<{ data: PromoCode }>(`${BASE}/promo-codes/`, payload).then((r) => r.data.data),

  /** Validate a promo code and return its discount details. */
  validatePromoCode: (code: string) =>
    client
      .get<{
        data: { valid: boolean; discount_type: string; discount_value: number };
      }>(`${BASE}/promo-codes/${code}/validate/`)
      .then((r) => r.data.data),

  /** Open a dispute against an order with full details. */
  createDispute: (
    orderId: string,
    payload: { reason: string; description: string; evidence?: Record<string, unknown> }
  ) =>
    client
      .post<{ data: Dispute }>(`${BASE}/orders/${orderId}/disputes/`, payload)
      .then((r) => r.data.data),

  /** List all disputes for an order. */
  listDisputes: (orderId: string) =>
    client
      .get<{ data: Dispute[] }>(`${BASE}/orders/${orderId}/disputes/`)
      .then((r) => r.data.data ?? []),

  /** Request a refund for an order. */
  requestRefund: (payload: { order_id: string; reason: string; amount?: number }) =>
    client.post<{ data: unknown }>(`${BASE}/refunds/`, payload).then((r) => r.data.data),

  /** Fetch all orders for the authenticated user, newest first. */
  listMyOrders: () =>
    client.get<{ data: PaymentOrder[] }>(`${BASE}/orders/`).then((r) => r.data.data ?? []),
};

/**
 * Submit eSewa's signed form data by creating a hidden form and posting it.
 * eSewa requires a traditional form POST rather than a redirect.
 *
 * @param actionUrl - the eSewa payment endpoint URL
 * @param formData - signed key/value pairs from the backend
 */
export function submitEsewaForm(actionUrl: string, formData: Record<string, string>): void {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = actionUrl;

  for (const [key, value] of Object.entries(formData)) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = key;
    input.value = value;
    form.appendChild(input);
  }

  document.body.appendChild(form);
  form.submit();
}

export default paymentApi;
