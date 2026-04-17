import { describe, it, expect } from "vitest";
import type { NlpSearchResult } from "@/features/intelligence/api/intelligence.api";
import { normalizeTokens, normalizeFilters } from "@/features/search/utils/search.utils";

// * fixture: backend sometimes returns `keywords` sometimes `query_tokens`

const WITH_KEYWORDS: NlpSearchResult = {
  keywords: ["tech", "networking"],
  language: "en",
  filters: { category: "conference" },
};

const WITH_QUERY_TOKENS: NlpSearchResult = {
  keywords: [],
  language: "en",
  filters: {},
  query_tokens: ["free", "events"],
  filters_applied: { location: "Kathmandu" },
};

const EMPTY: NlpSearchResult = {
  keywords: [],
  language: "en",
  filters: {},
};

describe("normalizeTokens", () => {
  it("prefers keywords over query_tokens when keywords is non-empty", () => {
    expect(normalizeTokens(WITH_KEYWORDS)).toEqual(["tech", "networking"]);
  });

  it("falls back to query_tokens when keywords is empty", () => {
    expect(normalizeTokens(WITH_QUERY_TOKENS)).toEqual(["free", "events"]);
  });

  it("returns empty array when both are absent or empty", () => {
    expect(normalizeTokens(EMPTY)).toEqual([]);
  });
});

describe("normalizeFilters", () => {
  it("returns filters when filters has entries", () => {
    expect(normalizeFilters(WITH_KEYWORDS)).toEqual({ category: "conference" });
  });

  it("falls back to filters_applied when filters is empty", () => {
    expect(normalizeFilters(WITH_QUERY_TOKENS)).toEqual({ location: "Kathmandu" });
  });

  it("returns empty object when both are absent", () => {
    expect(normalizeFilters(EMPTY)).toEqual({});
  });
});
