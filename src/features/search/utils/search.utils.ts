import type { NlpSearchResult } from "@/features/intelligence/api/intelligence.api";

/**
 * Normalises the token list from an NLP search response.
 * The backend sometimes returns `keywords`, sometimes `query_tokens`; prefer
 * `keywords` when non-empty, fall back to `query_tokens`.
 * @param result - raw NLP search response.
 * @returns deduplicated token array.
 */
export function normalizeTokens(result: NlpSearchResult): string[] {
  if (result.keywords && result.keywords.length > 0) return result.keywords;
  return result.query_tokens ?? [];
}

/**
 * Normalises the filters object from an NLP search response.
 * Prefers `filters` when non-empty, falls back to `filters_applied`.
 * @param result - raw NLP search response.
 * @returns filters record.
 */
export function normalizeFilters(result: NlpSearchResult): Record<string, string> {
  if (result.filters && Object.keys(result.filters).length > 0) return result.filters;
  return result.filters_applied ?? {};
}
