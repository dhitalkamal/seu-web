/** API calls for the payment feature. */

import client from "@/shared/api/client";
import type { CreateOrderPayload, PaymentOrder } from "../types";

const BASE = "/payment/api/v1";

const paymentApi = {
  /** Create a payment order and return it. */
  createOrder: (payload: CreateOrderPayload) =>
    client
      .post<{ data: PaymentOrder }>(`${BASE}/orders/`, payload)
      .then((r) => r.data.data),

  /** Fetch a single order by ID. */
  getOrder: (orderId: string) =>
    client
      .get<{ data: PaymentOrder }>(`${BASE}/orders/${orderId}/`)
      .then((r) => r.data.data),
};

/** Build the Khalti payment URL for a given pidx (gateway_order_id). */
export function khaltiPaymentUrl(pidx: string): string {
  return `https://test-pay.khalti.com/?pidx=${encodeURIComponent(pidx)}`;
}

/** Build the eSewa payment URL. */
export function esewaPaymentUrl(orderId: string, amount: string): string {
  const params = new URLSearchParams({
    amt: amount,
    pdc: "0",
    psc: "0",
    txAmt: "0",
    tAmt: amount,
    pid: orderId,
    scd: import.meta.env.VITE_ESEWA_MERCHANT ?? "EPAYTEST",
    su: `${window.location.origin}/payment/success`,
    fu: `${window.location.origin}/payment/failure`,
  });
  return `https://uat.esewa.com.np/epay/main?${params.toString()}`;
}

export default paymentApi;
