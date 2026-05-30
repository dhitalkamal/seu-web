import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AppLayout from "@/shared/layouts/AppLayout";
import { PH, MS, useToast } from "@/shared/components/v8";
import taxonomyApi from "../api/taxonomy.api";

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "var(--on-mut)",
  marginBottom: 6,
  fontFamily: "'JetBrains Mono', monospace",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: 10,
  border: "1px solid var(--mid)",
  background: "var(--low)",
  color: "var(--on-bg)",
  fontSize: 14,
  outline: "none",
  fontFamily: "'Manrope', sans-serif",
  boxSizing: "border-box",
};

export default function TaxonomyPage() {
  const [tab, setTab] = useState<"categories" | "tags">("categories");
  const { toast, toastEl } = useToast();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [showModal, setShowModal] = useState(false);

  const { data: categories = [], isLoading: catLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: taxonomyApi.listCategories,
  });
  const { data: tags = [], isLoading: tagLoading } = useQuery({
    queryKey: ["tags"],
    queryFn: taxonomyApi.listTags,
  });

  const createCatMutation = useMutation({
    mutationFn: () => taxonomyApi.createCategory({ name, slug }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      toast("Category created");
      closeModal();
    },
    onError: () => toast("Failed to create category"),
  });

  const createTagMutation = useMutation({
    mutationFn: () => taxonomyApi.createTag({ name, slug }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tags"] });
      toast("Tag created");
      closeModal();
    },
    onError: () => toast("Failed to create tag"),
  });

  const autoSlug = (n: string) =>
    n
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");

  const items = tab === "categories" ? categories : tags;
  const isLoading = tab === "categories" ? catLoading : tagLoading;
  const label = tab === "categories" ? "category" : "tag";
  const isPending = createCatMutation.isPending || createTagMutation.isPending;

  function handleCreate() {
    if (tab === "categories") createCatMutation.mutate();
    else createTagMutation.mutate();
  }

  function closeModal() {
    setShowModal(false);
    setName("");
    setSlug("");
  }

  function handleTabSwitch(t: "categories" | "tags") {
    setTab(t);
  }

  return (
    <AppLayout variant="org">
      {toastEl}
      <PH
        crumbs={["Workspace", "Taxonomy"]}
        title="Categories & tags"
        sub="Organize your events with categories and searchable tags."
      />

      <div className="panel">
        {/* tab bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 20px",
            borderBottom: "1px solid var(--outline)",
          }}
        >
          <div style={{ display: "flex", gap: 0 }}>
            {(["categories", "tags"] as const).map((t) => {
              const active = tab === t;
              const count = t === "categories" ? categories.length : tags.length;
              return (
                <button
                  key={t}
                  onClick={() => handleTabSwitch(t)}
                  style={{
                    padding: "14px 20px",
                    fontSize: 13.5,
                    fontWeight: active ? 700 : 500,
                    color: active ? "var(--on-bg)" : "var(--on-mut)",
                    background: "none",
                    border: "none",
                    borderBottom: active ? "2px solid var(--primary)" : "2px solid transparent",
                    cursor: "pointer",
                    fontFamily: "Manrope, sans-serif",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: -1,
                  }}
                >
                  <MS n={t === "categories" ? "category" : "sell"} size={15} />
                  <span style={{ textTransform: "capitalize" }}>{t}</span>
                  <span
                    style={{
                      fontFamily: "JetBrains Mono, monospace",
                      fontSize: 10,
                      fontWeight: 700,
                      padding: "2px 7px",
                      borderRadius: 20,
                      background: active ? "rgba(5,10,38,0.08)" : "var(--low)",
                      color: active ? "var(--on-bg)" : "var(--on-mut)",
                    }}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setShowModal(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 16px",
              borderRadius: 8,
              border: "none",
              background: "#050a26",
              color: "white",
              fontSize: 12.5,
              fontWeight: 700,
              fontFamily: "Manrope, sans-serif",
              cursor: "pointer",
            }}
          >
            <MS n="add" size={14} />
            New {label}
          </button>
        </div>

        {/* table */}
        <div className="panel-body flush">
          {isLoading ? (
            <div style={{ padding: "40px 0", textAlign: "center", color: "var(--on-mut)" }}>
              Loading {tab}...
            </div>
          ) : items.length === 0 ? (
            <div style={{ padding: "48px 20px", textAlign: "center" }}>
              <MS
                n={tab === "categories" ? "category" : "sell"}
                size={32}
                style={{ display: "block", margin: "0 auto 12px", opacity: 0.2 }}
              />
              <p
                style={{
                  fontFamily: "Space Grotesk, sans-serif",
                  fontWeight: 600,
                  fontSize: 16,
                  marginBottom: 6,
                }}
              >
                No {tab} yet
              </p>
              <p
                style={{
                  fontSize: 13,
                  color: "var(--on-mut)",
                  fontFamily: "Manrope, sans-serif",
                  marginBottom: 16,
                }}
              >
                {tab === "categories"
                  ? "Create categories to group your events by topic."
                  : "Create tags to make your events more searchable."}
              </p>
              <button
                onClick={() => setShowModal(true)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "10px 20px",
                  borderRadius: 10,
                  border: "none",
                  background: "#050a26",
                  color: "white",
                  fontSize: 13,
                  fontWeight: 700,
                  fontFamily: "Manrope, sans-serif",
                  cursor: "pointer",
                }}
              >
                <MS n="add" size={14} />
                Create your first {label}
              </button>
            </div>
          ) : (
            <table className="tbl">
              <thead>
                <tr>
                  <th style={{ width: 40 }}>#</th>
                  <th>Name</th>
                  <th>Slug</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={item.id}>
                    <td
                      style={{
                        fontFamily: "JetBrains Mono, monospace",
                        fontSize: 11,
                        color: "var(--on-mut)",
                      }}
                    >
                      {idx + 1}
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 7,
                            background:
                              tab === "categories" ? "rgba(5,10,38,0.06)" : "rgba(219,161,61,0.08)",
                            display: "grid",
                            placeItems: "center",
                            flexShrink: 0,
                          }}
                        >
                          <MS
                            n={tab === "categories" ? "category" : "sell"}
                            size={14}
                            style={{
                              color: tab === "categories" ? "var(--on-bg)" : "#dba13d",
                            }}
                          />
                        </div>
                        <span style={{ fontWeight: 700 }}>{item.name}</span>
                      </div>
                    </td>
                    <td
                      style={{
                        fontFamily: "JetBrains Mono, monospace",
                        fontSize: 11.5,
                        color: "var(--on-mut)",
                      }}
                    >
                      {item.slug}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* modal overlay */}
      {showModal && (
        <div
          onClick={closeModal}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.35)",
            display: "grid",
            placeItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--surface)",
              borderRadius: 20,
              width: "100%",
              maxWidth: 440,
              boxShadow: "0 16px 48px rgba(0,0,0,0.15)",
              overflow: "hidden",
            }}
          >
            {/* modal header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "20px 24px 16px",
                borderBottom: "1px solid var(--outline)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 9,
                    background:
                      tab === "categories" ? "rgba(5,10,38,0.06)" : "rgba(219,161,61,0.08)",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <MS
                    n={tab === "categories" ? "category" : "sell"}
                    size={18}
                    style={{
                      color: tab === "categories" ? "var(--on-bg)" : "#dba13d",
                    }}
                  />
                </div>
                <div>
                  <h3
                    style={{
                      fontFamily: "Space Grotesk, sans-serif",
                      fontWeight: 700,
                      fontSize: 17,
                      letterSpacing: "-0.02em",
                      margin: 0,
                    }}
                  >
                    New {label}
                  </h3>
                  <p
                    style={{
                      fontSize: 12,
                      color: "var(--on-mut)",
                      fontFamily: "Manrope, sans-serif",
                      margin: 0,
                      marginTop: 2,
                    }}
                  >
                    {tab === "categories"
                      ? "Group your events by topic."
                      : "Make events more discoverable."}
                  </p>
                </div>
              </div>
              <button
                onClick={closeModal}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  border: "1px solid var(--mid)",
                  background: "transparent",
                  cursor: "pointer",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <MS n="close" size={16} style={{ color: "var(--on-mut)" }} />
              </button>
            </div>

            {/* modal body */}
            <div
              style={{
                padding: "20px 24px",
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              <div>
                <label style={labelStyle}>
                  Name <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setSlug(autoSlug(e.target.value));
                  }}
                  placeholder={tab === "categories" ? "e.g. Technology" : "e.g. Networking"}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>
                  Slug <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder={tab === "categories" ? "technology" : "networking"}
                  style={inputStyle}
                />
                <p
                  style={{
                    fontSize: 11,
                    color: "var(--on-mut)",
                    marginTop: 4,
                    fontFamily: "Manrope, sans-serif",
                  }}
                >
                  Auto-generated from name. Edit to customize.
                </p>
              </div>
            </div>

            {/* modal footer */}
            <div
              style={{
                display: "flex",
                gap: 10,
                justifyContent: "flex-end",
                padding: "16px 24px 20px",
                borderTop: "1px solid var(--outline)",
              }}
            >
              <button
                onClick={closeModal}
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
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!name || !slug || isPending}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "10px 24px",
                  borderRadius: 10,
                  border: "none",
                  background: !name || !slug ? "var(--mid)" : "#050a26",
                  color: !name || !slug ? "var(--on-mut)" : "white",
                  fontSize: 13,
                  fontWeight: 700,
                  fontFamily: "Manrope, sans-serif",
                  cursor: !name || !slug ? "not-allowed" : "pointer",
                }}
              >
                <MS n="add" size={14} />
                {isPending ? "Creating..." : `Create ${label}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
