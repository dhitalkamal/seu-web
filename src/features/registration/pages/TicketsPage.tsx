import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AppLayout from "@/shared/layouts/AppLayout";

import registrationApi from "../api/registration.api";
import type { Registration } from "../types";

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  confirmed: { label: "Confirmed", color: "bg-green-100 text-green-700" },
  checked_in: { label: "Checked in", color: "bg-blue-100 text-blue-700" },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-600" },
  waitlisted: { label: "Waitlisted", color: "bg-yellow-100 text-yellow-700" },
  pending: { label: "Pending", color: "bg-gray-100 text-gray-600" },
  no_show: { label: "No show", color: "bg-gray-100 text-gray-500" },
};

/** Single ticket card with inline QR toggle and cancel button. */
function TicketCard({ reg, onCancel }: { reg: Registration; onCancel: (id: string) => void }) {
  const [showQR, setShowQR] = useState(false);
  const { label, color } = STATUS_LABEL[reg.status] ?? { label: reg.status, color: "bg-gray-100 text-gray-600" };
  const cancellable = ["confirmed", "pending", "waitlisted"].includes(reg.status);

  return (
    <div className="bg-white border border-[#e0dfd8] rounded-2xl p-6 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs text-[#6b6c75] font-['Manrope'] mb-1">Registration code</p>
          <p className="text-lg font-bold text-[#19191e] font-mono tracking-widest">{reg.registration_code}</p>
        </div>
        <span className={`text-xs font-semibold px-3 py-1 rounded-full font-['Manrope'] ${color}`}>{label}</span>
      </div>

      <div className="text-xs text-[#6b6c75] font-['Manrope'] space-y-1">
        <p>Qty: {reg.quantity}</p>
        {reg.notes && <p>Notes: {reg.notes}</p>}
        <p>Registered: {new Date(reg.created_at).toLocaleDateString()}</p>
        {reg.checked_in_at && <p>Checked in: {new Date(reg.checked_in_at).toLocaleString()}</p>}
      </div>

      <div className="flex gap-3">
        {reg.status !== "cancelled" && (
          <button onClick={() => setShowQR(!showQR)} className="text-sm font-semibold text-[#19191e] font-['Manrope'] border border-[#e0dfd8] rounded-xl px-4 py-2 hover:bg-[#f3f2ef] transition-colors">
            {showQR ? "Hide QR" : "Show QR"}
          </button>
        )}
        {cancellable && (
          <button onClick={() => onCancel(reg.id)} className="text-sm font-semibold text-red-600 font-['Manrope'] border border-red-200 rounded-xl px-4 py-2 hover:bg-red-50 transition-colors">
            Cancel
          </button>
        )}
      </div>

      {showQR && (
        <div className="flex flex-col items-center gap-2 pt-2">
          <QRCodeSVG value={reg.registration_code} size={180} />
          <p className="text-xs text-[#6b6c75] font-['Manrope']">Show this at the event entrance</p>
        </div>
      )}
    </div>
  );
}

/** Lists the user's registrations with QR codes and a cancel action. */
export default function TicketsPage() {
  const queryClient = useQueryClient();
  const { data: registrations = [], isLoading, error } = useQuery({
    queryKey: ["my-registrations"],
    queryFn: registrationApi.listMine,
  });
  const cancelMutation = useMutation({
    mutationFn: registrationApi.cancel,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["my-registrations"] }),
  });

  const handleCancel = (id: string) => {
    if (confirm("Are you sure you want to cancel this registration?")) cancelMutation.mutate(id);
  };

  return (
    <AppLayout title="My tickets" subtitle="Your event registrations and QR codes.">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-[#19191e] font-['Manrope'] mb-8">My tickets</h1>
        {isLoading && <p className="text-sm text-[#6b6c75] font-['Manrope']">Loading your tickets...</p>}
        {error && <p className="text-sm text-red-600 font-['Manrope']">Failed to load tickets. Please try again.</p>}
        {cancelMutation.isError && <p className="text-sm text-red-600 font-['Manrope'] mb-4">Failed to cancel. Please try again.</p>}
        {!isLoading && !error && registrations.length === 0 && (
          <div className="bg-white border border-[#e0dfd8] rounded-2xl p-12 text-center flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[#f3f2ef] flex items-center justify-center text-3xl">🎫</div>
            <h2 className="text-base font-bold text-[#19191e] font-['Manrope']">No tickets yet</h2>
            <p className="text-sm text-[#6b6c75] font-['Manrope'] max-w-sm">Register for an event and your tickets will appear here with QR codes for check-in.</p>
          </div>
        )}
        {registrations.length > 0 && (
          <div className="flex flex-col gap-4">
            {registrations.map((reg) => (<TicketCard key={reg.id} reg={reg} onCancel={handleCancel} />))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
