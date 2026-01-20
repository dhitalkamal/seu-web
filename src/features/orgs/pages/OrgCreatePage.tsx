import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import AppLayout from "@/shared/layouts/AppLayout";
import { MS } from "@/shared/components/v8";
import orgApi from "@/features/orgs/api/org.api";
import { useOrgStore } from "@/shared/store/org.store";
import type { OrgType, OrgDocType } from "@/features/orgs/types/org.types";

// * Helpers

/**
 * Slugifies a name - lowercase, trim, replace spaces/special chars with hyphens.
 *
 * @param name - Raw organisation name
 * @returns URL-safe slug
 */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// *  Types

type Tab = "basic" | "address" | "social" | "documents";

type FormState = {
  name: string;
  slug: string;
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

type DocFile = {
  id: string;
  doc_type: OrgDocType;
  file: File;
  preview_url: string;
};

/** Tab definition for the vertical sidebar. */
type TabDef = {
  key: Tab;
  icon: string;
  label: string;
  desc: string;
};

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

const DOC_TYPES: { value: OrgDocType; label: string; desc: string }[] = [
  {
    value: "registration_cert",
    label: "Registration Certificate",
    desc: "Official company/org registration",
  },
  { value: "pan_card", label: "PAN Card", desc: "Permanent Account Number card" },
  { value: "tax_clearance", label: "Tax Clearance", desc: "Latest tax clearance certificate" },
  { value: "logo", label: "Organisation Logo", desc: "High-res logo (PNG/SVG preferred)" },
  { value: "other", label: "Other", desc: "Any other supporting document" },
];

const INITIAL_FORM: FormState = {
  name: "",
  slug: "",
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
};

// *  Main Component

/** Multi-step org creation page with vertical sidebar tabs and document upload. */
export default function OrgCreatePage() {
  const navigate = useNavigate();
  const setOrg = useOrgStore((s) => s.setOrg);

  const [tab, setTab] = useState<Tab>("basic");
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [slugTouched, setSlugTouched] = useState(false);
  const [docs, setDocs] = useState<DocFile[]>([]);
  const [submitting, setSubmitting] = useState(false);

  /** Keep slug in sync with name until the user manually edits it. */
  function handleNameChange(value: string) {
    setForm((f) => ({
      ...f,
      name: value,
      slug: slugTouched ? f.slug : slugify(value),
    }));
  }

  /** Generic field setter. */
  function set(key: keyof FormState, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  /** Check which tabs have completed their required fields. */
  function isTabComplete(t: Tab): boolean {
    switch (t) {
      case "basic":
        return !!(form.name.trim() && form.slug.trim() && form.contact_email.trim());
      case "address":
        return !!(form.city.trim() && form.country.trim());
      case "social":
        return true; // all optional
      case "documents":
        return docs.length > 0;
      default:
        return false;
    }
  }

  /** Validate everything before submit. */
  function validate(): string | null {
    if (!form.name.trim()) return "Organisation name is required.";
    if (!form.slug.trim()) return "Slug is required.";
    if (!form.contact_email.trim()) return "Contact email is required.";
    return null;
  }

  /** Submit the org to the backend + upload documents. */
  async function handleSubmit() {
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }

    setSubmitting(true);
    try {
      // strip optional URL fields so empty strings never reach URLField validation
      const urlOrUndef = (v: string) => v.trim() || undefined;

      // ! Step 1: create the org
      const org = await orgApi.create({
        name: form.name.trim(),
        slug: form.slug.trim(),
        contact_email: form.contact_email.trim(),
        phone: form.phone.trim(),
        website: urlOrUndef(form.website),
        description: form.description.trim(),
        logo_url: urlOrUndef(form.logo_url),
        address: form.address.trim(),
        city: form.city.trim(),
        country: form.country.trim(),
        org_type: form.org_type,
        facebook_url: urlOrUndef(form.facebook_url),
        twitter_url: urlOrUndef(form.twitter_url),
        instagram_url: urlOrUndef(form.instagram_url),
        linkedin_url: urlOrUndef(form.linkedin_url),
      });

      // ! Step 2: upload documents to MinIO via the management service
      for (const doc of docs) {
        try {
          await orgApi.uploadDocumentFile(org.id, doc.file, doc.doc_type);
        } catch {
          toast.error(`Failed to upload ${doc.file.name}`);
        }
      }

      setOrg(org);
      toast.success("Organisation created! It's pending admin review.");
      navigate("/profile");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message ?? "Failed to create organisation.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  // ! figure out where the user is so the "Next" button knows where to go
  const tabIdx = TABS.findIndex((t) => t.key === tab);
  const isLast = tabIdx === TABS.length - 1;
  const isFirst = tabIdx === 0;

  return (
    <AppLayout variant="user">
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
          <span style={{ cursor: "pointer" }} onClick={() => navigate("/profile")}>
            Settings
          </span>
          <span style={{ opacity: 0.4 }}>/</span>
          <span>Organisation</span>
          <span style={{ opacity: 0.4 }}>/</span>
          <span style={{ color: "var(--secondary)" }}>Create</span>
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
          Create Organisation
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
          Fill in the details below to register your organisation on Sansaar. After submission, our
          team will review and verify your application.
        </p>
      </div>

      {/* info banner */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 12,
          padding: "12px 16px",
          background: "rgba(59, 130, 246, 0.06)",
          border: "1px solid rgba(59, 130, 246, 0.15)",
          borderRadius: 12,
          marginBottom: 24,
        }}
      >
        <MS n="info" size={18} style={{ color: "#3b82f6", flexShrink: 0, marginTop: 1 }} />
        <p
          style={{
            fontSize: 13,
            color: "var(--on-var)",
            fontFamily: "Manrope, sans-serif",
            lineHeight: 1.55,
          }}
        >
          After submission your organisation will be reviewed by our team. You'll get access to the
          organiser dashboard once approved. Adding documents speeds up verification.
        </p>
      </div>

      {/* two-column: vertical tabs + content */}
      <div style={{ display: "flex", gap: 24, minHeight: 520 }}>
        {/* left: vertical tab sidebar */}
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
            const done = isTabComplete(t.key);
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
                    background: active
                      ? "rgba(255,255,255,0.1)"
                      : done
                        ? "rgba(34,197,94,0.08)"
                        : "var(--low)",
                    display: "grid",
                    placeItems: "center",
                    flexShrink: 0,
                  }}
                >
                  <MS
                    n={done && !active ? "check_circle" : t.icon}
                    size={17}
                    style={{
                      color: active ? "var(--tertiary)" : done ? "#22c55e" : "var(--on-mut)",
                    }}
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

          {/* progress indicator */}
          <div
            style={{ marginTop: 12, padding: "12px 14px", borderTop: "1px solid var(--outline)" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--on-mut)",
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                Progress
              </span>
              <span
                style={{
                  fontSize: 10.5,
                  fontWeight: 600,
                  color: "var(--on-var)",
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                {TABS.filter((t) => isTabComplete(t.key)).length}/{TABS.length}
              </span>
            </div>
            <div style={{ height: 4, background: "var(--low)", borderRadius: 2 }}>
              <div
                style={{
                  height: "100%",
                  width: `${(TABS.filter((t) => isTabComplete(t.key)).length / TABS.length) * 100}%`,
                  background: "linear-gradient(90deg, #050a26, #1a2a5e)",
                  borderRadius: 2,
                  transition: "width 300ms",
                }}
              />
            </div>
          </div>
        </div>

        {/* right: content area */}
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
            {tab === "basic" && (
              <BasicTab
                form={form}
                slugTouched={slugTouched}
                onNameChange={handleNameChange}
                onSlugTouch={() => setSlugTouched(true)}
                onChange={set}
              />
            )}
            {tab === "address" && <AddressTab form={form} onChange={set} />}
            {tab === "social" && <SocialTab form={form} onChange={set} />}
            {tab === "documents" && <DocumentsTab docs={docs} onDocsChange={setDocs} />}
          </div>

          {/* navigation buttons - always visible below the card */}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16, gap: 12 }}>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                type="button"
                onClick={() => navigate("/profile")}
                style={{
                  padding: "10px 20px",
                  borderRadius: 10,
                  border: "1px solid var(--mid)",
                  background: "transparent",
                  color: "var(--on-var)",
                  fontSize: 13,
                  fontWeight: 600,
                  fontFamily: "Manrope, sans-serif",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <MS n="close" size={15} />
                Cancel
              </button>
              {!isFirst && (
                <button
                  type="button"
                  onClick={() => setTab(TABS[tabIdx - 1].key)}
                  style={{
                    padding: "10px 20px",
                    borderRadius: 10,
                    border: "1px solid var(--mid)",
                    background: "transparent",
                    color: "var(--on-var)",
                    fontSize: 13,
                    fontWeight: 600,
                    fontFamily: "Manrope, sans-serif",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <MS n="arrow_back" size={15} />
                  Previous
                </button>
              )}
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              {!isLast && (
                <button
                  type="button"
                  onClick={() => setTab(TABS[tabIdx + 1].key)}
                  style={{
                    padding: "10px 24px",
                    borderRadius: 10,
                    border: "none",
                    background: "#050a26",
                    color: "white",
                    fontSize: 13,
                    fontWeight: 700,
                    fontFamily: "Manrope, sans-serif",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  Next
                  <MS n="arrow_forward" size={15} />
                </button>
              )}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                style={{
                  padding: "10px 24px",
                  borderRadius: 10,
                  border: "none",
                  background: "var(--primary)",
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 700,
                  fontFamily: "Manrope, sans-serif",
                  cursor: submitting ? "not-allowed" : "pointer",
                  opacity: submitting ? 0.6 : 1,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <MS n={submitting ? "hourglass_top" : "check"} size={15} />
                {submitting ? "Creating..." : "Submit for Review"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

// *  Shared Styles

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

const hintStyle: React.CSSProperties = {
  fontSize: 11,
  color: "var(--on-mut)",
  marginTop: 4,
  fontFamily: "Manrope, sans-serif",
};

// *  Basic Info Tab

type BasicProps = {
  form: FormState;
  slugTouched: boolean;
  onNameChange: (v: string) => void;
  onSlugTouch: () => void;
  onChange: (k: keyof FormState, v: string) => void;
};

/** Name, slug, contact email, phone, website, description. */
function BasicTab({ form, slugTouched, onNameChange, onSlugTouch, onChange }: BasicProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* name + slug row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div>
          <label style={labelStyle}>Organisation Name *</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Acme Events Co."
            style={fieldStyle}
            maxLength={255}
          />
        </div>
        <div>
          <label style={labelStyle}>Slug *</label>
          <div style={{ position: "relative" }}>
            <span
              style={{
                position: "absolute",
                left: 14,
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: 12,
                color: "var(--on-mut)",
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              /orgs/
            </span>
            <input
              type="text"
              value={form.slug}
              onChange={(e) => {
                onSlugTouch();
                onChange("slug", slugify(e.target.value));
              }}
              placeholder="acme-events"
              style={{ ...fieldStyle, paddingLeft: 62 }}
              maxLength={100}
            />
          </div>
          <p style={hintStyle}>Auto-generated from name. Edit to customise.</p>
        </div>
      </div>

      {/* contact email + phone */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div>
          <label style={labelStyle}>Contact Email *</label>
          <input
            type="email"
            value={form.contact_email}
            onChange={(e) => onChange("contact_email", e.target.value)}
            placeholder="hello@acme-events.com"
            style={fieldStyle}
          />
        </div>
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
      </div>

      {/* website */}
      <div>
        <label style={labelStyle}>Website</label>
        <input
          type="url"
          value={form.website}
          onChange={(e) => onChange("website", e.target.value)}
          placeholder="https://acme-events.com"
          style={fieldStyle}
        />
      </div>

      {/* description */}
      <div>
        <label style={labelStyle}>Description</label>
        <textarea
          rows={4}
          value={form.description}
          onChange={(e) => onChange("description", e.target.value)}
          placeholder="Tell us about your organisation, what kind of events you host, your mission..."
          style={{ ...fieldStyle, resize: "vertical" }}
        />
        <p style={hintStyle}>This will appear on your public organisation profile.</p>
      </div>

      {/* logo URL */}
      <div>
        <label style={labelStyle}>Logo URL</label>
        <input
          type="url"
          value={form.logo_url}
          onChange={(e) => onChange("logo_url", e.target.value)}
          placeholder="https://example.com/logo.png"
          style={fieldStyle}
        />
        <p style={hintStyle}>
          Direct link to your organisation logo. You can also upload it in the Documents tab.
        </p>
      </div>
    </div>
  );
}

// *  Address & Details Tab

type AddressProps = {
  form: FormState;
  onChange: (k: keyof FormState, v: string) => void;
};

/** Address, city, country, org type. */
function AddressTab({ form, onChange }: AddressProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* org type */}
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
                  transition: "all 120ms",
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* address */}
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

      {/* city + country */}
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

// *  Social Links Tab

type SocialProps = {
  form: FormState;
  onChange: (k: keyof FormState, v: string) => void;
};

/** Social media profile links - all optional. */
function SocialTab({ form, onChange }: SocialProps) {
  const socials: { key: keyof FormState; icon: string; label: string; placeholder: string }[] = [
    {
      key: "facebook_url",
      icon: "public",
      label: "Facebook",
      placeholder: "https://facebook.com/your-org",
    },
    {
      key: "twitter_url",
      icon: "public",
      label: "Twitter / X",
      placeholder: "https://x.com/your-org",
    },
    {
      key: "instagram_url",
      icon: "public",
      label: "Instagram",
      placeholder: "https://instagram.com/your-org",
    },
    {
      key: "linkedin_url",
      icon: "public",
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
          marginBottom: 4,
        }}
      >
        These links will be displayed on your public organisation profile. All fields are optional.
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
              <MS n={s.icon} size={17} style={{ color: "var(--on-mut)" }} />
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

// *  Documents Tab

type DocsProps = {
  docs: DocFile[];
  onDocsChange: (docs: DocFile[]) => void;
};

/** Drag-and-drop + file picker for verification documents. */
function DocumentsTab({ docs, onDocsChange }: DocsProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [selectedType, setSelectedType] = useState<OrgDocType>("registration_cert");

  /** Handle file selection from input or drop. */
  function addFiles(files: FileList | null) {
    if (!files) return;
    const newDocs: DocFile[] = Array.from(files).map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      doc_type: selectedType,
      file,
      preview_url: URL.createObjectURL(file),
    }));
    onDocsChange([...docs, ...newDocs]);
  }

  /** Remove a doc from the list. */
  function removeDoc(id: string) {
    const doc = docs.find((d) => d.id === id);
    if (doc) URL.revokeObjectURL(doc.preview_url);
    onDocsChange(docs.filter((d) => d.id !== id));
  }

  /** Human-friendly file size. */
  function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1_048_576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1_048_576).toFixed(1)} MB`;
  }

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
        Upload verification documents to speed up the review process. Accepted formats: PDF, PNG,
        JPG (max 10MB each).
      </p>

      {/* doc type selector */}
      <div>
        <label style={labelStyle}>Document Type</label>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value as OrgDocType)}
          style={{
            ...fieldStyle,
            appearance: "auto",
            cursor: "pointer",
          }}
        >
          {DOC_TYPES.map((dt) => (
            <option key={dt.value} value={dt.value}>
              {dt.label}
            </option>
          ))}
        </select>
      </div>

      {/* drop zone */}
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
          padding: "36px 20px",
          textAlign: "center",
          cursor: "pointer",
          background: dragOver ? "rgba(5,10,38,0.03)" : "transparent",
          transition: "all 150ms",
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
            n="cloud_upload"
            size={24}
            style={{ color: dragOver ? "var(--primary)" : "var(--on-mut)" }}
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
          {dragOver ? "Drop files here" : "Drag & drop files or click to browse"}
        </p>
        <p style={{ fontSize: 12, color: "var(--on-mut)", fontFamily: "Manrope, sans-serif" }}>
          PDF, PNG, JPG up to 10MB
        </p>
      </div>

      {/* uploaded docs list */}
      {docs.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <p style={{ ...labelStyle, marginBottom: 0 }}>Uploaded Documents ({docs.length})</p>
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
                  {doc.file.name}
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
                  {formatSize(doc.file.size)}
                </p>
              </div>
              <button
                onClick={() => removeDoc(doc.id)}
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
      )}

      {/* doc type reference */}
      <div
        style={{
          background: "rgba(245,158,11,0.05)",
          border: "1px solid rgba(245,158,11,0.15)",
          borderRadius: 12,
          padding: "14px 16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <MS n="lightbulb" size={16} style={{ color: "#d97706" }} />
          <p
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "#b45309",
              fontFamily: "Manrope, sans-serif",
            }}
          >
            Recommended documents for faster verification
          </p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {DOC_TYPES.filter((d) => d.value !== "other").map((dt) => (
            <div key={dt.value} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <MS
                n={
                  docs.some((d) => d.doc_type === dt.value)
                    ? "check_circle"
                    : "radio_button_unchecked"
                }
                size={14}
                style={{
                  color: docs.some((d) => d.doc_type === dt.value) ? "#22c55e" : "var(--on-mut)",
                  flexShrink: 0,
                }}
              />
              <p
                style={{ fontSize: 12, color: "var(--on-var)", fontFamily: "Manrope, sans-serif" }}
              >
                <strong>{dt.label}</strong> - {dt.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
