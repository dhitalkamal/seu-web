import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AppLayout from "@/shared/layouts/AppLayout";
import { PH, KPI, MS, useToast } from "@/shared/components/v8";
import apiClient from "@/shared/api/client";
import type { Event } from "@/features/events/types/event.types";

// shape returned by GET /participation/api/v1/events/<id>/waitlist/
type WaitlistEntry = {
  id: string;
  user_id: string;
  event_id: string;
  status: "waiting" | "offered" | "accepted" | "declined" | "expired";
  position: number;
  created_at: string;
};

type WaitlistResponse = { data: WaitlistEntry[] };
type EventsResponse = { data: Event[] };

/** Pill badge colours keyed by waitlist status. */
const STATUS_COLOR: Record<WaitlistEntry["status"], string> = {
  waiting: "lav",
  offered: "pch",
  accepted: "mnt",
  declined: "crl",
  expired: "grey",
};

/**
 * Formats an ISO date string to "Mon DD, YYYY".
 * @param iso - ISO date string from the API.
 * @returns human-readable short date.
 */
function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Truncates a UUID-style user ID to first 8 chars with ellipsis for table display.
 * @param id - full user UUID.
 * @returns shortened display string.
 */
function truncId(id: string): string {
  return id.length > 8 ? `${id.slice(0, 8)}…` : id;
}

/** Waitlist management page - shows the FIFO queue for a selected event. */
export default function WaitlistPage() {
  const queryClient = useQueryClient();
  const { toast, toastEl } = useToast();
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [actionInFlight, setActionInFlight] = useState<string | null>(null);

  // load organizer's events to populate the event selector
  const { data: eventsData, isLoading: eventsLoading } = useQuery({
    queryKey: ["my-events-for-waitlist"],
    queryFn: async () => {
      const res = await apiClient.get<EventsResponse>("/event/api/v1/events/my/");
      return (res.data?.data ?? []) as Event[];
    },
  });

  const events = eventsData ?? [];

  // load waitlist entries for the selected event
  const {
    data: waitlistData,
    isLoading: waitlistLoading,
    isError: waitlistError,
  } = useQuery({
    queryKey: ["waitlist-entries", selectedEventId],
    queryFn: async () => {
      const res = await apiClient.get<WaitlistResponse>(
        `/participation/api/v1/events/${selectedEventId}/waitlist/`
      );
      return (res.data?.data ?? []) as WaitlistEntry[];
    },
    // only run when an event is selected
    enabled: Boolean(selectedEventId),
  });

  const entries = waitlistData ?? [];

  // derived KPI counts from live data
  const countWaiting = entries.filter((e) => e.status === "waiting").length;
  const countOffered = entries.filter((e) => e.status === "offered").length;
  const countAccepted = entries.filter((e) => e.status === "accepted").length;
  const countTotal = entries.length;

  // accept a waitlist entry - moves attendee from offered -> accepted
  const acceptMutation = useMutation({
    mutationFn: async (entryId: string) => {
      await apiClient.post(`/participation/api/v1/waitlist/${entryId}/accept/`);
    },
    onMutate: (entryId) => setActionInFlight(entryId),
    onSuccess: () => {
      toast("Entry accepted");
      void queryClient.invalidateQueries({ queryKey: ["waitlist-entries", selectedEventId] });
    },
    onError: () => toast("Failed to accept entry"),
    onSettled: () => setActionInFlight(null),
  });

  // decline a waitlist entry - removes the offer, passes slot to next in queue
  const declineMutation = useMutation({
    mutationFn: async (entryId: string) => {
      await apiClient.post(`/participation/api/v1/waitlist/${entryId}/decline/`);
    },
    onMutate: (entryId) => setActionInFlight(entryId),
    onSuccess: () => {
      toast("Entry declined");
      void queryClient.invalidateQueries({ queryKey: ["waitlist-entries", selectedEventId] });
    },
    onError: () => toast("Failed to decline entry"),
    onSettled: () => setActionInFlight(null),
  });

  return (
    <AppLayout variant="org">
      {toastEl}

      <PH
        crumbs={["Operations", "Waitlist"]}
        title="Waitlist"
        sub="FIFO queue of attendees waiting for spots to open. Promotion happens automatically when a cancellation creates capacity."
        actions={
          /* event selector - required to scope the waitlist view */
          <select
            className="btn-sm"
            style={{ padding: "7px 13px" }}
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            disabled={eventsLoading}
          >
            <option value="">{eventsLoading ? "Loading events…" : "Select an event"}</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.title}
              </option>
            ))}
          </select>
        }
      />

      {/* * KPI row - counts derived from live waitlist data */}
      <div className="kpi-grid">
        <KPI
          icon="hourglass_top"
          color="lav"
          label="Waiting"
          value={selectedEventId ? String(countWaiting) : "N/A"}
        />
        <KPI
          icon="local_offer"
          color="pch"
          label="Offered"
          value={selectedEventId ? String(countOffered) : "N/A"}
        />
        <KPI
          icon="check_circle"
          color="mnt"
          label="Accepted"
          value={selectedEventId ? String(countAccepted) : "N/A"}
        />
        <KPI
          icon="format_list_numbered"
          color="crl"
          label="Total"
          value={selectedEventId ? String(countTotal) : "N/A"}
        />
      </div>

      {/* auto-promotion notice */}
      <div className="notice" style={{ borderLeftColor: "var(--tertiary)" }}>
        <MS n="info" style={{ color: "var(--tertiary)" }} />
        <div>
          <strong>Waitlist auto-promotion is handled automatically by the system</strong>
          <span>
            When a confirmed registration is cancelled, the next person on the waitlist is notified.
            They have 24 hours to claim the spot before it passes to the next entry. No manual
            action is required.
          </span>
        </div>
      </div>

      {/* * waitlist queue table */}
      <div className="panel">
        <div className="panel-head">
          <span className="panel-title">Queue - FIFO order</span>
        </div>
        <div className="panel-body flush">
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ width: 60 }}>#</th>
                <th>User ID</th>
                <th>Status</th>
                <th>Joined</th>
                <th style={{ width: 120 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {/* no event selected yet */}
              {!selectedEventId && (
                <tr>
                  <td
                    colSpan={5}
                    style={{
                      textAlign: "center",
                      color: "var(--on-mut)",
                      fontSize: 13,
                      padding: "48px 0",
                    }}
                  >
                    Select an event above to view its waitlist.
                  </td>
                </tr>
              )}

              {/* loading state */}
              {selectedEventId && waitlistLoading && (
                <tr>
                  <td
                    colSpan={5}
                    style={{
                      textAlign: "center",
                      color: "var(--on-mut)",
                      fontSize: 13,
                      padding: "48px 0",
                    }}
                  >
                    Loading…
                  </td>
                </tr>
              )}

              {/* error state */}
              {selectedEventId && waitlistError && !waitlistLoading && (
                <tr>
                  <td
                    colSpan={5}
                    style={{
                      textAlign: "center",
                      color: "var(--err)",
                      fontSize: 13,
                      padding: "48px 0",
                    }}
                  >
                    Failed to load waitlist. Please try again.
                  </td>
                </tr>
              )}

              {/* empty state */}
              {selectedEventId && !waitlistLoading && !waitlistError && entries.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    style={{
                      textAlign: "center",
                      color: "var(--on-mut)",
                      fontSize: 13,
                      padding: "48px 0",
                    }}
                  >
                    No entries on the waitlist for this event.
                  </td>
                </tr>
              )}

              {/* data rows */}
              {entries.map((entry) => {
                const busy = actionInFlight === entry.id;
                return (
                  <tr key={entry.id}>
                    <td>{entry.position}</td>
                    <td style={{ fontFamily: "monospace", fontSize: 13 }}>
                      {truncId(entry.user_id)}
                    </td>
                    <td>
                      {/* status pill badge */}
                      <span
                        className={`badge ${STATUS_COLOR[entry.status]}`}
                        style={{ textTransform: "capitalize" }}
                      >
                        {entry.status}
                      </span>
                    </td>
                    <td style={{ color: "var(--on-mut)", fontSize: 13 }}>
                      {fmtDate(entry.created_at)}
                    </td>
                    <td>
                      {/* only show action buttons when the entry has been offered */}
                      {entry.status === "offered" && (
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            className="btn-sm"
                            disabled={busy}
                            onClick={() => acceptMutation.mutate(entry.id)}
                            title="Accept this entry"
                          >
                            Accept
                          </button>
                          <button
                            className="btn-sm btn-ghost"
                            disabled={busy}
                            onClick={() => declineMutation.mutate(entry.id)}
                            title="Decline this entry"
                          >
                            Decline
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}
