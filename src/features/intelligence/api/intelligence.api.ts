/** API calls for the intelligence/NLP feature. */

import client from "@/shared/api/client";

const BASE = "/intelligence/api/v1";

export type ReportFormat = "csv" | "pdf" | "excel" | "json";

export type ReportJob = {
  id: string;
  status: "pending" | "running" | "completed" | "failed";
  report_type: string;
  format: ReportFormat;
  file_url?: string | null;
  created_at: string;
  completed_at?: string | null;
};

export type GenerateReportPayload = {
  report_type: string;
  format: ReportFormat;
  filters?: Record<string, unknown>;
};

export type NlpSearchResult = {
  keywords: string[];
  language: string;
  filters: Record<string, string>;
  // results enriched client-side by combining tokens with event list
  results?: { event_id: string; score: number; reason: string }[];
  query_tokens?: string[];
  filters_applied?: Record<string, string>;
};

export type AttendeeMatch = {
  match_id: string;
  user_id: string;
  match_score: string;
  match_signals: { shared_events: number; total_events_a: number; total_events_b: number };
  is_introduced: boolean;
  introduced_at: string | null;
};

export type EventHealthScore = {
  event_id: string;
  health_score: number;
  registration_velocity: number;
  engagement_rate: number;
  risk_flags: string[];
};

const intelligenceApi = {
  /** Tokenise a natural-language query via GET ?q= and return keywords + filters. */
  nlpSearch: (query: string) =>
    client
      .get<{ data: NlpSearchResult }>(`${BASE}/nlp/search/`, { params: { q: query } })
      .then((r) => r.data.data),

  /** Get the computed health score for a single event. */
  getEventHealth: (eventId: string) =>
    client
      .get<{ data: EventHealthScore }>(`${BASE}/events/${eventId}/health/`)
      .then((r) => r.data.data),

  /** Get the ranked Who to Meet suggestions for the authenticated user at an event. */
  getConnections: (eventId: string) =>
    client
      .get<{ data: AttendeeMatch[] }>(`${BASE}/events/${eventId}/connections/`)
      .then((r) => r.data.data ?? []),

  /** Analyze the sentiment of a free-text string. */
  analyzeSentiment: (text: string) =>
    client
      .post<{
        data: { sentiment: string; score: number };
      }>(`${BASE}/nlp/sentiment/analyze`, { text })
      .then((r) => r.data.data),

  /** Send a connection introduction between two attendees at an event. */
  introduceConnection: (eventId: string, userId: string) =>
    client
      .post<{ data: unknown }>(`${BASE}/events/${eventId}/connections/${userId}/introduce/`)
      .then((r) => r.data.data),

  /** Get the networking settings for an event. */
  getConnectionSettings: (eventId: string) =>
    client
      .get<{
        data: { enabled: boolean; max_connections: number };
      }>(`${BASE}/events/${eventId}/connections/settings/`)
      .then((r) => r.data.data),

  /** Update the networking settings for an event. */
  updateConnectionSettings: (
    eventId: string,
    settings: { enabled?: boolean; max_connections?: number }
  ) =>
    client
      .patch<{ data: unknown }>(`${BASE}/events/${eventId}/connections/settings/`, settings)
      .then((r) => r.data.data),

  /** Classify a piece of text into a category with a confidence score. */
  classifyContent: (text: string) =>
    client
      .post<{
        data: { category: string; confidence: number };
      }>(`${BASE}/nlp/classification/analyze`, { text })
      .then((r) => r.data.data),

  /** Check text for policy violations, returning flagged categories and a score. */
  moderateContent: (text: string) =>
    client
      .post<{
        data: { flagged: boolean; categories: string[]; score: number };
      }>(`${BASE}/nlp/moderation/analyze`, { text })
      .then((r) => r.data.data),

  /** Extract named entities (people, places, orgs, etc.) from text. */
  extractEntities: (text: string) =>
    client
      .post<{
        data: { entities: { text: string; type: string }[] };
      }>(`${BASE}/nlp/entities/extract`, { text })
      .then((r) => r.data.data),

  /** Pull the most significant keywords out of a text string. */
  extractKeywords: (text: string) =>
    client
      .post<{ data: { keywords: string[] } }>(`${BASE}/nlp/keywords/extract`, { text })
      .then((r) => r.data.data),

  /** Identify the language a text string is written in. */
  detectLanguage: (text: string) =>
    client
      .post<{
        data: { language: string; confidence: number };
      }>(`${BASE}/nlp/language/detect`, { text })
      .then((r) => r.data.data),

  /** Compute a semantic similarity score between two strings. */
  scoreSimilarity: (text1: string, text2: string) =>
    client
      .post<{ data: { score: number } }>(`${BASE}/nlp/similarity/score`, { text1, text2 })
      .then((r) => r.data.data),

  /** Kick off an async report generation job. */
  generateReport: (payload: GenerateReportPayload) =>
    client.post<{ data: ReportJob }>(`${BASE}/reports/`, payload).then((r) => r.data.data),

  /** Poll a report generation job by ID until it completes or fails. */
  pollReportJob: (jobId: string) =>
    client.get<{ data: ReportJob }>(`${BASE}/reports/${jobId}/`).then((r) => r.data.data),

  /** List all past report jobs for the current user. */
  listReportJobs: () =>
    client.get<{ data: ReportJob[] }>(`${BASE}/reports/`).then((r) => r.data.data ?? []),

  /** Get a presigned download URL for a completed report. */
  getReportDownloadUrl: (jobId: string) =>
    client.get<{ data: { download_url: string } }>(`${BASE}/reports/${jobId}/download/`).then((r) => r.data.data.download_url),

  /** Send a chat message with history and optional event context to the NLP chat endpoint. */
  chat: (
    message: string,
    history: { role: "user" | "assistant"; content: string }[],
    events?: unknown[]
  ) =>
    client
      .post<{
        data: { reply: string; intent: string; tokens: string[]; events?: unknown[] };
      }>(`${BASE}/nlp/chat/`, { message, history, context: { events: events ?? [] } })
      .then((r) => r.data.data),
};

export default intelligenceApi;
