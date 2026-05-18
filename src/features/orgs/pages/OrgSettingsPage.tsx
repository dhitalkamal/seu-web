import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import client from "@/shared/api/client";
import AppLayout from "@/shared/layouts/AppLayout";

type OrgFormData = {
  name: string;
  description: string;
  contact_email: string;
  website: string;
};

/** Organisation settings page - update org details. Route: /org/settings */
export default function OrgSettingsPage() {
  const [orgId, setOrgId] = useState<string | null>(null);
  const [form, setForm] = useState<OrgFormData>({
    name: "",
    description: "",
    contact_email: "",
    website: "",
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        // fetch user's orgs - take the first one the user owns
        const res = await client.get("/org/api/v1/organisations/");
        const orgs = res.data.data ?? [];
        if (orgs.length > 0) {
          const org = orgs[0];
          setOrgId(org.id);
          setForm({
            name: org.name ?? "",
            description: org.description ?? "",
            contact_email: org.contact_email ?? "",
            website: org.website ?? "",
          });
        }
      } catch {
        toast.error("Could not load organisation.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleSave() {
    if (!orgId) return;
    setSaving(true);
    try {
      await client.patch(`/org/api/v1/organisations/${orgId}/`, form);
      toast.success("Organisation updated.");
    } catch {
      toast.error("Failed to save changes.");
    } finally {
      setSaving(false);
    }
  }

  const fieldStyle = {
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

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto px-6 py-10">
        <h1
          className="text-2xl font-bold mb-8"
          style={{ color: "var(--on-bg)", fontFamily: "'Space Grotesk', sans-serif" }}
        >
          Organisation Settings
        </h1>

        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div
              className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: "var(--secondary)" }}
            />
          </div>
        ) : !orgId ? (
          <div
            className="rounded-xl p-8 text-center"
            style={{ background: "var(--surface)", border: "1px solid var(--mid)" }}
          >
            <p className="text-sm mb-4" style={{ color: "var(--on-bg)", opacity: 0.6 }}>
              You have no organisation yet.
            </p>
            <a
              href="/org/new"
              className="text-sm font-semibold"
              style={{ color: "var(--secondary)" }}
            >
              Create Organisation
            </a>
          </div>
        ) : (
          <div
            className="rounded-2xl p-8 space-y-6"
            style={{ background: "var(--surface)", border: "1px solid var(--mid)" }}
          >
            {(
              [
                { key: "name", label: "Name", type: "text" },
                { key: "contact_email", label: "Contact Email", type: "email" },
                { key: "website", label: "Website", type: "url" },
              ] as { key: keyof OrgFormData; label: string; type: string }[]
            ).map(({ key, label, type }) => (
              <div key={key}>
                <label
                  className="block text-xs font-semibold uppercase tracking-wider mb-2"
                  style={{ color: "var(--on-bg)", opacity: 0.5 }}
                >
                  {label}
                </label>
                <input
                  type={type}
                  value={form[key]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  style={fieldStyle}
                />
              </div>
            ))}

            <div>
              <label
                className="block text-xs font-semibold uppercase tracking-wider mb-2"
                style={{ color: "var(--on-bg)", opacity: 0.5 }}
              >
                Description
              </label>
              <textarea
                rows={4}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                style={{ ...fieldStyle, resize: "vertical" }}
              />
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full py-3 rounded-xl text-sm font-semibold transition-opacity disabled:opacity-50"
              style={{ background: "var(--secondary)", color: "#fff" }}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
