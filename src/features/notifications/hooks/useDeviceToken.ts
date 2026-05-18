import { useEffect } from "react";
import { useAuthStore } from "@/shared/store/auth.store";
import notificationsApi from "../api/notifications.api";

/** Registers the browser as a push notification device when the user is authenticated. */
export function useDeviceToken() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) return;
    // web push registration - only works in browsers that support it
    if (!("serviceWorker" in navigator) || !("Notification" in window)) return;
    if (Notification.permission !== "granted") return;

    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => {
        if (sub) {
          const token = btoa(JSON.stringify(sub));
          notificationsApi.registerDeviceToken(token, "web").catch(() => {
            // registration failure is non-fatal
          });
        }
      })
      .catch(() => {
        // push not available in this environment
      });
  }, [isAuthenticated]);
}
