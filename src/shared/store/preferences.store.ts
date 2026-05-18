/**
 * Lightweight user preferences store — persisted to localStorage.
 * Tracks client-side settings like volunteer mode, theme, and locale.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

type PreferencesState = {
  /** Whether the user has opted into volunteer mode — shows volunteer dashboard in the switcher. */
  volunteerEnabled: boolean;
  /** UI theme preference. */
  theme: "light" | "dark" | "system";
  /** Toggle volunteer mode on or off. */
  setVolunteerEnabled: (enabled: boolean) => void;
  /** Update the theme preference. */
  setTheme: (theme: "light" | "dark" | "system") => void;
};

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      volunteerEnabled: false,
      theme: "light",
      setVolunteerEnabled: (enabled) => set({ volunteerEnabled: enabled }),
      setTheme: (theme) => set({ theme }),
    }),
    { name: "sansaar-preferences" }
  )
);
