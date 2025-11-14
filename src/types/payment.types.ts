export type PaymentGateway = "khalti" | "esewa" | "stripe" | "paypal";
export type PaymentStatus = "created" | "processing" | "completed" | "failed" | "refunded" | "cancelled";

export type PaymentOrder = {
  id: string;
  event_id: string;
  registration_id: string;
  status: PaymentStatus;
  gateway: PaymentGateway;
  subtotal: string;
  discount_amount: string;
  platform_fee: string;
  total_amount: string;
  currency: string;
  created_at: string;
};
