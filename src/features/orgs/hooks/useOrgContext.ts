/**
 * Bootstraps org context on app mount — fetches the user's orgs from the
 * management-service and populates the org store. Call once near the app root
 * (e.g. inside AppLayout or a top-level provider).
 *
 * Refetches on window focus and route changes so the navbar switcher
 * appears immediately after a superadmin approves the org — no manual
 * refresh required.
 */

import { useEffect, useCallback, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useAuthStore } from "@/shared/store/auth.store";
import { useOrgStore } from "@/shared/store/org.store";
import orgApi from "@/features/orgs/api/org.api";

/** Minimum milliseconds between automatic refetches to avoid spamming. */
const REFETCH_COOLDOWN_MS = 15_000;

type OrgContextOptions = {
  /** Whether to actually fetch org data from the API. Defaults to true.
   *  Pass false on attendee/volunteer pages to skip the network call —
   *  the persisted store still provides org data for the switcher. */
  enabled?: boolean;
};

/**
 * Loads the user's org list from the backend and picks the first one
 * (users currently own at most one org). Refetches on window focus
 * and navigation so status changes from superadmin are picked up fast.
 *
 * @param options.enabled - set to false to skip API calls (reads persisted store only)
 */
export function useOrgContext({ enabled = true }: OrgContextOptions = {}) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { org, loaded, setOrg, markLoaded } = useOrgStore();
  const lastFetch = useRef(0);
  const location = useLocation();

  /** Grab the user's orgs from the backend and store the first one. */
  const fetchOrg = useCallback(async () => {
    // ! throttle — don't hit the API more than once per cooldown window
    const now = Date.now();
    if (now - lastFetch.current < REFETCH_COOLDOWN_MS) return;
    lastFetch.current = now;

    try {
      const orgs = await orgApi.list();
      if (orgs.length > 0) {
        setOrg(orgs[0]);
      } else {
        markLoaded();
      }
    } catch {
      // ! Non-fatal — user just doesn't see org features
      markLoaded();
    }
  }, [setOrg, markLoaded]);

  // * Initial fetch on mount — only when enabled (org dashboard pages)
  useEffect(() => {
    if (enabled && isAuthenticated && !loaded) {
      fetchOrg();
    }
  }, [enabled, isAuthenticated, loaded, fetchOrg]);

  // * Refetch when the user navigates — picks up status changes quickly
  useEffect(() => {
    if (enabled && isAuthenticated && loaded) {
      fetchOrg();
    }
  }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  // * Refetch on window focus — catches approval while the tab was in background
  useEffect(() => {
    function handleFocus() {
      if (enabled && isAuthenticated) {
        fetchOrg();
      }
    }
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [enabled, isAuthenticated, fetchOrg]);

  return { org, loaded, refetch: fetchOrg };
}
