import PublicLayout from "@/shared/layouts/PublicLayout";

/**
 * In-app notification centre.
 * The notification service currently handles email delivery only;
 * a push/in-app channel will be added in a later phase.
 */
export default function NotificationsPage() {
  return (
    <PublicLayout>
      <div className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-[#19191e] font-['Manrope'] mb-8">Notifications</h1>

        <div className="bg-white border border-[#e0dfd8] rounded-2xl p-12 text-center flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#f3f2ef] flex items-center justify-center text-3xl">
            🔔
          </div>
          <h2 className="text-base font-bold text-[#19191e] font-['Manrope']">
            In-app notifications coming soon
          </h2>
          <p className="text-sm text-[#6b6c75] font-['Manrope'] max-w-sm">
            Security alerts and account updates are already sent to your email. In-app notifications
            for new events, registration confirmations, and reminders will appear here in a future
            release.
          </p>
          <div className="mt-2 flex flex-col gap-1 text-left w-full max-w-xs">
            {[
              "Security alerts (password change, MFA toggle)",
              "Event reminders",
              "Registration confirmations",
              "Organiser updates",
            ].map((item) => (
              <div
                key={item}
                className="flex items-center gap-2 text-sm text-[#6b6c75] font-['Manrope']"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#dba13d] shrink-0" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
