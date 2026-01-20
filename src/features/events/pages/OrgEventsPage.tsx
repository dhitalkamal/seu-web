import { useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import AppLayout from "@/shared/layouts/AppLayout";
import { PH, MS, useToast } from "@/shared/components/v8";
import { useMyEvents } from "@/features/events/hooks/useEvents";
import eventsApi from "@/features/events/api/events.api";
import type { Event, EventStatus } from "@/features/events/types/event.types";

/**
 * Formats an ISO date string to a short readable form.
 * @param dateStr - ISO date string.
 * @returns formatted date like "Oct 12, 2026".
 */
function fmtDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Builds a two-character slug from the event title for the icon cell.
 * @param title - event title string.
 * @returns two uppercase letters.
 */
function makeSlug(title: string): string {
  const words = title.trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return title.slice(0, 2).toUpperCase();
}

/** Events calendar page - lists all org events with tab filtering by status. */
export default function OrgEventsPage() {
  const navigate = useNavigate();
  const { toastEl, toast } = useToast();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"all" | EventStatus>("all");
  const { data: paginated, isLoading } = useMyEvents();

  // * mutation to mark a published event as completed
  const completeMutation = useMutation({
    mutationFn: (id: string) => eventsApi.completeEvent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-events"] });
      toast("Event marked as completed");
    },
  });

  const events: Event[] = paginated?.results ?? [];

  // * Compute tab counts from real data
  const counts = useMemo(() => {
    const c = {
      all: events.length,
      published: 0,
      draft: 0,
      scheduled: 0,
      cancelled: 0,
      completed: 0,
    };
    for (const ev of events) {
      const s = ev.status as keyof typeof c;
      if (s in c) {
        c[s] += 1;
      }
    }
    return c;
  }, [events]);

  const tabs: [string, string][] = [
    ["all", "All"],
    ["published", "Published"],
    ["draft", "Draft"],
    ["cancelled", "Cancelled"],
    ["completed", "Completed"],
  ];

  const filtered = tab === "all" ? events : events.filter((e) => e.status === tab);

  return (
    <AppLayout variant="org">
      {toastEl}
      <PH
        crumbs={["Workspace", "Events"]}
        title="Events calendar"
        sub="From intimate workshops to flagship galas - capacity, registration, and logistics in one timeline."
        actions={
          <Link to="/events/create" className="btn-sm primary" style={{ textDecoration: "none" }}>
            <MS n="add" size={13} />
            New event
          </Link>
        }
      />

      <div className="tabs">
        {tabs.map(([k, l]) => (
          <button
            key={k}
            className={`tab${tab === k ? " active" : ""}`}
            onClick={() => setTab(k as "all" | EventStatus)}
          >
            {l}
            <span className="b">{counts[k as keyof typeof counts] ?? 0}</span>
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="panel" style={{ padding: 32, textAlign: "center", color: "var(--on-mut)" }}>
          Loading events...
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <div className="panel" style={{ padding: 48, textAlign: "center" }}>
          <MS n="event" size={32} />
          <div
            style={{ marginTop: 12, fontWeight: 600, fontSize: 16, fontFamily: "Space Grotesk" }}
          >
            No events found
          </div>
          <div style={{ color: "var(--on-mut)", fontSize: 13, marginTop: 4 }}>
            {tab === "all"
              ? "Create your first event to get started."
              : `No ${tab} events right now.`}
          </div>
        </div>
      )}

      {filtered.length > 0 && (
        <div className="panel">
          <div className="panel-body flush">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Date</th>
                  <th>Location</th>
                  <th>Registrations</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((ev) => (
                  <tr key={ev.id} onClick={() => navigate(`/events/${ev.id}`)}>
                    <td>
                      <div className="ev-cell">
                        <div className="ev-icon" style={{ background: "#050a26", color: "white" }}>
                          {makeSlug(ev.title)}
                        </div>
                        <span className="ev-name">{ev.title}</span>
                      </div>
                    </td>
                    <td style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11.5 }}>
                      {fmtDate(ev.start_date)}
                    </td>
                    <td>{ev.location}</td>
                    <td style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11.5 }}>
                      {ev.registered_count}/{ev.capacity}
                    </td>
                    <td style={{ fontWeight: 700, fontFamily: "Space Grotesk" }}>
                      {ev.is_free ? "Free" : ev.price}
                    </td>
                    <td>
                      <span className={`pill ${ev.status}`}>{ev.status}</span>
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      {ev.status === "published" && (
                        <button
                          className="btn-sm"
                          onClick={() => completeMutation.mutate(ev.id)}
                          disabled={completeMutation.isPending}
                        >
                          <MS n="event_available" size={12} />
                          Complete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
