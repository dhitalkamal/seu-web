import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { v4 as uuidv4 } from "uuid";
import AppLayout from "@/shared/layouts/AppLayout";
import paymentApi, { submitEsewaForm } from "../api/payment.api";
import registrationApi from "@/features/registration/api/registration.api";
import type { Gateway } from "../types";

type PromoResult = {
  valid: boolean;
  discount_type: string;
  discount_value: number;
};

const GATEWAY_LABELS: Record<Gateway, string> = {
  khalti: "Khalti",
  esewa: "eSewa",
  stripe: "Stripe",
  paypal: "PayPal",
};

/** Checkout page: build the order, then redirect to the payment gateway. */
export default function CheckoutPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const eventId = params.get("event_id") ?? "";
  const registrationId = params.get("registration_id") || undefined;
  const subtotal = params.get("subtotal") ?? "0.00";
  const organizationId = params.get("organization_id") || undefined;
  const [gateway, setGateway] = useState<Gateway>("khalti");
  const [promoCode, setPromoCode] = useState("");
  const [promoResult, setPromoResult] = useState<PromoResult | null>(null);
  const [promoError, setPromoError] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);

  // check if user already has a registration for this event
  const { data: myRegistrations = [] } = useQuery({
    queryKey: ["my-registrations"],
    queryFn: () => registrationApi.listMine(),
  });
  const alreadyRegistered = myRegistrations.some(
    (r) => r.event_id === eventId && (r.status === "confirmed" || r.status === "checked_in")
  );

  const orderMutation = useMutation({
    mutationFn: () =>
      paymentApi.createOrder({
        event_id: eventId,
        registration_id: registrationId,
        subtotal,
        gateway,
        idempotency_key: uuidv4(),
        promo_code: promoCode || undefined,
        organization_id: organizationId,
      }),
    onSuccess: (res) => {
      // * eSewa uses a form POST instead of a simple redirect
      if (gateway === "esewa" && res.esewa_form_data) {
        submitEsewaForm(res.esewa_form_url ?? res.payment_url ?? "", res.esewa_form_data);
        return;
      }

      // * all other gateways return a payment_url, just redirect
      if (res.payment_url) {
        window.location.href = res.payment_url;
      }
    },
  });

  /**
   * Validate the entered promo code against the payment API.
   * Updates promoResult with discount details on success.
   */
  async function handleValidatePromo() {
    if (!promoCode.trim()) return;
    setPromoLoading(true);
    setPromoError("");
    setPromoResult(null);
    try {
      const result = await paymentApi.validatePromoCode(promoCode.trim());
      if (result.valid) {
        setPromoResult(result);
      } else {
        setPromoError("Invalid or expired promo code.");
      }
    } catch {
      setPromoError("Could not validate promo code. Please try again.");
    } finally {
      setPromoLoading(false);
    }
  }

  if (!eventId) {
    return (
      <AppLayout variant="user" title="Checkout">
        <div className="max-w-lg mx-auto px-4 py-20 text-center">
          <p className="text-sm text-red-600 font-['Manrope']">
            Invalid checkout link. Please go back and try again.
          </p>
        </div>
      </AppLayout>
    );
  }

  if (alreadyRegistered) {
    return (
      <AppLayout variant="user" title="Checkout">
        <div className="max-w-lg mx-auto px-4 py-20 text-center">
          <p className="text-lg font-bold text-[#16a34a] font-['Manrope'] mb-2">
            You are already registered for this event.
          </p>
          <p className="text-sm text-[#6b7280] font-['Manrope'] mb-6">
            Check your tickets to view your registration details.
          </p>
          <button
            onClick={() => navigate("/tickets")}
            className="bg-[#19191e] text-white text-sm font-bold font-['Manrope'] rounded-2xl px-8 py-3 hover:opacity-90"
          >
            View My Tickets
          </button>
        </div>
      </AppLayout>
    );
  }

  // * compute discount from validated promo code
  const subtotalNum = parseFloat(subtotal);
  let discountAmount = 0;
  if (promoResult?.valid) {
    if (promoResult.discount_type === "percentage") {
      discountAmount = (subtotalNum * promoResult.discount_value) / 100;
    } else {
      // flat amount discount
      discountAmount = Math.min(promoResult.discount_value, subtotalNum);
    }
  }
  const discountedSubtotal = Math.max(0, subtotalNum - discountAmount);
  const total = discountedSubtotal.toFixed(2);

  return (
    <AppLayout variant="user" title="Checkout">
      <div className="max-w-lg mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-[#19191e] font-['Manrope'] mb-8">Checkout</h1>

        <div className="bg-white border border-[#e0dfd8] rounded-2xl p-6 flex flex-col gap-6">
          {/* price summary */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-sm font-['Manrope'] text-[#19191e]">
              <span>Subtotal</span>
              <span>NPR {subtotal}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-sm font-['Manrope'] text-green-600">
                <span>
                  Discount (
                  {promoResult?.discount_type === "percentage"
                    ? `${promoResult.discount_value}%`
                    : "flat"}
                  )
                </span>
                <span>- NPR {discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="h-px bg-[#e0dfd8]" />
            <div className="flex justify-between text-base font-bold font-['Manrope'] text-[#19191e]">
              <span>Total</span>
              <span>NPR {total}</span>
            </div>
          </div>

          {/* promo code */}
          <div>
            <label className="text-xs font-semibold text-[#19191e] font-['Manrope'] block mb-2">
              Promo code (optional)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={promoCode}
                onChange={(e) => {
                  setPromoCode(e.target.value.toUpperCase());
                  // clear previous result when the user edits the code
                  setPromoResult(null);
                  setPromoError("");
                }}
                onKeyDown={(e) => e.key === "Enter" && handleValidatePromo()}
                placeholder="SAVE10"
                className="flex-1 border border-[#e0dfd8] rounded-xl px-4 py-2.5 text-sm font-['Manrope'] focus:outline-none focus:border-[#19191e]"
              />
              <button
                type="button"
                onClick={handleValidatePromo}
                disabled={!promoCode.trim() || promoLoading}
                className="border border-[#e0dfd8] rounded-xl px-4 py-2.5 text-sm font-semibold font-['Manrope'] text-[#19191e] hover:bg-[#f3f2ef] disabled:opacity-50"
              >
                {promoLoading ? "..." : "Apply"}
              </button>
            </div>
            {promoError && (
              <p className="mt-1 text-xs text-red-600 font-['Manrope']">{promoError}</p>
            )}
            {promoResult?.valid && (
              <p className="mt-1 text-xs text-green-600 font-['Manrope'] font-semibold">
                Promo applied: NPR {discountAmount.toFixed(2)} off
              </p>
            )}
          </div>

          {/* gateway selection */}
          <div>
            <label className="text-xs font-semibold text-[#19191e] font-['Manrope'] block mb-2">
              Payment method
            </label>
            <div className="grid grid-cols-2 gap-3">
              {(Object.keys(GATEWAY_LABELS) as Gateway[]).map((gw) => (
                <button
                  key={gw}
                  onClick={() => setGateway(gw)}
                  className={`border rounded-xl px-4 py-3 text-sm font-semibold font-['Manrope'] transition-colors ${
                    gateway === gw
                      ? "border-[#19191e] bg-[#19191e] text-white"
                      : "border-[#e0dfd8] text-[#19191e] hover:bg-[#f3f2ef]"
                  }`}
                >
                  {GATEWAY_LABELS[gw]}
                </button>
              ))}
            </div>
          </div>

          {orderMutation.isError && (
            <p className="text-sm text-red-600 font-['Manrope']">
              {(() => {
                const err = orderMutation.error;
                const msg =
                  (err as { response?: { data?: { error?: { message?: string } } } })?.response
                    ?.data?.error?.message ?? "";
                if (msg.toLowerCase().includes("already")) return msg;
                return "Payment failed. Please try again.";
              })()}
            </p>
          )}

          <button
            onClick={() => orderMutation.mutate()}
            disabled={orderMutation.isPending}
            className="w-full bg-[#19191e] text-white text-sm font-bold font-['Manrope'] rounded-2xl py-3.5 hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {orderMutation.isPending
              ? "Processing..."
              : `Pay NPR ${total} with ${GATEWAY_LABELS[gateway]}`}
          </button>
        </div>
      </div>
    </AppLayout>
  );
}
