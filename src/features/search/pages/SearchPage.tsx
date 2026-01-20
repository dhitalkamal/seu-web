import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/shared/layouts/AppLayout";
import { PH, MS, useToast } from "@/shared/components/v8";
import intelligenceApi from "@/features/intelligence/api/intelligence.api";

/** Pre-written suggestions shown before the user types anything. */
const SUGGESTIONS = [
  "Free networking events",
  "Tech conferences Kathmandu",
  "Volunteer opportunities",
];

/** NLP-powered search page - sends a natural-language query and renders ranked results. */
export default function SearchPage() {
  const { toastEl } = useToast();
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  const searchMutation = useMutation({
    mutationFn: (query: string) => intelligenceApi.nlpSearch(query),
  });

  /** Fires the mutation if the input is non-empty. */
  function handleSearch() {
    if (!q.trim()) return;
    searchMutation.mutate(q.trim());
  }

  // the backend returns tokenised keywords + language; no ranked results yet
  const tokens = searchMutation.data?.keywords ?? searchMutation.data?.query_tokens ?? [];
  const filters = searchMutation.data?.filters ?? searchMutation.data?.filters_applied ?? {};
  const results = searchMutation.data?.results ?? [];

  return (
    <AppLayout variant="user">
      {toastEl}
      <PH
        crumbs={["Discover", "Search"]}
        title="Search"
        sub="Natural-language query is tokenised and turned into filters. Toggle any chip to refine."
      />

      {/* search box */}
      <div className="panel" style={{ marginBottom: 18 }}>
        <div className="panel-body">
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <MS n="search" size={20} style={{ color: "var(--on-mut)", flexShrink: 0 }} />
            <input
              className="field-in"
              style={{
                flex: 1,
                fontSize: 16,
                border: "none",
                outline: "none",
                background: "transparent",
                padding: 0,
              }}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="e.g. free tech events in Kathmandu this month"
            />
            <button
              className="btn-sm primary"
              onClick={handleSearch}
              disabled={!q.trim() || searchMutation.isPending}
              style={{ flexShrink: 0 }}
            >
              {searchMutation.isPending ? "Searching..." : "Search"}
            </button>
          </div>
        </div>
      </div>

      {/* token chips */}
      {tokens.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 18 }}>
          {tokens.map((t) => (
            <span
              key={t}
              style={{
                padding: "4px 12px",
                borderRadius: 20,
                background: "var(--low)",
                fontSize: 12,
                fontFamily: "JetBrains Mono, monospace",
                color: "var(--on-var)",
              }}
            >
              {t}
            </span>
          ))}
          {Object.entries(filters).map(([k, v]) => (
            <span
              key={k}
              style={{
                padding: "4px 12px",
                borderRadius: 20,
                background: "linear-gradient(135deg,#050a26,#3b3a72)",
                fontSize: 12,
                fontFamily: "JetBrains Mono, monospace",
                color: "white",
              }}
            >
              {k}: {v}
            </span>
          ))}
        </div>
      )}

      {/* error state */}
      {searchMutation.isError && (
        <div className="panel">
          <div
            className="panel-body"
            style={{ textAlign: "center", color: "var(--error)", padding: "32px 0" }}
          >
            Search service unavailable. Please try again.
          </div>
        </div>
      )}

      {/* show extracted keywords as a "browse with these filters" panel */}
      {searchMutation.isSuccess && tokens.length > 0 && (
        <div className="panel">
          <div className="panel-head">
            <span className="panel-title">Browse matching events</span>
            <span
              style={{
                fontFamily: "JetBrains Mono, monospace",
                fontSize: 10,
                color: "var(--on-mut)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              {searchMutation.data?.language === "ne" ? "Nepali query" : "English query"}
            </span>
          </div>
          <div className="panel-body">
            <p
              style={{
                fontSize: 13,
                color: "var(--on-var)",
                marginBottom: 16,
                fontFamily: "Manrope, sans-serif",
              }}
            >
              Your query was tokenised into {tokens.length} keyword{tokens.length !== 1 ? "s" : ""}.
              Click any keyword to search events, or browse all events with your full query applied.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
              {tokens.map((t) => (
                <button
                  key={t}
                  onClick={() => navigate(`/events?search=${encodeURIComponent(t)}`)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 20,
                    border: "1px solid var(--outline)",
                    background: "var(--low)",
                    cursor: "pointer",
                    fontSize: 13,
                    fontFamily: "JetBrains Mono, monospace",
                    color: "var(--on-bg)",
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
            <button
              className="btn-sm primary"
              onClick={() => navigate(`/events?search=${encodeURIComponent(q)}`)}
              style={{ justifyContent: "center" }}
            >
              <MS n="travel_explore" size={14} />
              Browse events for &quot;{q}&quot;
            </button>
          </div>
        </div>
      )}

      {searchMutation.isSuccess && tokens.length === 0 && (
        <div className="panel">
          <div
            className="panel-body"
            style={{ textAlign: "center", color: "var(--on-mut)", padding: "40px 0" }}
          >
            <MS
              n="search_off"
              size={32}
              style={{ display: "block", margin: "0 auto 12px", opacity: 0.3 }}
            />
            No keywords extracted. Try a more descriptive query.
          </div>
        </div>
      )}

      {/* results list */}
      {results.length > 0 && (
        <div className="panel">
          <div className="panel-head">
            <span className="panel-title">Results</span>
            <span
              style={{
                fontFamily: "JetBrains Mono, monospace",
                fontSize: 10.5,
                color: "var(--on-mut)",
              }}
            >
              {results.length} found
            </span>
          </div>
          <div className="panel-body flush">
            {results.map((r, i) => (
              <div
                key={r.event_id}
                onClick={() => navigate(`/events/${r.event_id}`)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "14px 20px",
                  borderBottom: i < results.length - 1 ? "1px solid var(--outline)" : undefined,
                  cursor: "pointer",
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>
                    Event {r.event_id.slice(0, 8)}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--on-mut)",
                      fontFamily: "Manrope, sans-serif",
                    }}
                  >
                    {r.reason}
                  </div>
                </div>
                <div
                  style={{
                    flexShrink: 0,
                    marginLeft: 16,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <div
                    style={{
                      fontFamily: "Space Grotesk, sans-serif",
                      fontWeight: 700,
                      fontSize: 18,
                      color: "#16a34a",
                    }}
                  >
                    {Math.round(r.score * 100)}%
                  </div>
                  <MS n="chevron_right" size={18} style={{ color: "var(--on-mut)" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* suggestion cards shown before first search */}
      {!searchMutation.isSuccess && !searchMutation.isPending && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
          {SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => {
                setQ(suggestion);
                searchMutation.mutate(suggestion);
              }}
              style={{
                padding: "14px 16px",
                borderRadius: 12,
                border: "1px solid var(--outline)",
                background: "var(--surface)",
                cursor: "pointer",
                textAlign: "left",
                fontFamily: "Manrope, sans-serif",
                fontSize: 13,
                color: "var(--on-var)",
              }}
            >
              <MS n="lightbulb" size={14} style={{ marginRight: 8, color: "var(--on-mut)" }} />
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
