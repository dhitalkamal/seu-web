import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import client from "@/shared/api/client";
import AppLayout from "@/shared/layouts/AppLayout";

type Role = {
  id: string;
  name: string;
  description: string;
  capacity: number;
  is_active: boolean;
  created_at: string;
};

type Application = {
  id: string;
  user_id: string;
  status: string;
  created_at: string;
  check_in_at: string | null;
  check_out_at: string | null;
  rating: number | null;
  certificate_issued: boolean;
};

/** Volunteer role management page for organizers. Route: /events/:id/volunteers */
export default function VolunteerManagementPage() {
  const { id: eventId } = useParams<{ id: string }>();
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [newRole, setNewRole] = useState({ name: "", description: "", capacity: 5 });
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await client.get("/volunteer/api/v1/volunteers/roles/");
        const all: Role[] = res.data.data ?? [];
        setRoles(eventId ? all : all);
      } catch {
        toast.error("Could not load roles.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [eventId]);

  async function loadApplications(role: Role) {
    setSelectedRole(role);
    try {
      const res = await client.get(`/volunteer/api/v1/volunteers/roles/${role.id}/applications/`);
      setApplications(res.data.data ?? []);
    } catch {
      toast.error("Could not load applications.");
    }
  }

  async function createRole() {
    if (!newRole.name.trim()) return;
    setCreating(true);
    try {
      const res = await client.post("/volunteer/api/v1/volunteers/roles/", {
        ...newRole,
        event_id: eventId,
      });
      setRoles((prev) => [...prev, res.data.data]);
      setNewRole({ name: "", description: "", capacity: 5 });
      setShowForm(false);
      toast.success("Role created.");
    } catch {
      toast.error("Failed to create role.");
    } finally {
      setCreating(false);
    }
  }

  async function updateApplication(appId: string, action: "approve" | "reject") {
    try {
      await client.post(`/volunteer/api/v1/volunteers/applications/${appId}/${action}/`);
      setApplications((prev) =>
        prev.map((a) =>
          a.id === appId ? { ...a, status: action === "approve" ? "approved" : "rejected" } : a
        )
      );
      toast.success(`Application ${action}d.`);
    } catch {
      toast.error(`Failed to ${action} application.`);
    }
  }

  const STATUS_COLOR: Record<string, string> = {
    pending: "#f59e0b",
    approved: "#22c55e",
    rejected: "#ef4444",
    cancelled: "#94a3b8",
  };

  const inputStyle = {
    width: "100%",
    padding: "8px 12px",
    borderRadius: 8,
    border: "1px solid var(--mid)",
    background: "var(--low)",
    color: "var(--on-bg)",
    fontSize: 13,
    outline: "none",
  };

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1
            className="text-2xl font-bold"
            style={{ color: "var(--on-bg)", fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Volunteer Management
          </h1>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="px-4 py-2 rounded-xl text-sm font-semibold"
            style={{ background: "var(--secondary)", color: "#fff" }}
          >
            + New Role
          </button>
        </div>

        {/* create role form */}
        {showForm && (
          <div
            className="rounded-xl p-6 mb-8 space-y-4"
            style={{ background: "var(--surface)", border: "1px solid var(--mid)" }}
          >
            <h3 className="text-sm font-semibold" style={{ color: "var(--on-bg)", opacity: 0.7 }}>
              New Volunteer Role
            </h3>
            <input
              placeholder="Role name"
              value={newRole.name}
              onChange={(e) => setNewRole((r) => ({ ...r, name: e.target.value }))}
              style={inputStyle}
            />
            <input
              placeholder="Description"
              value={newRole.description}
              onChange={(e) => setNewRole((r) => ({ ...r, description: e.target.value }))}
              style={inputStyle}
            />
            <div className="flex items-center gap-3">
              <label className="text-sm" style={{ color: "var(--on-bg)", opacity: 0.6 }}>
                Capacity
              </label>
              <input
                type="number"
                min={1}
                value={newRole.capacity}
                onChange={(e) =>
                  setNewRole((r) => ({ ...r, capacity: parseInt(e.target.value) || 1 }))
                }
                style={{ ...inputStyle, width: 80 }}
              />
            </div>
            <button
              onClick={createRole}
              disabled={creating}
              className="px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
              style={{ background: "var(--secondary)", color: "#fff" }}
            >
              {creating ? "Creating..." : "Create Role"}
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div
              className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: "var(--secondary)" }}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* roles list */}
            <div className="space-y-3">
              <h2
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: "var(--on-bg)", opacity: 0.4 }}
              >
                Roles ({roles.length})
              </h2>
              {roles.length === 0 && (
                <p className="text-sm" style={{ color: "var(--on-bg)", opacity: 0.5 }}>
                  No roles yet.
                </p>
              )}
              {roles.map((role) => (
                <button
                  key={role.id}
                  onClick={() => loadApplications(role)}
                  className="w-full text-left rounded-xl p-4 transition-all"
                  style={{
                    background: selectedRole?.id === role.id ? "var(--low)" : "var(--surface)",
                    border: `1px solid ${selectedRole?.id === role.id ? "var(--secondary)" : "var(--mid)"}`,
                  }}
                >
                  <p className="text-sm font-semibold mb-1" style={{ color: "var(--on-bg)" }}>
                    {role.name}
                  </p>
                  <p className="text-xs" style={{ color: "var(--on-bg)", opacity: 0.5 }}>
                    Capacity: {role.capacity}
                  </p>
                </button>
              ))}
            </div>

            {/* applications */}
            <div className="md:col-span-2">
              {selectedRole ? (
                <>
                  <h2
                    className="text-xs font-semibold uppercase tracking-wider mb-4"
                    style={{ color: "var(--on-bg)", opacity: 0.4 }}
                  >
                    Applications for {selectedRole.name}
                  </h2>
                  {applications.length === 0 ? (
                    <p className="text-sm" style={{ color: "var(--on-bg)", opacity: 0.5 }}>
                      No applications yet.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {applications.map((app) => (
                        <div
                          key={app.id}
                          className="rounded-xl p-4 flex items-center justify-between"
                          style={{
                            background: "var(--surface)",
                            border: "1px solid var(--mid)",
                          }}
                        >
                          <div>
                            <p
                              className="text-sm font-mono"
                              style={{ color: "var(--on-bg)", opacity: 0.7 }}
                            >
                              {app.user_id.slice(0, 8)}...
                            </p>
                            <span
                              className="text-xs font-semibold px-2 py-0.5 rounded-full capitalize"
                              style={{
                                background: `${STATUS_COLOR[app.status] ?? "#94a3b8"}22`,
                                color: STATUS_COLOR[app.status] ?? "#94a3b8",
                              }}
                            >
                              {app.status}
                            </span>
                          </div>
                          {app.status === "pending" && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => updateApplication(app.id, "approve")}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                                style={{ background: "#dcfce7", color: "#16a34a" }}
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => updateApplication(app.id, "reject")}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                                style={{ background: "#fee2e2", color: "#dc2626" }}
                              >
                                Reject
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div
                  className="rounded-xl h-48 flex items-center justify-center"
                  style={{
                    background: "var(--surface)",
                    border: "1px dashed var(--mid)",
                  }}
                >
                  <p className="text-sm" style={{ color: "var(--on-bg)", opacity: 0.4 }}>
                    Select a role to view applications
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
