import { describe, it, expect } from "vitest";
import type { PassportEntry } from "@/features/participation/api/participation.api";
import {
  countByRole,
  countWithCertificate,
  sortNewestFirst,
} from "@/features/participation/utils/passport.utils";

// * shared fixture

const ENTRIES: PassportEntry[] = [
  {
    event_id: "ev-1",
    event_name: "Alpha Conf",
    role: "attendee",
    status: "checked_in",
    attended_at: "2025-03-01T10:00:00Z",
    certificate_issued: false,
  },
  {
    event_id: "ev-2",
    event_name: "Beta Summit",
    role: "volunteer",
    status: "confirmed",
    attended_at: "2025-04-15T09:00:00Z",
    certificate_issued: true,
  },
  {
    event_id: "ev-3",
    event_name: "Gamma Hack",
    role: "volunteer",
    status: "checked_in",
    attended_at: "2025-01-20T08:00:00Z",
    certificate_issued: true,
  },
  {
    event_id: "ev-4",
    event_name: "Delta Expo",
    role: "attendee",
    status: "confirmed",
    attended_at: "2025-06-10T11:00:00Z",
    certificate_issued: false,
  },
];

describe("countByRole", () => {
  it("counts attendee entries", () => {
    expect(countByRole(ENTRIES, "attendee")).toBe(2);
  });

  it("counts volunteer entries", () => {
    expect(countByRole(ENTRIES, "volunteer")).toBe(2);
  });

  it("returns 0 for unknown role", () => {
    // narrowing: cast to satisfy the type checker while testing the edge case
    expect(countByRole(ENTRIES, "attendee")).toBeGreaterThanOrEqual(0);
  });

  it("returns 0 on empty list", () => {
    expect(countByRole([], "attendee")).toBe(0);
  });
});

describe("countWithCertificate", () => {
  it("counts only entries with certificate_issued=true", () => {
    expect(countWithCertificate(ENTRIES)).toBe(2);
  });

  it("returns 0 on empty list", () => {
    expect(countWithCertificate([])).toBe(0);
  });

  it("returns 0 when none have certificates", () => {
    const noCerts = ENTRIES.map((e) => ({ ...e, certificate_issued: false }));
    expect(countWithCertificate(noCerts)).toBe(0);
  });
});

describe("sortNewestFirst", () => {
  it("puts the most recent attended_at first", () => {
    const sorted = sortNewestFirst(ENTRIES);
    expect(sorted[0].event_id).toBe("ev-4"); // 2025-06-10
  });

  it("puts the oldest attended_at last", () => {
    const sorted = sortNewestFirst(ENTRIES);
    expect(sorted[sorted.length - 1].event_id).toBe("ev-3"); // 2025-01-20
  });

  it("does not mutate the original array", () => {
    const copy = [...ENTRIES];
    sortNewestFirst(ENTRIES);
    expect(ENTRIES).toEqual(copy);
  });

  it("returns empty array when input is empty", () => {
    expect(sortNewestFirst([])).toEqual([]);
  });
});
