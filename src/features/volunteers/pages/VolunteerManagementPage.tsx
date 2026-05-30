import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AppLayout from "@/shared/layouts/AppLayout";
import { PH, KPI, MS, useToast } from "@/shared/components/v8";
import volunteerRolesApi from "@/features/volunteer-apps/api/volunteer-roles.api";
import type {
  VolunteerRole,
  VolunteerApplication,
  VolunteerShift,
} from "@/features/volunteer-apps/api/volunteer-roles.api";
import { useOrgStore } from "@/shared/store/org.store";

// * types

type CreateRoleForm = {
  title: string;
  description: string;
  slots: string;
};

type CreateShiftForm = {
  title: string;
  start_time: string;
  end_time: string;
  capacity: string;
  location: string;
};

type RateForm = {
  rating: string;
  feedback: string;
};

// * shared modal styles

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.35)",
  display: "grid",
  placeItems: "center",
  zIndex: 1000,
};

const cardStyle: React.CSSProperties = {
  background: "var(--surface)",
  borderRadius: 20,
  maxWidth: 480,
  width: "100%",
  boxShadow: "0 16px 48px rgba(0,0,0,0.15)",
};

const modalHeaderStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "18px 24px 16px",
  borderBottom: "1px solid var(--outline)",
};

const modalBodyStyle: React.CSSProperties = {
  padding: "20px 24px",
  display: "flex",
  flexDirection: "column",
  gap: 16,
};

const modalFooterStyle: React.CSSProperties = {
  display: "flex",
  gap: 10,
  justifyContent: "flex-end",
  padding: "16px 24px 20px",
  borderTop: "1px solid var(--outline)",
};

const labelStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "var(--on-mut)",
  marginBottom: 6,
  fontFamily: "'JetBrains Mono', monospace",
  display: "block",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: 10,
  border: "1px solid var(--mid)",
  background: "var(--low)",
  fontSize: 14,
  fontFamily: "'Manrope', sans-serif",
  boxSizing: "border-box",
};

// required marker
const Req = () => <span style={{ color: "#ef4444" }}>*</span>;

// * component

/** Volunteers pool - volunteer management, shift coverage, and skills matrix. */
export default function VolunteerManagementPage() {
  const { toast, toastEl } = useToast();
  const org = useOrgStore((s) => s.org);
  const orgId = org?.id ?? "";
  const qc = useQueryClient();

  // role modal state
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [form, setForm] = useState<CreateRoleForm>({ title: "", description: "", slots: "1" });

  // which role is expanded to show shifts + applications
  const [expandedRoleId, setExpandedRoleId] = useState<string | null>(null);

  // shift modal state
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [shiftForm, setShiftForm] = useState<CreateShiftForm>({
    title: "",
    start_time: "",
    end_time: "",
    capacity: "1",
    location: "",
  });

  // rating modal state
  const [ratingAppId, setRatingAppId] = useState<string | null>(null);
  const [rateForm, setRateForm] = useState<RateForm>({ rating: "5", feedback: "" });

  // fetch all volunteer roles
  const { data: roles = [], isLoading } = useQuery({
    queryKey: ["org-volunteer-roles"],
    queryFn: () => volunteerRolesApi.listRoles(),
  });

  // fetch shifts for expanded role
  const { data: shifts = [] } = useQuery({
    queryKey: ["org-role-shifts", expandedRoleId],
    queryFn: () => volunteerRolesApi.listShifts(expandedRoleId!),
    enabled: !!expandedRoleId,
  });

  // fetch applications for expanded role
  const { data: applications = [] } = useQuery({
    queryKey: ["org-role-applications", expandedRoleId],
    queryFn: () => volunteerRolesApi.listApplications(expandedRoleId!),
    enabled: !!expandedRoleId,
  });

  // create role mutation
  const createMutation = useMutation({
    mutationFn: (payload: {
      event_id: string;
      title: string;
      description: string;
      slots: number;
    }) => volunteerRolesApi.createRole(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["org-volunteer-roles"] });
      toast("Volunteer role created");
      setShowRoleModal(false);
      setForm({ title: "", description: "", slots: "1" });
    },
    onError: () => toast("Failed to create role"),
  });

  // create shift mutation
  const createShiftMutation = useMutation({
    mutationFn: (data: { roleId: string; payload: CreateShiftForm }) =>
      volunteerRolesApi.createShift(data.roleId, {
        title: data.payload.title,
        start_time: data.payload.start_time,
        end_time: data.payload.end_time,
        capacity: Math.max(1, Number(data.payload.capacity) || 1),
        location: data.payload.location || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["org-role-shifts", expandedRoleId] });
      toast("Shift created");
      setShowShiftModal(false);
      setShiftForm({ title: "", start_time: "", end_time: "", capacity: "1", location: "" });
    },
    onError: () => toast("Failed to create shift"),
  });

  // delete shift mutation
  const deleteShiftMutation = useMutation({
    mutationFn: (shiftId: string) => volunteerRolesApi.deleteShift(shiftId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["org-role-shifts", expandedRoleId] });
      toast("Shift deleted");
    },
    onError: () => toast("Failed to delete shift"),
  });

  // checkin mutation
  const checkinMutation = useMutation({
    mutationFn: (appId: string) => volunteerRolesApi.checkin(appId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["org-role-applications", expandedRoleId] });
      toast("Volunteer checked in");
    },
    onError: () => toast("Check-in failed"),
  });

  // checkout mutation
  const checkoutMutation = useMutation({
    mutationFn: (appId: string) => volunteerRolesApi.checkout(appId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["org-role-applications", expandedRoleId] });
      toast("Volunteer checked out");
    },
    onError: () => toast("Check-out failed"),
  });

  // rate mutation
  const rateMutation = useMutation({
    mutationFn: (data: { appId: string; rating: number; feedback: string }) =>
      volunteerRolesApi.rate(data.appId, { rating: data.rating, feedback: data.feedback }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["org-role-applications", expandedRoleId] });
      toast("Volunteer rated");
      setRatingAppId(null);
      setRateForm({ rating: "5", feedback: "" });
    },
    onError: () => toast("Rating failed"),
  });

  // generate certificate mutation
  const generateCertMutation = useMutation({
    mutationFn: (appId: string) => volunteerRolesApi.generateCertificate(appId),
    onSuccess: () => {
      toast("Certificate generated");
    },
    onError: () => toast("Failed to generate certificate"),
  });

  /**
   * Validate and submit the create-role form.
   * Uses orgId as event_id placeholder when no specific event is selected.
   */
  function handleCreate() {
    if (!form.title.trim() || !form.description.trim()) {
      toast("Title and description are required");
      return;
    }
    if (!orgId) {
      toast("No organization loaded");
      return;
    }
    createMutation.mutate({
      event_id: orgId,
      title: form.title.trim(),
      description: form.description.trim(),
      slots: Math.max(1, Number(form.slots) || 1),
    });
  }

  /** Submit new shift for the currently expanded role. */
  function handleCreateShift() {
    if (!shiftForm.title.trim() || !shiftForm.start_time || !shiftForm.end_time) {
      toast("Title, start and end time are required");
      return;
    }
    if (!expandedRoleId) return;
    createShiftMutation.mutate({ roleId: expandedRoleId, payload: shiftForm });
  }

  /** Submit a rating for a volunteer application. */
  function handleRate() {
    if (!ratingAppId) return;
    const ratingNum = Number(rateForm.rating);
    if (!ratingNum || ratingNum < 1 || ratingNum > 5) {
      toast("Rating must be between 1 and 5");
      return;
    }
    rateMutation.mutate({ appId: ratingAppId, rating: ratingNum, feedback: rateForm.feedback });
  }

  const totalSlots = roles.reduce((s: number, r: VolunteerRole) => s + r.slots, 0);
  const filledSlots = roles.reduce((s: number, r: VolunteerRole) => s + r.filled, 0);
  const fillRate = totalSlots > 0 ? `${Math.round((filledSlots / totalSlots) * 100)}%` : "N/A";

  return (
    <AppLayout variant="org">
      {toastEl}
      <PH
        crumbs={["Operations", "Volunteers"]}
        title="Volunteers pool"
        sub="Volunteers, applications, shift coverage, and skills matrix."
        actions={
          <>
            <button className="btn-sm">
              <MS n="calendar_month" size={13} />
              Schedule
            </button>
            <button className="btn-sm primary" onClick={() => setShowRoleModal(true)}>
              <MS n="person_add" size={13} />
              Add volunteer role
            </button>
          </>
        }
      />

      <div className="kpi-grid">
        <KPI
          icon="volunteer_activism"
          color="lav"
          label="Active roles"
          value={String(roles.length)}
        />
        <KPI icon="group" color="pch" label="Total slots" value={String(totalSlots)} />
        <KPI icon="check_circle" color="mnt" label="Fill rate" value={fillRate} />
        <KPI
          icon="mark_email_unread"
          color="crl"
          label="Filled slots"
          value={String(filledSlots)}
        />
      </div>

      {/* create role modal */}
      {showRoleModal && (
        <div style={overlayStyle} onClick={() => setShowRoleModal(false)}>
          <div style={cardStyle} onClick={(e) => e.stopPropagation()}>
            {/* header */}
            <div style={modalHeaderStyle}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <MS n="badge" size={18} style={{ color: "var(--primary)" }} />
                <div>
                  <p
                    style={{
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontWeight: 700,
                      fontSize: 15,
                      margin: 0,
                    }}
                  >
                    New volunteer role
                  </p>
                  <p
                    style={{
                      fontSize: 11,
                      color: "var(--on-mut)",
                      fontFamily: "'Manrope', sans-serif",
                      margin: 0,
                    }}
                  >
                    Define a role and how many slots are available
                  </p>
                </div>
              </div>
              <button
                className="modal-x"
                onClick={() => {
                  setShowRoleModal(false);
                  setForm({ title: "", description: "", slots: "1" });
                }}
              >
                <MS n="close" size={14} />
              </button>
            </div>

            {/* body */}
            <div style={modalBodyStyle}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                {/* title */}
                <div>
                  <label style={labelStyle}>
                    Title <Req />
                  </label>
                  <input
                    style={inputStyle}
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="e.g. Stage crew"
                  />
                </div>

                {/* slots */}
                <div>
                  <label style={labelStyle}>
                    Slots available <Req />
                  </label>
                  <input
                    style={inputStyle}
                    type="number"
                    min={1}
                    value={form.slots}
                    onChange={(e) => setForm((f) => ({ ...f, slots: e.target.value }))}
                  />
                </div>

                {/* description spans full width */}
                <div style={{ gridColumn: "span 2" }}>
                  <label style={labelStyle}>Description</label>
                  <textarea
                    style={{ ...inputStyle, resize: "vertical" }}
                    rows={3}
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="Describe the role and responsibilities"
                  />
                </div>
              </div>
            </div>

            {/* footer */}
            <div style={modalFooterStyle}>
              <button
                className="btn-sm"
                onClick={() => {
                  setShowRoleModal(false);
                  setForm({ title: "", description: "", slots: "1" });
                }}
              >
                Cancel
              </button>
              <button
                className="btn-sm primary"
                onClick={handleCreate}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? "Creating..." : "Create role"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* rate volunteer modal */}
      {ratingAppId && (
        <div
          style={overlayStyle}
          onClick={() => {
            setRatingAppId(null);
            setRateForm({ rating: "5", feedback: "" });
          }}
        >
          <div style={cardStyle} onClick={(e) => e.stopPropagation()}>
            {/* header */}
            <div style={modalHeaderStyle}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <MS n="star" size={18} style={{ color: "var(--primary)" }} />
                <div>
                  <p
                    style={{
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontWeight: 700,
                      fontSize: 15,
                      margin: 0,
                    }}
                  >
                    Rate volunteer
                  </p>
                  <p
                    style={{
                      fontSize: 11,
                      color: "var(--on-mut)",
                      fontFamily: "'Manrope', sans-serif",
                      margin: 0,
                    }}
                  >
                    Score this volunteer&apos;s performance
                  </p>
                </div>
              </div>
              <button
                className="modal-x"
                onClick={() => {
                  setRatingAppId(null);
                  setRateForm({ rating: "5", feedback: "" });
                }}
              >
                <MS n="close" size={14} />
              </button>
            </div>

            {/* body */}
            <div style={modalBodyStyle}>
              {/* rating */}
              <div>
                <label style={labelStyle}>
                  Rating 1-5 <Req />
                </label>
                <input
                  style={inputStyle}
                  type="number"
                  min={1}
                  max={5}
                  value={rateForm.rating}
                  onChange={(e) => setRateForm((f) => ({ ...f, rating: e.target.value }))}
                />
              </div>

              {/* feedback */}
              <div>
                <label style={labelStyle}>Feedback</label>
                <textarea
                  style={{ ...inputStyle, resize: "vertical" }}
                  rows={3}
                  value={rateForm.feedback}
                  onChange={(e) => setRateForm((f) => ({ ...f, feedback: e.target.value }))}
                  placeholder="Leave a note about this volunteer's performance"
                />
              </div>
            </div>

            {/* footer */}
            <div style={modalFooterStyle}>
              <button
                className="btn-sm"
                onClick={() => {
                  setRatingAppId(null);
                  setRateForm({ rating: "5", feedback: "" });
                }}
              >
                Cancel
              </button>
              <button
                className="btn-sm primary"
                onClick={handleRate}
                disabled={rateMutation.isPending}
              >
                {rateMutation.isPending ? "Submitting..." : "Submit rating"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* create shift modal */}
      {showShiftModal && (
        <div style={overlayStyle} onClick={() => setShowShiftModal(false)}>
          {/* wider card for shift - more fields */}
          <div style={{ ...cardStyle, maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
            {/* header */}
            <div style={modalHeaderStyle}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <MS n="schedule" size={18} style={{ color: "var(--primary)" }} />
                <div>
                  <p
                    style={{
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontWeight: 700,
                      fontSize: 15,
                      margin: 0,
                    }}
                  >
                    New shift
                  </p>
                  <p
                    style={{
                      fontSize: 11,
                      color: "var(--on-mut)",
                      fontFamily: "'Manrope', sans-serif",
                      margin: 0,
                    }}
                  >
                    Add a shift to this volunteer role
                  </p>
                </div>
              </div>
              <button
                className="modal-x"
                onClick={() => {
                  setShowShiftModal(false);
                  setShiftForm({
                    title: "",
                    start_time: "",
                    end_time: "",
                    capacity: "1",
                    location: "",
                  });
                }}
              >
                <MS n="close" size={14} />
              </button>
            </div>

            {/* body */}
            <div style={modalBodyStyle}>
              {/* title row */}
              <div>
                <label style={labelStyle}>
                  Title <Req />
                </label>
                <input
                  style={inputStyle}
                  value={shiftForm.title}
                  onChange={(e) => setShiftForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Morning slot"
                />
              </div>

              {/* start + end in 2-column grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <label style={labelStyle}>
                    Start time <Req />
                  </label>
                  <input
                    style={inputStyle}
                    type="datetime-local"
                    value={shiftForm.start_time}
                    onChange={(e) => setShiftForm((f) => ({ ...f, start_time: e.target.value }))}
                  />
                </div>
                <div>
                  <label style={labelStyle}>
                    End time <Req />
                  </label>
                  <input
                    style={inputStyle}
                    type="datetime-local"
                    value={shiftForm.end_time}
                    onChange={(e) => setShiftForm((f) => ({ ...f, end_time: e.target.value }))}
                  />
                </div>
              </div>

              {/* capacity + location row */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 14 }}>
                <div>
                  <label style={labelStyle}>
                    Capacity <Req />
                  </label>
                  <input
                    style={inputStyle}
                    type="number"
                    min={1}
                    value={shiftForm.capacity}
                    onChange={(e) => setShiftForm((f) => ({ ...f, capacity: e.target.value }))}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Location</label>
                  <input
                    style={inputStyle}
                    value={shiftForm.location}
                    onChange={(e) => setShiftForm((f) => ({ ...f, location: e.target.value }))}
                    placeholder="e.g. Main stage"
                  />
                </div>
              </div>
            </div>

            {/* footer */}
            <div style={modalFooterStyle}>
              <button
                className="btn-sm"
                onClick={() => {
                  setShowShiftModal(false);
                  setShiftForm({
                    title: "",
                    start_time: "",
                    end_time: "",
                    capacity: "1",
                    location: "",
                  });
                }}
              >
                Cancel
              </button>
              <button
                className="btn-sm primary"
                onClick={handleCreateShift}
                disabled={createShiftMutation.isPending}
              >
                {createShiftMutation.isPending ? "Creating..." : "Create shift"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* roles table */}
      <div className="panel">
        <div className="panel-head">
          <span className="panel-title">All volunteer roles</span>
        </div>
        <div className="panel-body flush">
          <table className="tbl">
            <thead>
              <tr>
                <th>Role</th>
                <th>Description</th>
                <th>Slots</th>
                <th>Filled</th>
                <th>Fill rate</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td
                    colSpan={7}
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
              {!isLoading && roles.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    style={{
                      textAlign: "center",
                      color: "var(--on-mut)",
                      fontSize: 13,
                      padding: "48px 0",
                    }}
                  >
                    No volunteer roles yet. Create one above.
                  </td>
                </tr>
              )}
              {roles.map((r: VolunteerRole) => {
                const rate = r.slots > 0 ? Math.round((r.filled / r.slots) * 100) : 0;
                const isExpanded = expandedRoleId === r.id;
                return (
                  <>
                    <tr key={r.id}>
                      <td style={{ fontWeight: 600 }}>{r.title}</td>
                      <td
                        style={{
                          maxWidth: 260,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          color: "var(--on-mut)",
                          fontSize: 12,
                        }}
                      >
                        {r.description}
                      </td>
                      <td>{r.slots}</td>
                      <td>{r.filled}</td>
                      <td>
                        <span
                          style={{
                            padding: "2px 8px",
                            borderRadius: 999,
                            fontSize: 10.5,
                            fontWeight: 700,
                            background: rate >= 80 ? "#dcfce7" : rate >= 40 ? "#dbeafe" : "#fee2e2",
                            color: rate >= 80 ? "#166534" : rate >= 40 ? "#1e40af" : "#991b1b",
                          }}
                        >
                          {rate}%
                        </span>
                      </td>
                      <td
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: 11,
                          color: "var(--on-mut)",
                        }}
                      >
                        {new Date(r.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td>
                        <button
                          className="btn-sm"
                          style={{ fontSize: 11, padding: "4px 10px" }}
                          onClick={() => {
                            setExpandedRoleId(isExpanded ? null : r.id);
                            setShowShiftModal(false);
                          }}
                        >
                          <MS n={isExpanded ? "expand_less" : "expand_more"} size={13} />
                          {isExpanded ? "Collapse" : "Manage"}
                        </button>
                      </td>
                    </tr>

                    {/* expanded: shifts + applications */}
                    {isExpanded && (
                      <tr key={`${r.id}-expanded`}>
                        <td colSpan={7} style={{ padding: 0 }}>
                          <div
                            style={{
                              background: "var(--low)",
                              borderTop: "1px solid var(--outline)",
                              borderBottom: "1px solid var(--outline)",
                              padding: "16px 20px",
                            }}
                          >
                            {/* shifts section */}
                            <div style={{ marginBottom: 20 }}>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  marginBottom: 10,
                                }}
                              >
                                <span
                                  style={{
                                    fontFamily: "'Space Grotesk', sans-serif",
                                    fontWeight: 700,
                                    fontSize: 13,
                                  }}
                                >
                                  Shifts
                                </span>
                                <button
                                  className="btn-sm"
                                  style={{ fontSize: 11, padding: "4px 10px" }}
                                  onClick={() => setShowShiftModal(true)}
                                >
                                  <MS n="add" size={12} />
                                  Add shift
                                </button>
                              </div>

                              {/* shifts list */}
                              {shifts.length === 0 ? (
                                <p
                                  style={{
                                    fontSize: 12,
                                    color: "var(--on-mut)",
                                    fontFamily: "Manrope, sans-serif",
                                  }}
                                >
                                  No shifts yet for this role.
                                </p>
                              ) : (
                                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                  {shifts.map((sh: VolunteerShift) => (
                                    <div
                                      key={sh.id}
                                      style={{
                                        background: "var(--surface)",
                                        border: "1px solid var(--outline)",
                                        borderRadius: 8,
                                        padding: "10px 14px",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 12,
                                      }}
                                    >
                                      <MS
                                        n="schedule"
                                        size={16}
                                        style={{ color: "var(--on-mut)" }}
                                      />
                                      <div style={{ flex: 1, minWidth: 0 }}>
                                        <p
                                          style={{
                                            fontWeight: 600,
                                            fontSize: 13,
                                            fontFamily: "Manrope, sans-serif",
                                          }}
                                        >
                                          {sh.title}
                                        </p>
                                        <p
                                          style={{
                                            fontSize: 11,
                                            color: "var(--on-mut)",
                                            fontFamily: "'JetBrains Mono', monospace",
                                          }}
                                        >
                                          {new Date(sh.start_time).toLocaleString("en-US", {
                                            month: "short",
                                            day: "numeric",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                          })}{" "}
                                          -{" "}
                                          {new Date(sh.end_time).toLocaleTimeString("en-US", {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                          })}
                                          {sh.location ? ` - ${sh.location}` : ""}
                                          {" - "}
                                          {sh.capacity} cap
                                        </p>
                                      </div>
                                      <button
                                        className="btn-sm"
                                        style={{
                                          fontSize: 11,
                                          padding: "4px 8px",
                                          color: "#991b1b",
                                        }}
                                        disabled={deleteShiftMutation.isPending}
                                        onClick={() => deleteShiftMutation.mutate(sh.id)}
                                      >
                                        <MS n="delete" size={12} />
                                        Delete
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* applications section */}
                            <div>
                              <p
                                style={{
                                  fontFamily: "'Space Grotesk', sans-serif",
                                  fontWeight: 700,
                                  fontSize: 13,
                                  marginBottom: 10,
                                }}
                              >
                                Applications
                              </p>
                              {applications.length === 0 ? (
                                <p
                                  style={{
                                    fontSize: 12,
                                    color: "var(--on-mut)",
                                    fontFamily: "Manrope, sans-serif",
                                  }}
                                >
                                  No applications yet.
                                </p>
                              ) : (
                                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                  {applications.map((app: VolunteerApplication) => (
                                    <div
                                      key={app.id}
                                      style={{
                                        background: "var(--surface)",
                                        border: "1px solid var(--outline)",
                                        borderRadius: 8,
                                        padding: "10px 14px",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 12,
                                      }}
                                    >
                                      <MS n="person" size={16} style={{ color: "var(--on-mut)" }} />
                                      <div style={{ flex: 1, minWidth: 0 }}>
                                        <p
                                          style={{
                                            fontSize: 12,
                                            fontFamily: "Manrope, sans-serif",
                                            color: "var(--on-mut)",
                                          }}
                                        >
                                          ID: {app.user_id}
                                        </p>
                                        <span
                                          style={{
                                            display: "inline-block",
                                            padding: "2px 8px",
                                            borderRadius: 999,
                                            fontSize: 10,
                                            fontWeight: 700,
                                            background:
                                              app.status === "approved"
                                                ? "#dcfce7"
                                                : app.status === "completed"
                                                  ? "#dbeafe"
                                                  : app.status === "rejected"
                                                    ? "#fee2e2"
                                                    : "#fef9c3",
                                            color:
                                              app.status === "approved"
                                                ? "#166534"
                                                : app.status === "completed"
                                                  ? "#1e40af"
                                                  : app.status === "rejected"
                                                    ? "#991b1b"
                                                    : "#713f12",
                                          }}
                                        >
                                          {app.status}
                                        </span>
                                        {app.rating != null && (
                                          <span
                                            style={{
                                              marginLeft: 6,
                                              fontSize: 11,
                                              color: "var(--on-mut)",
                                              fontFamily: "Manrope, sans-serif",
                                            }}
                                          >
                                            Rating: {app.rating}/5
                                          </span>
                                        )}
                                      </div>

                                      {/* action buttons for approved applications */}
                                      {app.status === "approved" && (
                                        <div style={{ display: "flex", gap: 6 }}>
                                          {!app.checked_in_at && (
                                            <button
                                              className="btn-sm"
                                              style={{ fontSize: 11, padding: "4px 10px" }}
                                              disabled={checkinMutation.isPending}
                                              onClick={() => checkinMutation.mutate(app.id)}
                                            >
                                              <MS n="login" size={12} />
                                              Check in
                                            </button>
                                          )}
                                          {app.checked_in_at && !app.checked_out_at && (
                                            <button
                                              className="btn-sm"
                                              style={{ fontSize: 11, padding: "4px 10px" }}
                                              disabled={checkoutMutation.isPending}
                                              onClick={() => checkoutMutation.mutate(app.id)}
                                            >
                                              <MS n="logout" size={12} />
                                              Check out
                                            </button>
                                          )}
                                          {app.checked_out_at && app.rating == null && (
                                            <button
                                              className="btn-sm"
                                              style={{ fontSize: 11, padding: "4px 10px" }}
                                              onClick={() => setRatingAppId(app.id)}
                                            >
                                              <MS n="star" size={12} />
                                              Rate
                                            </button>
                                          )}
                                        </div>
                                      )}

                                      {/* generate certificate for completed applications */}
                                      {app.status === "completed" && (
                                        <button
                                          className="btn-sm"
                                          style={{ fontSize: 11, padding: "4px 10px" }}
                                          disabled={generateCertMutation.isPending}
                                          onClick={() => generateCertMutation.mutate(app.id)}
                                        >
                                          <MS n="workspace_premium" size={12} />
                                          Generate certificate
                                        </button>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}
