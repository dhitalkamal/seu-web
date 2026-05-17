import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import PublicLayout from "@/shared/layouts/PublicLayout";
import paymentApi from "../api/payment.api";

/** Shown after a successful payment gateway redirect. */
export default function SuccessPage() {
  const [params] = useSearchParams();
  const orderId = params.get("order_id") ?? "";

  const { data: order } = useQuery({
    queryKey: ["order", orderId],
    queryFn: () => paymentApi.getOrder(orderId),
    enabled: !!orderId,
  });

  return (
    <PublicLayout>
      <div className="max-w-lg mx-auto px-4 py-20 flex flex-col items-center gap-6 text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-3xl">
          ✓
        </div>
        <h1 className="text-2xl font-bold text-[#19191e] font-['Manrope']">Payment successful!</h1>
        <p className="text-sm text-[#6b6c75] font-['Manrope']">
          Your registration is confirmed. See your QR code below and save it for entry.
        </p>
        {order && (
          <div className="bg-white border border-[#e0dfd8] rounded-2xl p-6 flex flex-col items-center gap-4">
            <p className="text-xs text-[#6b6c75] font-['Manrope']">Order #{order.id.slice(0, 8)}</p>
            <p className="text-sm font-bold text-[#19191e] font-['Manrope']">
              NPR {order.total_amount} — {order.status}
            </p>
          </div>
        )}
        <div className="flex gap-4">
          <Link to="/tickets" className="text-sm font-bold text-[#19191e] font-['Manrope'] border border-[#e0dfd8] rounded-xl px-5 py-2.5 hover:bg-[#f3f2ef] transition-colors">
            My tickets
          </Link>
          <Link to="/" className="text-sm font-bold text-white bg-[#19191e] font-['Manrope'] rounded-xl px-5 py-2.5 hover:opacity-90 transition-opacity">
            Browse events
          </Link>
        </div>
      </div>
    </PublicLayout>
  );
}
