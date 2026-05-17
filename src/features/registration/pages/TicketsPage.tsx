import PublicLayout from "@/shared/layouts/PublicLayout";

/**
 * User's registered events (tickets).
 * The participation service backend is not yet implemented.
 */
export default function TicketsPage() {
  return (
    <PublicLayout>
      <div className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-[#19191e] font-['Manrope'] mb-8">My tickets</h1>

        <div className="bg-white border border-[#e0dfd8] rounded-2xl p-12 text-center flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#f3f2ef] flex items-center justify-center text-3xl">
            🎫
          </div>
          <h2 className="text-base font-bold text-[#19191e] font-['Manrope']">
            Tickets coming soon
          </h2>
          <p className="text-sm text-[#6b6c75] font-['Manrope'] max-w-sm">
            Event registration and ticket management will be available here once the participation
            service is live. You&apos;ll see all your confirmed bookings, QR codes, and check-in
            history.
          </p>
        </div>
      </div>
    </PublicLayout>
  );
}
