import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import client from "@/shared/api/client";
import AppLayout from "@/shared/layouts/AppLayout";

type Org = {
  id: string;
  name: string;
  slug: string;
  description: string;
  contact_email: string;
  website: string;
  logo_url: string;
  status: string;
  is_verified: boolean;
  created_at: string;
};

/** Public profile page for an organisation. Route: /orgs/:id */
export default function OrgProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [org, setOrg] = useState<Org | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await client.get(`/org/api/v1/organisations/${id}/`);
        setOrg(res.data.data);
      } catch {
        toast.error("Could not load organisation.");
      } finally {
        setLoading(false);
      }
    }
    if (id) load();
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

  if (!org) {
    return (
      <AppLayout>
        <div className="text-center py-24" style={{ color: "var(--on-bg)" }}>
          Organisation not found.
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* header */}
        <div
          className="rounded-2xl p-8 mb-8 flex items-center gap-6"
          style={{ background: "var(--surface)", border: "1px solid var(--mid)" }}
        >
          {org.logo_url ? (
            <img
              src={org.logo_url}
              alt={org.name}
              className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
            />
          ) : (
            <div
              className="w-20 h-20 rounded-xl flex items-center justify-center text-2xl font-bold flex-shrink-0"
              style={{ background: "var(--primary)", color: "#fff" }}
            >
              {org.name[0]}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1
                className="text-2xl font-bold"
                style={{ color: "var(--on-bg)", fontFamily: "'Space Grotesk', sans-serif" }}
              >
                {org.name}
              </h1>
              {org.is_verified && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ background: "#dcfce7", color: "#16a34a" }}
                >
                  Verified
                </span>
              )}
            </div>
            <p className="text-sm" style={{ color: "var(--on-bg)", opacity: 0.5 }}>
              @{org.slug}
            </p>
            {org.website && (
              <a
                href={org.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm mt-1 block"
                style={{ color: "var(--secondary)" }}
              >
                {org.website}
              </a>
            )}
          </div>
        </div>

        {/* about */}
        {org.description && (
          <div
            className="rounded-2xl p-6 mb-6"
            style={{ background: "var(--surface)", border: "1px solid var(--mid)" }}
          >
            <h2
              className="text-sm font-semibold uppercase tracking-wider mb-3"
              style={{ color: "var(--on-bg)", opacity: 0.4 }}
            >
              About
            </h2>
            <p style={{ color: "var(--on-bg)", opacity: 0.8, lineHeight: 1.7 }}>
              {org.description}
            </p>
          </div>
        )}

        {/* contact */}
        <div
          className="rounded-2xl p-6"
          style={{ background: "var(--surface)", border: "1px solid var(--mid)" }}
        >
          <h2
            className="text-sm font-semibold uppercase tracking-wider mb-3"
            style={{ color: "var(--on-bg)", opacity: 0.4 }}
          >
            Contact
          </h2>
          <p className="text-sm" style={{ color: "var(--on-bg)" }}>
            {org.contact_email}
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
