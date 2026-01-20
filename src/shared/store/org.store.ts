/**
 * Org context store — tracks which organisation the user owns/belongs to,
 * gates org dashboard access based on approval status, and powers the
 * Attendee ↔ Organiser switcher in the sidebar.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Organisation } from "@/features/orgs/types/org.types";

type OrgState = {
  /** The user's current org (null if they haven't created one yet). */
  org: Organisation | null;

  /** Whether we've attempted to load the org at least once this session. */
  loaded: boolean;

  /** Replace the stored org — call after create, fetch, or status change. */
  setOrg: (org: Organisation) => void;

  /** Clear org state — call on logout or org deletion. */
  clearOrg: () => void;

  /** Mark the initial load as complete (even if no org was found). */
  markLoaded: () => void;
};

// ! Helpers — derived from org.status, not stored separately

/** True when the org exists and has been approved/activated by a superadmin. */
export function isOrgActive(org: Organisation | null): boolean {
  if (!org) return false;
  return org.status === "active" || org.status === "approved";
}

/** True when the org is still waiting for superadmin review. */
export function isOrgPending(org: Organisation | null): boolean {
  if (!org) return false;
  return org.status === "pending_review";
}

/** True when the org was rejected or suspended. */
export function isOrgSuspended(org: Organisation | null): boolean {
  if (!org) return false;
  return org.status === "suspended";
}

/** Persisted org store — survives page refresh via localStorage under key "sansaar-org". */
export const useOrgStore = create<OrgState>()(
  persist(
    (set) => ({
      org: null,
      loaded: false,
      setOrg: (org) => set({ org, loaded: true }),
      clearOrg: () => set({ org: null, loaded: false }),
      markLoaded: () => set({ loaded: true }),
    }),
    { name: "sansaar-org" }
  )
);
