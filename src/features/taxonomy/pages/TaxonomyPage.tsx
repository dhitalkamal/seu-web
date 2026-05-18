import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AppLayout from "@/shared/layouts/AppLayout";
import { PH, MS, useToast } from "@/shared/components/v8";
import taxonomyApi from "../api/taxonomy.api";

export default function TaxonomyPage() {
  const [tab, setTab] = useState<"categories" | "tags">("categories");
  const { toast, toastEl } = useToast();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");

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
      setName("");
      setSlug("");
    },
    onError: () => toast("Failed to create category"),
  });

  const createTagMutation = useMutation({
    mutationFn: () => taxonomyApi.createTag({ name, slug }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tags"] });
      toast("Tag created");
      setName("");
      setSlug("");
    },
    onError: () => toast("Failed to create tag"),
  });

  const autoSlug = (n: string) =>
    n
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");

  return (
    <AppLayout variant="org">
      {toastEl}
      <PH
        crumbs={["Workspace", "Taxonomy"]}
        title="Categories & tags"
        sub="Organise your events with categories and searchable tags."
      />

      <div className="tabs" style={{ marginBottom: 18 }}>
        {(["categories", "tags"] as const).map((t) => (
          <button
            key={t}
            className={`tab-btn${tab === t ? " active" : ""}`}
            onClick={() => setTab(t)}
            style={{ textTransform: "capitalize" }}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="chart-grid-21">
        <div className="panel">
          <div className="panel-head">
            <span className="panel-title">
              {tab === "categories" ? "All categories" : "All tags"}
            </span>
            <span
              style={{
                fontFamily: "JetBrains Mono, monospace",
                fontSize: 10.5,
                color: "var(--on-mut)",
              }}
            >
              {tab === "categories" ? categories.length : tags.length} total
            </span>
          </div>
          <div className="panel-body flush">
            {(tab === "categories" ? catLoading : tagLoading) ? (
              <div style={{ padding: "32px 0", textAlign: "center", color: "var(--on-mut)" }}>
                Loading...
              </div>
            ) : (
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Slug</th>
                  </tr>
                </thead>
                <tbody>
                  {(tab === "categories" ? categories : tags).map((item) => (
                    <tr key={item.id}>
                      <td style={{ fontWeight: 700 }}>{item.name}</td>
                      <td
                        style={{
                          fontFamily: "JetBrains Mono, monospace",
                          fontSize: 11,
                          color: "var(--on-mut)",
                        }}
                      >
                        {item.slug}
                      </td>
                    </tr>
                  ))}
                  {(tab === "categories" ? categories : tags).length === 0 && (
                    <tr>
                      <td
                        colSpan={2}
                        style={{ textAlign: "center", padding: 28, color: "var(--on-mut)" }}
                      >
                        No {tab} yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <span className="panel-title">New {tab === "categories" ? "category" : "tag"}</span>
          </div>
          <div className="panel-body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div className="field">
              <label className="field-lab">Name</label>
              <input
                className="field-in"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setSlug(autoSlug(e.target.value));
                }}
                placeholder="Technology"
              />
            </div>
            <div className="field">
              <label className="field-lab">Slug</label>
              <input
                className="field-in"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="technology"
              />
            </div>
            <button
              className="btn-sm primary"
              onClick={() =>
                tab === "categories" ? createCatMutation.mutate() : createTagMutation.mutate()
              }
              disabled={
                !name || !slug || createCatMutation.isPending || createTagMutation.isPending
              }
              style={{ justifyContent: "center" }}
            >
              <MS n="add" size={13} />
              Create {tab === "categories" ? "category" : "tag"}
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
