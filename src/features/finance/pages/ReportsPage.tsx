import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AppLayout from "@/shared/layouts/AppLayout";
import { PH, KPI, MS, useToast } from "@/shared/components/v8";
import intelligenceApi from "@/features/intelligence/api/intelligence.api";
import type {
  ReportFormat,
  ReportJob,
  GenerateReportPayload,
} from "@/features/intelligence/api/intelligence.api";

// * constants

const REPORT_TYPES = [
  { value: "registrations", label: "Registrations" },
  { value: "revenue", label: "Revenue" },
  { value: "volunteers", label: "Volunteers" },
  { value: "attendance", label: "Attendance" },
  { value: "events", label: "Events summary" },
];

const FORMATS: { value: ReportFormat; label: string }[] = [
  { value: "csv", label: "CSV" },
  { value: "pdf", label: "PDF" },
  { value: "excel", label: "Excel" },
  { value: "json", label: "JSON" },
];

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  completed: { bg: "#dcfce7", color: "#166534" },
  failed: { bg: "#fee2e2", color: "#991b1b" },
  running: { bg: "#dbeafe", color: "#1e40af" },
  pending: { bg: "#f3f4f6", color: "var(--on-var)" },
};

// * component

/** Reports and exports - generate CSV/PDF/Excel/JSON reports via the intelligence service. */
export default function ReportsPage() {
  const { toast, toastEl } = useToast();
  const qc = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [reportType, setReportType] = useState("registrations");
  const [format, setFormat] = useState<ReportFormat>("csv");

  // track the most recently submitted job for polling
  const [pollingJobId, setPollingJobId] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // fetch historical report jobs
  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ["report-jobs"],
    queryFn: intelligenceApi.listReportJobs,
  });

  // generate report mutation
  const generateMutation = useMutation({
    mutationFn: (payload: GenerateReportPayload) => intelligenceApi.generateReport(payload),
    onSuccess: (job) => {
      toast(`Report queued: ${job.job_id.slice(0, 8)}`);
      qc.invalidateQueries({ queryKey: ["report-jobs"] });
      setPollingJobId(job.job_id);
      setShowForm(false);
    },
    onError: () => toast("Failed to start report generation"),
  });

  // poll the running job every 3 seconds until completed or failed
  useEffect(() => {
    if (!pollingJobId) return;

    pollRef.current = setInterval(async () => {
      try {
        const updated = await intelligenceApi.pollReportJob(pollingJobId);
        if (updated.status === "completed" || updated.status === "failed") {
          clearInterval(pollRef.current!);
          setPollingJobId(null);
          qc.invalidateQueries({ queryKey: ["report-jobs"] });
          if (updated.status === "completed") {
            toast("Report ready for download");
          } else {
            toast(`Report failed: ${updated.error ?? "unknown error"}`);
          }
        }
      } catch {
        clearInterval(pollRef.current!);
        setPollingJobId(null);
      }
    }, 3000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [pollingJobId, qc, toast]);

  /** Submit the generate-report form. */
  function handleGenerate() {
    generateMutation.mutate({ report_type: reportType, format });
  }

  const completedCount = jobs.filter((j: ReportJob) => j.status === "completed").length;
  const pendingCount = jobs.filter(
    (j: ReportJob) => j.status === "pending" || j.status === "running"
  ).length;

  return (
    <AppLayout variant="org">
      {toastEl}
      <PH
        crumbs={["Numbers", "Reports"]}
        title="Reports and exports"
        sub="Generate CSV, PDF, JSON, and Excel reports across the workspace."
        actions={
          <button className="btn-sm primary" onClick={() => setShowForm(true)}>
            <MS n="add" size={13} />
            Generate report
          </button>
        }
      />

      <div className="kpi-grid">
        <KPI
          icon="description"
          color="lav"
          label="Report types"
          value={String(REPORT_TYPES.length)}
        />
        <KPI
          icon="download"
          color="pch"
          label="Generated (all time)"
          value={String(completedCount)}
        />
        <KPI icon="schedule_send" color="mnt" label="In progress" value={String(pendingCount)} />
        <KPI icon="storage" color="crl" label="Archive size" value="N/A" />
      </div>

      {/* generate report form */}
      {showForm && (
        <div className="panel" style={{ marginBottom: 18, borderColor: "var(--primary)" }}>
          <div className="panel-head">
            <span className="panel-title">Generate report</span>
            <button className="modal-x" onClick={() => setShowForm(false)}>
              <MS n="close" size={14} />
            </button>
          </div>
          <div className="panel-body">
            <div
              style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}
            >
              <div className="field">
                <label className="field-lab">Report type</label>
                <select
                  className="field-in"
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                >
                  {REPORT_TYPES.map((rt) => (
                    <option key={rt.value} value={rt.value}>
                      {rt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label className="field-lab">Format</label>
                <select
                  className="field-in"
                  value={format}
                  onChange={(e) => setFormat(e.target.value as ReportFormat)}
                >
                  {FORMATS.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button className="btn-sm" onClick={() => setShowForm(false)}>
                Cancel
              </button>
              <button
                className="btn-sm primary"
                onClick={handleGenerate}
                disabled={generateMutation.isPending}
              >
                <MS n="play_arrow" size={13} />
                {generateMutation.isPending ? "Queuing..." : "Generate"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* report history */}
      <div className="panel">
        <div className="panel-head">
          <span className="panel-title">Report history</span>
          {pollingJobId && (
            <span
              style={{
                fontSize: 11,
                color: "#1e40af",
                fontFamily: "Manrope, sans-serif",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span className="pulse" />
              Generating...
            </span>
          )}
        </div>
        <div className="panel-body flush">
          <table className="tbl">
            <thead>
              <tr>
                <th>Job ID</th>
                <th>Type</th>
                <th>Format</th>
                <th>Status</th>
                <th>Created</th>
                <th>Download</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      textAlign: "center",
                      color: "var(--on-mut)",
                      fontSize: 13,
                      padding: "48px 0",
                    }}
                  >
                    Loading...
                  </td>
                </tr>
              )}
              {!isLoading && jobs.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      textAlign: "center",
                      color: "var(--on-mut)",
                      fontSize: 13,
                      padding: "48px 0",
                    }}
                  >
                    No reports generated yet. Use the "Generate report" button above.
                  </td>
                </tr>
              )}
              {jobs.map((job: ReportJob) => {
                const st = STATUS_STYLES[job.status] ?? STATUS_STYLES.pending;
                return (
                  <tr key={job.job_id}>
                    <td style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10.5 }}>
                      {job.job_id.slice(0, 8)}...
                    </td>
                    <td style={{ textTransform: "capitalize" }}>report</td>
                    <td
                      style={{
                        textTransform: "uppercase",
                        fontFamily: "JetBrains Mono, monospace",
                        fontSize: 11,
                      }}
                    >
                      {job.format}
                    </td>
                    <td>
                      <span
                        style={{
                          padding: "2px 8px",
                          borderRadius: 999,
                          fontSize: 10.5,
                          fontWeight: 700,
                          background: st.bg,
                          color: st.color,
                          textTransform: "capitalize",
                        }}
                      >
                        {job.status}
                      </span>
                    </td>
                    <td style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10.5 }}>
                      {new Date(job.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td>
                      {job.download_url ? (
                        <a
                          href={job.download_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            fontSize: 12,
                            color: "var(--primary)",
                            fontFamily: "Manrope, sans-serif",
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            textDecoration: "none",
                          }}
                        >
                          <MS n="download" size={13} />
                          Download
                        </a>
                      ) : (
                        <span
                          style={{
                            fontSize: 12,
                            color: "var(--on-mut)",
                            fontFamily: "Manrope, sans-serif",
                          }}
                        >
                          {job.status === "running" || job.status === "pending"
                            ? "Generating..."
                            : "Unavailable"}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}
