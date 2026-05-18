import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import client from "@/shared/api/client";
import AppLayout from "@/shared/layouts/AppLayout";

type HealthScore = {
  score: number;
  level: string;
  registration_velocity: number;
  conversion_rate: number;
  revenue_progress: number;
  predicted_attendance: number;
  risk_flags: string[];
  recommendations: string[];
  calculated_at: string;
};

type EventDetail = {
  id: string;
  title: string;
  capacity: number;
  registered_count: number;
  status: string;
};

const LEVEL_COLOR: Record<string, string> = {
  excellent: "#22c55e",
  healthy: "#84cc16",
  moderate: "#f59e0b",
  at_risk: "#f97316",
  critical: "#ef4444",
};

/** Event analytics dashboard with health score, registration progress, and recommendations. */
export default function EventAnalyticsPage() {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [health, setHealth] = useState<HealthScore | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!id) return;
      try {
        const [evRes, healthRes] = await Promise.allSettled([
          client.get(`/event/api/v1/events/${id}/`),
          client.get(`/intelligence/api/v1/events/${id}/health/`),
        ]);
        if (evRes.status === "fulfilled") setEvent(evRes.value.data.data);
        if (healthRes.status === "fulfilled") setHealth(healthRes.value.data.data);
      } catch {
        toast.error("Failed to load analytics.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div
            className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: "var(--secondary)" }}
          />
        </div>
      </AppLayout>
    );
  }

  const fillRate = event ? (event.registered_count / Math.max(event.capacity, 1)) * 100 : 0;
  const levelColor = health ? (LEVEL_COLOR[health.level] ?? "#94a3b8") : "#94a3b8";

  const capacityData = [
    { name: "Registered", value: event?.registered_count ?? 0 },
    {
      name: "Remaining",
      value: Math.max(0, (event?.capacity ?? 0) - (event?.registered_count ?? 0)),
    },
  ];

  const metricsData = health
    ? [
        { name: "Velocity", value: Number(health.registration_velocity) },
        { name: "Conversion", value: Number(health.conversion_rate) },
        { name: "Revenue", value: Number(health.revenue_progress) },
      ]
    : [];

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1
            className="text-2xl font-bold mb-1"
            style={{ color: "var(--on-bg)", fontFamily: "'Space Grotesk', sans-serif" }}
          >
            {event?.title ?? "Event Analytics"}
          </h1>
          <p className="text-sm" style={{ color: "var(--on-bg)", opacity: 0.5 }}>
            Real-time health score and registration analytics
          </p>
        </div>

        {/* health score + fill rate */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {[
            {
              label: "Health Score",
              value: health ? `${health.score}/100` : "N/A",
              sub: health?.level ?? "No data",
              color: levelColor,
            },
            {
              label: "Registered",
              value: event?.registered_count ?? 0,
              sub: `of ${event?.capacity ?? 0} capacity`,
              color: "var(--secondary)",
            },
            {
              label: "Fill Rate",
              value: `${fillRate.toFixed(1)}%`,
              sub: event?.status ?? "",
              color: fillRate > 80 ? "#22c55e" : fillRate > 50 ? "#f59e0b" : "#94a3b8",
            },
          ].map((kpi) => (
            <div
              key={kpi.label}
              className="rounded-xl p-5"
              style={{ background: "var(--surface)", border: "1px solid var(--mid)" }}
            >
              <p
                className="text-xs font-semibold uppercase tracking-wider mb-2"
                style={{ color: "var(--on-bg)", opacity: 0.4 }}
              >
                {kpi.label}
              </p>
              <p className="text-3xl font-bold mb-1" style={{ color: kpi.color }}>
                {kpi.value}
              </p>
              <p className="text-xs capitalize" style={{ color: "var(--on-bg)", opacity: 0.5 }}>
                {kpi.sub}
              </p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* capacity pie */}
          <div
            className="rounded-xl p-6"
            style={{ background: "var(--surface)", border: "1px solid var(--mid)" }}
          >
            <h3
              className="text-sm font-semibold mb-4"
              style={{ color: "var(--on-bg)", opacity: 0.7 }}
            >
              Capacity Usage
            </h3>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={capacityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="value"
                >
                  <Cell fill="var(--secondary)" />
                  <Cell fill="var(--mid)" />
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "var(--surface)",
                    border: "1px solid var(--mid)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* metrics bar */}
          <div
            className="rounded-xl p-6"
            style={{ background: "var(--surface)", border: "1px solid var(--mid)" }}
          >
            <h3
              className="text-sm font-semibold mb-4"
              style={{ color: "var(--on-bg)", opacity: 0.7 }}
            >
              Health Metrics (%)
            </h3>
            {metricsData.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={metricsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--mid)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--on-bg)" }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "var(--on-bg)" }} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--surface)",
                      border: "1px solid var(--mid)",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="value" fill="var(--secondary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div
                className="flex items-center justify-center h-40 text-sm"
                style={{ color: "var(--on-bg)", opacity: 0.4 }}
              >
                No health data yet. Calculate score first.
              </div>
            )}
          </div>
        </div>

        {/* risk flags + recommendations */}
        {health && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div
              className="rounded-xl p-6"
              style={{ background: "var(--surface)", border: "1px solid var(--mid)" }}
            >
              <h3
                className="text-sm font-semibold mb-4"
                style={{ color: "var(--on-bg)", opacity: 0.7 }}
              >
                Risk Flags
              </h3>
              {health.risk_flags.length === 0 ? (
                <p className="text-sm" style={{ color: "#22c55e" }}>
                  No risks identified
                </p>
              ) : (
                <ul className="space-y-2">
                  {health.risk_flags.map((flag, i) => (
                    <li
                      key={i}
                      className="text-sm flex items-start gap-2"
                      style={{ color: "var(--on-bg)", opacity: 0.8 }}
                    >
                      <span style={{ color: "#f97316" }}>!</span>
                      {flag}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div
              className="rounded-xl p-6"
              style={{ background: "var(--surface)", border: "1px solid var(--mid)" }}
            >
              <h3
                className="text-sm font-semibold mb-4"
                style={{ color: "var(--on-bg)", opacity: 0.7 }}
              >
                Recommendations
              </h3>
              {health.recommendations.length === 0 ? (
                <p className="text-sm" style={{ color: "var(--on-bg)", opacity: 0.5 }}>
                  No recommendations
                </p>
              ) : (
                <ul className="space-y-2">
                  {health.recommendations.map((rec, i) => (
                    <li
                      key={i}
                      className="text-sm flex items-start gap-2"
                      style={{ color: "var(--on-bg)", opacity: 0.8 }}
                    >
                      <span style={{ color: "var(--secondary)" }}>+</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
