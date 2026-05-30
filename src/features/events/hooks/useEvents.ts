import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import eventsApi from "@/features/events/api/events.api";
import type {
  CreateEventRequest,
  EventListFilters,
  UpdateEventRequest,
} from "@/features/events/types/event.types";

/** Paginated public event list with optional filters. */
export function usePublicEvents(filters?: EventListFilters) {
  return useQuery({
    queryKey: ["events", "public", filters],
    queryFn: () => eventsApi.listPublicEvents(filters),
  });
}

/** All events owned by the authenticated organizer. */
export function useMyEvents() {
  return useQuery({
    queryKey: ["events", "mine"],
    queryFn: () => eventsApi.listMyEvents(),
  });
}

/** Event categories used by creation/edit forms. */
export function useEventCategories() {
  return useQuery({
    queryKey: ["events", "categories"],
    queryFn: () => eventsApi.listCategories(),
    staleTime: 5 * 60 * 1000,
  });
}

/** Single event detail. */
export function useEvent(id: string) {
  return useQuery({
    queryKey: ["events", id],
    queryFn: () => eventsApi.getEvent(id),
    select: (res) => res.data,
    enabled: !!id,
  });
}

/** Mutations for create, update, publish, and delete. */
export function useEventMutations() {
  const qc = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (payload: CreateEventRequest) => eventsApi.createEvent(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["events"] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateEventRequest }) =>
      eventsApi.updateEvent(id, payload),
    onSuccess: (_res, { id }) => {
      qc.invalidateQueries({ queryKey: ["events", id] });
      qc.invalidateQueries({ queryKey: ["events", "mine"] });
    },
  });

  const publishMutation = useMutation({
    mutationFn: (id: string) => eventsApi.publishEvent(id),
    onSuccess: (_res, id) => {
      qc.invalidateQueries({ queryKey: ["events", id] });
      qc.invalidateQueries({ queryKey: ["events"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => eventsApi.deleteEvent(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["events"] }),
  });

  return { createMutation, updateMutation, publishMutation, deleteMutation };
}
