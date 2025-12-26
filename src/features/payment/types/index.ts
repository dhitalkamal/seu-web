/** Payment domain types. */

export type Gateway = "khalti" | "esewa" | "stripe" | "paypal";

export interface PaymentOrder {
  id: string;
  user_id: string;
  event_id: string;
  registration_id: string;
  subtotal: string;
  discount_amount: string;
  tax_amount: string;
  gateway_fee: string;
  platform_fee: string;
  total_amount: string;
  currency: string;
  status: "created" | "processing" | "completed" | "failed" | "refunded" | "cancelled";
  gateway: Gateway;
  gateway_order_id: string;
  idempotency_key: string;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface CreateOrderPayload {
  event_id: string;
  registration_id: string;
  subtotal: string;
  gateway: Gateway;
  idempotency_key: string;
  promo_code?: string;
}
