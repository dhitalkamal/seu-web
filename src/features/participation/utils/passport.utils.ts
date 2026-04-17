import type { PassportEntry } from "@/features/participation/api/participation.api";

/**
 * Counts entries matching a specific participation role.
 * @param entries - full list of passport entries.
 * @param role - role to filter by.
 * @returns count of matching entries.
 */
export function countByRole(entries: PassportEntry[], role: PassportEntry["role"]): number {
  return entries.filter((e) => e.role === role).length;
}

/**
 * Counts entries that have had a certificate issued.
 * @param entries - full list of passport entries.
 * @returns count of entries with certificate_issued=true.
 */
export function countWithCertificate(entries: PassportEntry[]): number {
  return entries.filter((e) => e.certificate_issued).length;
}

/**
 * Returns a new array sorted newest-first by attended_at, leaving the
 * original array unmodified.
 * @param entries - full list of passport entries.
 * @returns sorted copy.
 */
export function sortNewestFirst(entries: PassportEntry[]): PassportEntry[] {
  return [...entries].sort(
    (a, b) => new Date(b.attended_at).getTime() - new Date(a.attended_at).getTime()
  );
}
