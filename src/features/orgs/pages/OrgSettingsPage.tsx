import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import AppLayout from "@/shared/layouts/AppLayout";
import { MS } from "@/shared/components/v8";
import orgApi from "@/features/orgs/api/org.api";
import { useOrgStore, isOrgActive } from "@/shared/store/org.store";
import { useOrgContext } from "@/features/orgs/hooks/useOrgContext";
import type { OrgType, OrgDocType, OrgDocument } from "@/features/orgs/types/org.types";

// * Types

type Tab = "basic" | "address" | "social" | "documents";

type FormState = {
  name: string;
  contact_email: string;
  phone: string;
  website: string;
  description: string;
  logo_url: string;
  address: string;
  city: string;
  country: string;
  org_type: OrgType;
  facebook_url: string;
  twitter_url: string;
  instagram_url: string;
  linkedin_url: string;
};

type TabDef = { key: Tab; icon: string; label: string; desc: string };

const TABS: TabDef[] = [
  { key: "basic", icon: "domain", label: "Basic Info", desc: "Name, email, and identity" },
  {
    key: "address",
    icon: "location_on",
    label: "Address & Details",
    desc: "Location and org type",
  },
  { key: "social", icon: "share", label: "Social Links", desc: "Social media profiles" },
  { key: "documents", icon: "folder_open", label: "Documents", desc: "Verification documents" },
];

const ORG_TYPES: { value: OrgType; label: string }[] = [
  { value: "company", label: "Company" },
  { value: "ngo", label: "NGO / Non-profit" },
  { value: "community", label: "Community" },
  { value: "educational", label: "Educational" },
  { value: "government", label: "Government" },
  { value: "individual", label: "Individual" },
];

const DOC_TYPES: { value: OrgDocType; label: string }[] = [
  { value: "registration_cert", label: "Registration Certificate" },
  { value: "pan_card", label: "PAN Card" },
  { value: "tax_clearance", label: "Tax Clearance" },
  { value: "logo", label: "Organisation Logo" },
  { value: "other", label: "Other" },
];

// * Shared Styles

const fieldStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: 10,
  border: "1px solid var(--mid)",
  background: "var(--low)",
  color: "var(--on-bg)",
  fontSize: 14,
  outline: "none",
  fontFamily: "'Manrope', sans-serif",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: "0.1em",
  textTransform: "uppercase" as const,
  color: "var(--on-mut)",
  marginBottom: 6,
  fontFamily: "'JetBrains Mono', monospace",
};

// * Main Component

/** Edit org details - vertical tabs matching the create page, plus doc management. */
export default function OrgSettingsPage() {
  const navigate = useNavigate();
  useOrgContext();
  const org = useOrgStore((s) => s.org);
  const setOrg = useOrgStore((s) => s.setOrg);

  const [tab, setTab] = useState<Tab>("basic");
  const [form, setForm] = useState<FormState>({
    name: "",
    contact_email: "",
    phone: "",
    website: "",
    description: "",
    logo_url: "",
    address: "",
    city: "",
    country: "",
    org_type: "company",
    facebook_url: "",
    twitter_url: "",
    instagram_url: "",
    linkedin_url: "",
  });
  const [docs, setDocs] = useState<OrgDocument[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // * Populate form from org store once available
  useEffect(() => {
    if (!org) {
      setLoading(false);
      return;
    }
    setForm({
      name: org.name ?? "",
      contact_email: org.contact_email ?? "",
      phone: org.phone ?? "",
      website: org.website ?? "",
      description: org.description ?? "",
      logo_url: org.logo_url ?? "",
      address: org.address ?? "",
      city: org.city ?? "",
      country: org.country ?? "",
      org_type: org.org_type ?? "company",
      facebook_url: org.facebook_url ?? "",
      twitter_url: org.twitter_url ?? "",
      instagram_url: org.instagram_url ?? "",
      linkedin_url: org.linkedin_url ?? "",
    });
    // fetch existing docs
    orgApi
      .listDocuments(org.id)
      .then(setDocs)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [org]);

  /** Generic field setter. */
  function set(key: keyof FormState, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  /** Save current form state to the backend. */
  async function handleSave() {
    if (!org) return;
    setSaving(true);
    try {
      const updated = await orgApi.update(org.id, {
        name: form.name.trim(),
        contact_email: form.contact_email.trim(),
        phone: form.phone.trim(),
        website: form.website.trim(),
        description: form.description.trim(),
        logo_url: form.logo_url.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        country: form.country.trim(),
        org_type: form.org_type,
        facebook_url: form.facebook_url.trim(),
        twitter_url: form.twitter_url.trim(),
        instagram_url: form.instagram_url.trim(),
        linkedin_url: form.linkedin_url.trim(),
      });
      setOrg(updated);
      toast.success("Organisation updated.");
    } catch {
      toast.error("Failed to save changes.");
    } finally {
      setSaving(false);
    }
  }

  /** Delete a document from the backend. */
  async function handleDeleteDoc(docId: string) {
    if (!org) return;
    try {
      await orgApi.deleteDocument(org.id, docId);
      setDocs((prev) => prev.filter((d) => d.id !== docId));
      toast.success("Document removed.");
    } catch {
      toast.error("Failed to delete document.");
    }
  }

  // * No org - show create prompt
  if (!loading && !org) {
    return (
      <AppLayout>
        <div style={{ maxWidth: 480, margin: "60px auto", textAlign: "center" }}>
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: 15,
              background: "var(--low)",
              display: "grid",
              placeItems: "center",
              margin: "0 auto 18px",
            }}
          >
            <MS n="domain_add" size={30} style={{ color: "var(--on-mut)" }} />
          </div>
          <p
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 700,
              fontSize: 18,
              color: "var(--on-bg)",
              marginBottom: 8,
            }}
          >
            No organisation yet
          </p>
          <p
            style={{
              fontSize: 13.5,
              color: "var(--on-var)",
              fontFamily: "Manrope, sans-serif",
              lineHeight: 1.55,
              marginBottom: 24,
            }}
          >
            Create an organisation to access these settings.
          </p>
          <button
            onClick={() => navigate("/org/new")}
            style={{
              padding: "10px 24px",
              borderRadius: 10,
              border: "none",
              background: "var(--primary)",
              color: "#fff",
              fontSize: 13.5,
              fontWeight: 700,
              fontFamily: "Manrope, sans-serif",
              cursor: "pointer",
            }}
          >
            Create Organisation
          </button>
        </div>
      </AppLayout>
    );
  }

  const tabIdx = TABS.findIndex((t) => t.key === tab);

  return (
    <AppLayout variant={isOrgActive(org) ? "org" : "user"}>
      {/* page header */}
      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10.5,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--on-mut)",
            marginBottom: 10,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span
            style={{ cursor: "pointer" }}
            onClick={() => navigate(isOrgActive(org) ? "/dashboard" : "/profile")}
          >
            Dashboard
          </span>
          <span style={{ opacity: 0.4 }}>/</span>
          <span style={{ color: "var(--secondary)" }}>Organisation Settings</span>
        </div>
        <h1
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 600,
            fontSize: 28,
            letterSpacing: "-0.035em",
            lineHeight: 1.1,
            color: "var(--on-bg)",
            marginBottom: 6,
          }}
        >
          Organisation Settings
        </h1>
        <p
          style={{
            fontSize: 14,
            color: "var(--on-var)",
            fontFamily: "Manrope, sans-serif",
            maxWidth: "60ch",
            lineHeight: 1.5,
          }}
        >
          Update your organisation details. Changes are saved per section.
        </p>
      </div>

      {loading ? (
        <div
          style={{
            padding: "48px 0",
            textAlign: "center",
            color: "var(--on-mut)",
            fontFamily: "Manrope, sans-serif",
          }}
        >
          Loading...
        </div>
      ) : (
        <div style={{ display: "flex", gap: 24, minHeight: 480 }}>
          {/* vertical tab sidebar */}
          <div
            style={{
              width: 240,
              flexShrink: 0,
              background: "var(--surface)",
              border: "1px solid var(--mid)",
              borderRadius: 16,
              padding: 10,
              display: "flex",
              flexDirection: "column",
              gap: 4,
              alignSelf: "flex-start",
              position: "sticky",
              top: 80,
            }}
          >
            {TABS.map((t) => {
              const active = tab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 14px",
                    borderRadius: 10,
                    border: "none",
                    background: active ? "#050a26" : "transparent",
                    cursor: "pointer",
                    textAlign: "left",
                    width: "100%",
                    transition: "all 120ms",
                  }}
                >
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 9,
                      background: active ? "rgba(255,255,255,0.1)" : "var(--low)",
                      display: "grid",
                      placeItems: "center",
                      flexShrink: 0,
                    }}
                  >
                    <MS
                      n={t.icon}
                      size={17}
                      style={{ color: active ? "var(--tertiary)" : "var(--on-mut)" }}
                    />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        fontSize: 13,
                        fontWeight: active ? 700 : 500,
                        color: active ? "white" : "var(--on-bg)",
                        fontFamily: "Manrope, sans-serif",
                        lineHeight: 1.2,
                        marginBottom: 2,
                      }}
                    >
                      {t.label}
                    </p>
                    <p
                      style={{
                        fontSize: 10.5,
                        color: active ? "rgba(255,255,255,0.5)" : "var(--on-mut)",
                        fontFamily: "Manrope, sans-serif",
                        lineHeight: 1.25,
                      }}
                    >
                      {t.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* content area */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                background: "var(--surface)",
                border: "1px solid var(--mid)",
                borderRadius: 16,
                padding: 28,
              }}
            >
              {/* tab title */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: "var(--low)",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <MS n={TABS[tabIdx].icon} size={20} style={{ color: "var(--on-mut)" }} />
                </div>
                <div>
                  <h2
                    style={{
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontWeight: 700,
                      fontSize: 18,
                      letterSpacing: "-0.02em",
                      color: "var(--on-bg)",
                      lineHeight: 1.2,
                    }}
                  >
                    {TABS[tabIdx].label}
                  </h2>
                  <p
                    style={{
                      fontSize: 12.5,
                      color: "var(--on-mut)",
                      fontFamily: "Manrope, sans-serif",
                      marginTop: 2,
                    }}
                  >
                    {TABS[tabIdx].desc}
                  </p>
                </div>
              </div>

              {/* tab content */}
              {tab === "basic" && <BasicTab form={form} onChange={set} />}
              {tab === "address" && <AddressTab form={form} onChange={set} />}
              {tab === "social" && <SocialTab form={form} onChange={set} />}
              {tab === "documents" && (
                <DocumentsTab
                  orgId={org!.id}
                  docs={docs}
                  setDocs={setDocs}
                  onDelete={handleDeleteDoc}
                />
              )}
            </div>

            {/* save button - visible for all tabs except documents (which auto-saves) */}
            {tab !== "documents" && (
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16, gap: 10 }}>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  style={{
                    padding: "10px 28px",
                    borderRadius: 10,
                    border: "none",
                    background: "var(--primary)",
                    color: "#fff",
                    fontSize: 13,
                    fontWeight: 700,
                    fontFamily: "Manrope, sans-serif",
                    cursor: saving ? "not-allowed" : "pointer",
                    opacity: saving ? 0.6 : 1,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <MS n={saving ? "hourglass_top" : "check"} size={15} />
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </AppLayout>
  );
}

// * Basic Info Tab

/** Editable name, email, phone, website, description, logo. */
function BasicTab({
  form,
  onChange,
}: {
  form: FormState;
  onChange: (k: keyof FormState, v: string) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div>
          <label style={labelStyle}>Organisation Name</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => onChange("name", e.target.value)}
            style={fieldStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>Contact Email</label>
          <input
            type="email"
            value={form.contact_email}
            onChange={(e) => onChange("contact_email", e.target.value)}
            style={fieldStyle}
          />
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div>
          <label style={labelStyle}>Phone</label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => onChange("phone", e.target.value)}
            placeholder="+977 9800000000"
            style={fieldStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>Website</label>
          <input
            type="url"
            value={form.website}
            onChange={(e) => onChange("website", e.target.value)}
            placeholder="https://"
            style={fieldStyle}
          />
        </div>
      </div>
      <div>
        <label style={labelStyle}>Description</label>
        <textarea
          rows={4}
          value={form.description}
          onChange={(e) => onChange("description", e.target.value)}
          style={{ ...fieldStyle, resize: "vertical" }}
        />
      </div>
      <div>
        <label style={labelStyle}>Logo URL</label>
        <input
          type="url"
          value={form.logo_url}
          onChange={(e) => onChange("logo_url", e.target.value)}
          placeholder="https://example.com/logo.png"
          style={fieldStyle}
        />
      </div>
    </div>
  );
}

// * Address and Details Tab

/** Address, city, country, org type selector. */
function AddressTab({
  form,
  onChange,
}: {
  form: FormState;
  onChange: (k: keyof FormState, v: string) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <label style={labelStyle}>Organisation Type</label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
          {ORG_TYPES.map((t) => {
            const active = form.org_type === t.value;
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => onChange("org_type", t.value)}
                style={{
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: `1.5px solid ${active ? "var(--primary)" : "var(--mid)"}`,
                  background: active ? "rgba(5,10,38,0.04)" : "transparent",
                  color: active ? "var(--on-bg)" : "var(--on-var)",
                  fontSize: 13,
                  fontWeight: active ? 700 : 500,
                  fontFamily: "Manrope, sans-serif",
                  cursor: "pointer",
                  textAlign: "center",
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <label style={labelStyle}>Address</label>
        <textarea
          rows={2}
          value={form.address}
          onChange={(e) => onChange("address", e.target.value)}
          placeholder="Street address, building, floor..."
          style={{ ...fieldStyle, resize: "vertical" }}
        />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div>
          <label style={labelStyle}>City</label>
          <input
            type="text"
            value={form.city}
            onChange={(e) => onChange("city", e.target.value)}
            placeholder="Kathmandu"
            style={fieldStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>Country</label>
          <input
            type="text"
            value={form.country}
            onChange={(e) => onChange("country", e.target.value)}
            placeholder="Nepal"
            style={fieldStyle}
          />
        </div>
      </div>
    </div>
  );
}

// * Social Links Tab

/** Social media profile URLs - all optional. */
function SocialTab({
  form,
  onChange,
}: {
  form: FormState;
  onChange: (k: keyof FormState, v: string) => void;
}) {
  const socials: { key: keyof FormState; label: string; placeholder: string }[] = [
    { key: "facebook_url", label: "Facebook", placeholder: "https://facebook.com/your-org" },
    { key: "twitter_url", label: "Twitter / X", placeholder: "https://x.com/your-org" },
    { key: "instagram_url", label: "Instagram", placeholder: "https://instagram.com/your-org" },
    {
      key: "linkedin_url",
      label: "LinkedIn",
      placeholder: "https://linkedin.com/company/your-org",
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <p
        style={{
          fontSize: 13,
          color: "var(--on-var)",
          fontFamily: "Manrope, sans-serif",
          lineHeight: 1.55,
        }}
      >
        These links appear on your public organisation profile.
      </p>
      {socials.map((s) => (
        <div key={s.key}>
          <label style={labelStyle}>{s.label}</label>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 9,
                background: "var(--low)",
                display: "grid",
                placeItems: "center",
                flexShrink: 0,
              }}
            >
              <MS n="public" size={17} style={{ color: "var(--on-mut)" }} />
            </div>
            <input
              type="url"
              value={form[s.key]}
              onChange={(e) => onChange(s.key, e.target.value)}
              placeholder={s.placeholder}
              style={{ ...fieldStyle, flex: 1 }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// * Documents Tab

type DocsTabProps = {
  orgId: string;
  docs: OrgDocument[];
  setDocs: (fn: (prev: OrgDocument[]) => OrgDocument[]) => void;
  onDelete: (id: string) => void;
};

/** View existing docs, upload new ones, delete old ones. */
function DocumentsTab({ orgId, docs, setDocs, onDelete }: DocsTabProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [selectedType, setSelectedType] = useState<OrgDocType>("registration_cert");
  const [uploading, setUploading] = useState(false);

  /** Upload files to the backend immediately. */
  async function addFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      try {
        const doc = await orgApi.uploadDocument(orgId, {
          doc_type: selectedType,
          file_url: URL.createObjectURL(file),
          file_name: file.name,
          file_size: file.size,
        });
        setDocs((prev) => [...prev, doc]);
      } catch {
        toast.error(`Failed to upload ${file.name}`);
      }
    }
    setUploading(false);
  }

  /** Human-friendly file size. */
  function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1_048_576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1_048_576).toFixed(1)} MB`;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* existing docs */}
      {docs.length > 0 && (
        <div>
          <p style={{ ...labelStyle, marginBottom: 8 }}>Uploaded Documents ({docs.length})</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {docs.map((doc) => (
              <div
                key={doc.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 14px",
                  background: "var(--low)",
                  borderRadius: 10,
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 9,
                    background: "rgba(59,130,246,0.08)",
                    display: "grid",
                    placeItems: "center",
                    flexShrink: 0,
                  }}
                >
                  <MS n="description" size={17} style={{ color: "#3b82f6" }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "var(--on-bg)",
                      fontFamily: "Manrope, sans-serif",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {doc.file_name}
                  </p>
                  <p
                    style={{
                      fontSize: 11,
                      color: "var(--on-mut)",
                      fontFamily: "'JetBrains Mono', monospace",
                      marginTop: 2,
                    }}
                  >
                    {DOC_TYPES.find((dt) => dt.value === doc.doc_type)?.label ?? doc.doc_type} ·{" "}
                    {formatSize(doc.file_size)}
                  </p>
                </div>
                <button
                  onClick={() => onDelete(doc.id)}
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 7,
                    border: "1px solid var(--mid)",
                    background: "transparent",
                    cursor: "pointer",
                    display: "grid",
                    placeItems: "center",
                    flexShrink: 0,
                  }}
                >
                  <MS n="close" size={14} style={{ color: "var(--on-mut)" }} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* upload controls */}
      <div>
        <label style={labelStyle}>Document Type</label>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value as OrgDocType)}
          style={{ ...fieldStyle, appearance: "auto", cursor: "pointer" }}
        >
          {DOC_TYPES.map((dt) => (
            <option key={dt.value} value={dt.value}>
              {dt.label}
            </option>
          ))}
        </select>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          addFiles(e.dataTransfer.files);
        }}
        onClick={() => fileRef.current?.click()}
        style={{
          border: `2px dashed ${dragOver ? "var(--primary)" : "var(--mid)"}`,
          borderRadius: 14,
          padding: "32px 20px",
          textAlign: "center",
          cursor: "pointer",
          background: dragOver ? "rgba(5,10,38,0.03)" : "transparent",
        }}
      >
        <input
          ref={fileRef}
          type="file"
          multiple
          accept=".pdf,.png,.jpg,.jpeg"
          onChange={(e) => addFiles(e.target.files)}
          style={{ display: "none" }}
        />
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: "var(--low)",
            display: "grid",
            placeItems: "center",
            margin: "0 auto 14px",
          }}
        >
          <MS
            n={uploading ? "hourglass_top" : "cloud_upload"}
            size={24}
            style={{ color: "var(--on-mut)" }}
          />
        </div>
        <p
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: "var(--on-bg)",
            fontFamily: "Manrope, sans-serif",
            marginBottom: 4,
          }}
        >
          {uploading ? "Uploading..." : "Drag & drop or click to upload"}
        </p>
        <p style={{ fontSize: 12, color: "var(--on-mut)", fontFamily: "Manrope, sans-serif" }}>
          PDF, PNG, JPG up to 10MB
        </p>
      </div>
    </div>
  );
}
