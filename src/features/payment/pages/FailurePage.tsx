import { Link, useSearchParams } from "react-router-dom";
import PublicLayout from "@/shared/layouts/PublicLayout";

/** Shown after a failed or cancelled payment. */
export default function FailurePage() {
  const [params] = useSearchParams();
  const eventId = params.get("event_id") ?? "";

  return (
    <PublicLayout>
      <div className="max-w-lg mx-auto px-4 py-20 flex flex-col items-center gap-6 text-center">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center text-3xl">
          ✗
        </div>
        <h1 className="text-2xl font-bold text-[#19191e] font-['Manrope']">Payment failed</h1>
        <p className="text-sm text-[#6b6c75] font-['Manrope']">
          Your payment could not be processed. You have not been charged. Please try again.
        </p>
        <div className="flex gap-4">
          {eventId && (
            <Link to={`/events/${eventId}`} className="text-sm font-bold text-[#19191e] font-['Manrope'] border border-[#e0dfd8] rounded-xl px-5 py-2.5 hover:bg-[#f3f2ef] transition-colors">
              Try again
            </Link>
          )}
          <Link to="/" className="text-sm font-bold text-white bg-[#19191e] font-['Manrope'] rounded-xl px-5 py-2.5 hover:opacity-90 transition-opacity">
            Browse events
          </Link>
        </div>
      </div>
    </PublicLayout>
  );
}
