import { useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AppLayout from "@/shared/layouts/AppLayout";
import { PH, MS, useToast } from "@/shared/components/v8";
import communityApi from "../api/community.api";
import intelligenceApi from "@/features/intelligence/api/intelligence.api";
import { useAuthStore } from "@/shared/store/auth.store";
import type { CommunityPost, PostComment } from "../api/community.api";

function slugify(t: string): string {
  return t
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function timeAgo(d: Date): string {
  const diff = Date.now() - d.getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days}d`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function extractHashtags(text: string): string[] {
  return (text.match(/#[a-zA-Z0-9_]+/g) ?? []).map((h) => h.slice(1).toLowerCase());
}

export default function CommunityPage() {
  const { toast, toastEl } = useToast();
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const isOrg = useLocation().pathname.startsWith("/org");
  const [selected, setSelected] = useState<string | null>(null);
  const [postText, setPostText] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [cName, setCName] = useState("");
  const [cSlug, setCSlug] = useState("");
  const [cDesc, setCDesc] = useState("");
  const [cPrivacy, setCPrivacy] = useState("public");
  const [slugTouched, setSlugTouched] = useState(false);
  const [hashtagFilter, setHashtagFilter] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState("");

  const { data: communities = [], isLoading } = useQuery({
    queryKey: ["communities"],
    queryFn: communityApi.list,
  });
  const { data: posts = [] } = useQuery({
    queryKey: ["community-posts", selected],
    queryFn: () => communityApi.listPosts(selected!),
    enabled: !!selected,
  });
  const { data: hashtags = [] } = useQuery({
    queryKey: ["hashtags"],
    queryFn: communityApi.listHashtags,
  });

  const createMut = useMutation({
    mutationFn: () =>
      communityApi.create({
        name: cName,
        slug: cSlug || slugify(cName),
        description: cDesc,
        privacy: cPrivacy,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["communities"] });
      toast("Community created");
      setShowCreate(false);
      setCName("");
      setCSlug("");
      setCDesc("");
      setCPrivacy("public");
      setSlugTouched(false);
    },
    onError: () => toast("Failed to create community"),
  });

  const joinMut = useMutation({
    mutationFn: (id: string) => communityApi.join(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["communities"] });
      toast("Joined!");
    },
  });

  const postMut = useMutation({
    mutationFn: () => {
      const hasImage = imageUrl.trim().length > 0;
      return communityApi.createPost(selected!, {
        content: postText,
        post_type: hasImage ? "image" : "text",
        media_urls: hasImage ? [imageUrl.trim()] : [],
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["community-posts", selected] });
      qc.invalidateQueries({ queryKey: ["hashtags"] });
      setPostText("");
      setImageUrl("");
      toast("Posted!");
    },
    onError: () => toast("Failed to post"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => communityApi.deletePost(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["community-posts", selected] });
      toast("Deleted");
    },
  });

  async function handlePost() {
    if (!postText.trim() || postMut.isPending) return;
    try {
      const mod = await intelligenceApi.moderateContent(postText);
      if (mod.flagged) {
        toast(`Blocked: ${mod.categories.join(", ") || "policy violation"}`);
        return;
      }
    } catch {
      // moderation service unavailable - allow post through with warning
      console.warn("Content moderation unavailable, posting without check");
    }
    postMut.mutate();
  }

  const active = communities.find((c) => c.id === selected);
  const userName = user
    ? `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() || "You"
    : "You";
  const filteredPosts = hashtagFilter
    ? posts.filter((p) => extractHashtags(p.content).includes(hashtagFilter))
    : posts;

  return (
    <AppLayout variant={isOrg ? "org" : "user"}>
      {toastEl}
      <PH
        crumbs={isOrg ? ["Engage", "Community"] : ["Connect", "Communities"]}
        title="Communities"
        sub={
          isOrg
            ? "Manage your organization's community hub."
            : "Join communities and connect with attendees and organizers."
        }
        actions={
          isOrg ? (
            <button
              onClick={() => setShowCreate(true)}
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
              <MS n="add" size={14} /> New community
            </button>
          ) : undefined
        }
      />

      <div style={{ display: "flex", gap: 20, minHeight: 600 }}>
        {/* left: community list */}
        <div style={{ width: 280, flexShrink: 0 }}>
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--outline)",
              borderRadius: 16,
              overflow: "hidden",
              position: "sticky",
              top: 100,
            }}
          >
            <div
              style={{
                padding: "14px 16px",
                borderBottom: "1px solid var(--outline)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span
                style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: 15 }}
              >
                Communities
              </span>
              <span
                style={{
                  fontFamily: "JetBrains Mono, monospace",
                  fontSize: 10,
                  color: "var(--on-mut)",
                  fontWeight: 700,
                }}
              >
                {communities.length}
              </span>
            </div>
            <div style={{ maxHeight: 400, overflowY: "auto" }}>
              {isLoading ? (
                <div
                  style={{ padding: 32, textAlign: "center", color: "var(--on-mut)", fontSize: 13 }}
                >
                  Loading...
                </div>
              ) : communities.length === 0 ? (
                <div
                  style={{ padding: 32, textAlign: "center", color: "var(--on-mut)", fontSize: 13 }}
                >
                  No communities yet
                </div>
              ) : (
                communities.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setSelected(c.id);
                      setHashtagFilter(null);
                    }}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "12px 16px",
                      border: "none",
                      borderBottom: "1px solid var(--outline)",
                      background: selected === c.id ? "var(--low)" : "transparent",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    <div
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: 12,
                        background:
                          selected === c.id
                            ? "linear-gradient(135deg, #050a26, #1a2a5e)"
                            : "var(--low)",
                        display: "grid",
                        placeItems: "center",
                        flexShrink: 0,
                      }}
                    >
                      <span
                        style={{
                          color: selected === c.id ? "white" : "var(--on-bg)",
                          fontFamily: "Space Grotesk, sans-serif",
                          fontWeight: 800,
                          fontSize: 16,
                        }}
                      >
                        {c.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          fontWeight: 700,
                          fontSize: 13.5,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {c.name}
                      </p>
                      <p style={{ fontSize: 11, color: "var(--on-mut)", marginTop: 1 }}>
                        {c.member_count} members
                      </p>
                    </div>
                    {c.is_member ? (
                      <MS n="check_circle" size={16} style={{ color: "#16a34a", flexShrink: 0 }} />
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          joinMut.mutate(c.id);
                        }}
                        style={{
                          padding: "4px 10px",
                          borderRadius: 6,
                          border: "1px solid var(--primary)",
                          background: "transparent",
                          color: "var(--primary)",
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: "pointer",
                          flexShrink: 0,
                        }}
                      >
                        Join
                      </button>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
          {hashtags.length > 0 && (
            <div
              style={{
                background: "var(--surface)",
                border: "1px solid var(--outline)",
                borderRadius: 16,
                padding: "14px 16px",
                marginTop: 16,
                position: "sticky",
                top: 530,
              }}
            >
              <h3
                style={{
                  fontFamily: "Space Grotesk, sans-serif",
                  fontWeight: 700,
                  fontSize: 14,
                  marginBottom: 10,
                }}
              >
                Trending
              </h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {hashtagFilter && (
                  <button
                    onClick={() => setHashtagFilter(null)}
                    style={{
                      padding: "4px 10px",
                      borderRadius: 20,
                      border: "none",
                      background: "#fee2e2",
                      color: "#991b1b",
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                    }}
                  >
                    <MS n="close" size={11} /> Clear
                  </button>
                )}
                {hashtags.slice(0, 12).map((h) => (
                  <button
                    key={h.id}
                    onClick={() => setHashtagFilter(h.name)}
                    style={{
                      padding: "4px 10px",
                      borderRadius: 20,
                      border: "none",
                      background: hashtagFilter === h.name ? "#050a26" : "var(--low)",
                      color: hashtagFilter === h.name ? "white" : "var(--on-var)",
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    #{h.name} <span style={{ opacity: 0.6, marginLeft: 2 }}>{h.post_count}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* center: feed */}
        <div style={{ flex: 1, minWidth: 0, maxWidth: 580 }}>
          {!selected ? (
            <div
              style={{
                background: "var(--surface)",
                border: "1px solid var(--outline)",
                borderRadius: 16,
                padding: "60px 32px",
                textAlign: "center",
              }}
            >
              <MS
                n="forum"
                size={48}
                style={{ display: "block", margin: "0 auto 16px", opacity: 0.15 }}
              />
              <h2
                style={{
                  fontFamily: "Space Grotesk, sans-serif",
                  fontWeight: 700,
                  fontSize: 22,
                  marginBottom: 8,
                }}
              >
                Select a community
              </h2>
              <p
                style={{ fontSize: 14, color: "var(--on-mut)", fontFamily: "Manrope, sans-serif" }}
              >
                Pick a community from the left to see posts.
              </p>
            </div>
          ) : (
            <>
              <div
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--outline)",
                  borderRadius: 16,
                  padding: "20px 24px",
                  marginBottom: 16,
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                }}
              >
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 14,
                    background: "linear-gradient(135deg, #050a26, #1a2a5e)",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <span
                    style={{
                      color: "white",
                      fontFamily: "Space Grotesk, sans-serif",
                      fontWeight: 800,
                      fontSize: 20,
                    }}
                  >
                    {active?.name?.charAt(0)?.toUpperCase()}
                  </span>
                </div>
                <div style={{ flex: 1 }}>
                  <h2
                    style={{
                      fontFamily: "Space Grotesk, sans-serif",
                      fontWeight: 700,
                      fontSize: 18,
                      margin: 0,
                    }}
                  >
                    {active?.name}
                  </h2>
                  <p style={{ fontSize: 12, color: "var(--on-mut)", marginTop: 2 }}>
                    {active?.member_count ?? 0} members
                    {active?.description ? ` - ${active.description}` : ""}
                  </p>
                </div>
                {hashtagFilter && (
                  <span
                    style={{
                      padding: "4px 12px",
                      borderRadius: 20,
                      background: "#050a26",
                      color: "white",
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    #{hashtagFilter}
                  </span>
                )}
              </div>
              <div
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--outline)",
                  borderRadius: 16,
                  padding: "16px 20px",
                  marginBottom: 16,
                }}
              >
                <div style={{ display: "flex", gap: 12 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #050a26, #3b3a72)",
                      display: "grid",
                      placeItems: "center",
                      flexShrink: 0,
                    }}
                  >
                    <span style={{ color: "white", fontWeight: 700, fontSize: 14 }}>
                      {userName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <textarea
                      value={postText}
                      onChange={(e) => setPostText(e.target.value)}
                      placeholder="What's on your mind?"
                      rows={postText ? 3 : 1}
                      style={{
                        width: "100%",
                        border: "none",
                        outline: "none",
                        resize: "none",
                        fontSize: 14,
                        fontFamily: "Manrope, sans-serif",
                        background: "transparent",
                        lineHeight: 1.6,
                        padding: "8px 0",
                        boxSizing: "border-box",
                      }}
                    />
                    {postText.trim() && (
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
                        <MS n="image" size={16} style={{ color: "var(--on-mut)" }} />
                        <input
                          value={imageUrl}
                          onChange={(e) => setImageUrl(e.target.value)}
                          placeholder="Image URL (optional)"
                          style={{
                            flex: 1,
                            border: "1px solid var(--mid)",
                            borderRadius: 8,
                            padding: "5px 10px",
                            fontSize: 12,
                            fontFamily: "Manrope, sans-serif",
                            background: "var(--low)",
                            outline: "none",
                          }}
                        />
                      </div>
                    )}
                    {imageUrl.trim() && (
                      <div
                        style={{
                          marginTop: 8,
                          borderRadius: 10,
                          overflow: "hidden",
                          border: "1px solid var(--mid)",
                          maxHeight: 160,
                        }}
                      >
                        <img
                          src={imageUrl.trim()}
                          alt="preview"
                          style={{ width: "100%", height: 160, objectFit: "cover" }}
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      </div>
                    )}
                    {postText && extractHashtags(postText).length > 0 && (
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 4 }}>
                        {extractHashtags(postText).map((h) => (
                          <span
                            key={h}
                            style={{
                              padding: "2px 8px",
                              borderRadius: 12,
                              background: "rgba(5,10,38,0.06)",
                              color: "var(--primary)",
                              fontSize: 11,
                              fontWeight: 600,
                            }}
                          >
                            #{h}
                          </span>
                        ))}
                      </div>
                    )}
                    {postText.trim() && (
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "flex-end",
                          marginTop: 8,
                          gap: 8,
                        }}
                      >
                        <button
                          onClick={() => setPostText("")}
                          style={{
                            padding: "6px 14px",
                            borderRadius: 8,
                            border: "1px solid var(--mid)",
                            background: "transparent",
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handlePost}
                          disabled={postMut.isPending}
                          style={{
                            padding: "6px 16px",
                            borderRadius: 8,
                            border: "none",
                            background: "#050a26",
                            color: "white",
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <MS n="send" size={13} /> {postMut.isPending ? "Posting..." : "Post"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {filteredPosts.length === 0 ? (
                <div
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--outline)",
                    borderRadius: 16,
                    padding: "48px 24px",
                    textAlign: "center",
                  }}
                >
                  <MS
                    n="chat_bubble_outline"
                    size={36}
                    style={{ display: "block", margin: "0 auto 12px", opacity: 0.15 }}
                  />
                  <p
                    style={{
                      fontFamily: "Space Grotesk, sans-serif",
                      fontWeight: 600,
                      fontSize: 16,
                      marginBottom: 4,
                    }}
                  >
                    {hashtagFilter ? `No posts with #${hashtagFilter}` : "No posts yet"}
                  </p>
                  <p style={{ fontSize: 13, color: "var(--on-mut)" }}>
                    Be the first to share something.
                  </p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {filteredPosts.map((p) => (
                    <FeedPost
                      key={p.id}
                      post={p}
                      userId={user?.id ?? null}
                      onDelete={(id) => deleteMut.mutate(id)}
                      isDeleting={deleteMut.isPending}
                      onHashtagClick={(h) => setHashtagFilter(h)}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* right: stats */}
        <div style={{ width: 240, flexShrink: 0 }}>
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--outline)",
              borderRadius: 16,
              padding: "16px 18px",
              position: "sticky",
              top: 100,
            }}
          >
            <h3
              style={{
                fontFamily: "Space Grotesk, sans-serif",
                fontWeight: 700,
                fontSize: 14,
                marginBottom: 12,
              }}
            >
              Stats
            </h3>
            {[
              { icon: "groups", label: "Communities", value: communities.length },
              {
                icon: "how_to_reg",
                label: "Joined",
                value: communities.filter((c) => c.is_member).length,
              },
              { icon: "forum", label: "Posts", value: posts.length },
              {
                icon: "people",
                label: "Members",
                value: communities.reduce((s, c) => s + (c.member_count ?? 0), 0),
              },
            ].map((s) => (
              <div
                key={s.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "6px 0",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <MS n={s.icon} size={16} style={{ color: "var(--on-mut)" }} />
                  <span style={{ fontSize: 12.5, color: "var(--on-var)" }}>{s.label}</span>
                </div>
                <span
                  style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: 14 }}
                >
                  {s.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* create modal */}
      {showCreate && (
        <div
          onClick={() => setShowCreate(false)}
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
              maxWidth: 460,
              width: "100%",
              boxShadow: "0 16px 48px rgba(0,0,0,0.15)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "18px 24px 14px",
                borderBottom: "1px solid var(--outline)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 9,
                    background: "rgba(5,10,38,0.06)",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <MS n="groups" size={18} />
                </div>
                <div>
                  <h3
                    style={{
                      fontFamily: "Space Grotesk, sans-serif",
                      fontWeight: 700,
                      fontSize: 16,
                      margin: 0,
                    }}
                  >
                    New community
                  </h3>
                  <p style={{ fontSize: 11, color: "var(--on-mut)", margin: 0, marginTop: 2 }}>
                    Create a space for your group
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCreate(false)}
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
            <div
              style={{
                padding: "20px 24px",
                display: "flex",
                flexDirection: "column",
                gap: 14,
                maxHeight: "60vh",
                overflowY: "auto",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "12px 16px",
                  background: "var(--low)",
                  borderRadius: 12,
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: cName ? "linear-gradient(135deg, #050a26, #1a2a5e)" : "var(--mid)",
                    display: "grid",
                    placeItems: "center",
                    flexShrink: 0,
                  }}
                >
                  <span style={{ color: "white", fontWeight: 800, fontSize: 20 }}>
                    {cName ? cName.charAt(0).toUpperCase() : "?"}
                  </span>
                </div>
                <div>
                  <p
                    style={{
                      fontWeight: 700,
                      fontSize: 15,
                      color: cName ? "var(--on-bg)" : "var(--on-mut)",
                    }}
                  >
                    {cName || "Community name"}
                  </p>
                  <p
                    style={{
                      fontSize: 11,
                      color: "var(--on-mut)",
                      fontFamily: "JetBrains Mono, monospace",
                      marginTop: 2,
                    }}
                  >
                    {cSlug || (cName ? slugify(cName) : "slug")}
                  </p>
                </div>
              </div>
              <FField label="Name" required>
                <input
                  autoFocus
                  value={cName}
                  onChange={(e) => {
                    setCName(e.target.value);
                    if (!slugTouched) setCSlug(slugify(e.target.value));
                  }}
                  placeholder="Tech Kathmandu"
                  style={inputS}
                />
              </FField>
              <FField label="Slug">
                <input
                  value={cSlug || (cName ? slugify(cName) : "")}
                  onChange={(e) => {
                    setSlugTouched(true);
                    setCSlug(slugify(e.target.value));
                  }}
                  placeholder="tech-kathmandu"
                  style={{ ...inputS, fontFamily: "JetBrains Mono, monospace" }}
                />
                <p style={{ fontSize: 11, color: "var(--on-mut)", marginTop: 4 }}>
                  Auto-generated. Edit to customize.
                </p>
              </FField>
              <div>
                <label style={labelS}>Privacy</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {(["public", "private", "secret"] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => setCPrivacy(p)}
                      style={{
                        flex: 1,
                        padding: "10px 0",
                        borderRadius: 10,
                        border:
                          cPrivacy === p ? "2px solid var(--primary)" : "1px solid var(--mid)",
                        background: cPrivacy === p ? "rgba(5,10,38,0.04)" : "transparent",
                        cursor: "pointer",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <MS
                        n={p === "public" ? "public" : p === "private" ? "lock" : "visibility_off"}
                        size={18}
                        style={{ color: cPrivacy === p ? "var(--on-bg)" : "var(--on-mut)" }}
                      />
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: cPrivacy === p ? 700 : 500,
                          textTransform: "capitalize",
                          color: cPrivacy === p ? "var(--on-bg)" : "var(--on-mut)",
                        }}
                      >
                        {p}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              <FField label="Description">
                <textarea
                  rows={3}
                  value={cDesc}
                  onChange={(e) => setCDesc(e.target.value)}
                  placeholder="What's this community about?"
                  style={{ ...inputS, resize: "vertical" as const }}
                />
              </FField>
            </div>
            <div
              style={{
                display: "flex",
                gap: 10,
                justifyContent: "flex-end",
                padding: "14px 24px 18px",
                borderTop: "1px solid var(--outline)",
              }}
            >
              <button
                onClick={() => setShowCreate(false)}
                style={{
                  padding: "8px 18px",
                  borderRadius: 8,
                  border: "1px solid var(--mid)",
                  background: "transparent",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => createMut.mutate()}
                disabled={!cName.trim() || createMut.isPending}
                style={{
                  padding: "8px 20px",
                  borderRadius: 8,
                  border: "none",
                  background: !cName.trim() ? "var(--mid)" : "#050a26",
                  color: !cName.trim() ? "var(--on-mut)" : "white",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: !cName.trim() ? "not-allowed" : "pointer",
                }}
              >
                {createMut.isPending ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

const labelS: React.CSSProperties = {
  display: "block",
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "var(--on-mut)",
  marginBottom: 6,
  fontFamily: "'JetBrains Mono', monospace",
};
const inputS: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: 10,
  border: "1px solid var(--mid)",
  background: "var(--low)",
  fontSize: 14,
  fontFamily: "Manrope, sans-serif",
  boxSizing: "border-box",
  outline: "none",
};

function FField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label style={labelS}>
        {label} {required && <span style={{ color: "#ef4444" }}>*</span>}
      </label>
      {children}
    </div>
  );
}

function FeedPost({
  post,
  userId,
  onDelete,
  isDeleting,
  onHashtagClick,
}: {
  post: CommunityPost;
  userId: string | null;
  onDelete: (id: string) => void;
  isDeleting: boolean;
  onHashtagClick: (h: string) => void;
}) {
  useQueryClient();
  const [liked, setLiked] = useState(post.is_liked ?? false);
  const [likeCount, setLikeCount] = useState(post.like_count ?? 0);
  const [showComments, setShowComments] = useState(false);
  const [_showShare, _setShowShare] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const { toast } = useToast();
  const isOwner = userId && post.author_id === userId;

  const likeMut = useMutation({
    mutationFn: () => (liked ? communityApi.unlikePost(post.id) : communityApi.likePost(post.id)),
    onSuccess: () => {
      setLiked(!liked);
      setLikeCount((c) => (liked ? c - 1 : c + 1));
    },
    onError: (err: unknown) => {
      const code = (err as { response?: { data?: { error?: { code?: string } } } })?.response?.data
        ?.error?.code;
      if (code === "ERR_ALREADY_LIKED") {
        setLiked(true);
      }
    },
  });

  function renderContent(text: string) {
    return text.split(/(#[a-zA-Z0-9_]+)/g).map((part, i) =>
      part.startsWith("#") ? (
        <span
          key={i}
          onClick={() => onHashtagClick(part.slice(1).toLowerCase())}
          style={{ color: "var(--primary)", fontWeight: 600, cursor: "pointer" }}
        >
          {part}
        </span>
      ) : (
        <span key={i}>{part}</span>
      )
    );
  }

  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--outline)",
        borderRadius: 16,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 18px 0",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #050a26, #3b3a72)",
              display: "grid",
              placeItems: "center",
            }}
          >
            <span style={{ color: "white", fontWeight: 700, fontSize: 13 }}>
              {(post.author_name ?? "U").charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p style={{ fontWeight: 700, fontSize: 13 }}>{post.author_name || "User"}</p>
            <p style={{ fontSize: 11, color: "var(--on-mut)" }}>
              {timeAgo(new Date(post.created_at))}
            </p>
          </div>
        </div>
        {isOwner && (
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 4,
                color: "var(--on-mut)",
              }}
            >
              <MS n="more_horiz" size={18} />
            </button>
            {showMenu && (
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: "100%",
                  background: "var(--surface)",
                  border: "1px solid var(--mid)",
                  borderRadius: 10,
                  boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
                  zIndex: 10,
                }}
              >
                <button
                  onClick={() => {
                    onDelete(post.id);
                    setShowMenu(false);
                  }}
                  disabled={isDeleting}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "10px 16px",
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#991b1b",
                    whiteSpace: "nowrap",
                  }}
                >
                  <MS n="delete" size={14} /> Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      <div
        style={{
          padding: "12px 18px 14px",
          fontSize: 14,
          lineHeight: 1.65,
          fontFamily: "Manrope, sans-serif",
        }}
      >
        {renderContent(post.content)}
      </div>
      {post.media_urls && post.media_urls.length > 0 && (
        <div style={{ borderTop: "1px solid var(--outline)" }}>
          {post.media_urls.length === 1 ? (
            <img
              src={post.media_urls[0]}
              alt=""
              style={{ width: "100%", maxHeight: 400, objectFit: "cover" }}
            />
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
              {post.media_urls.slice(0, 4).map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt=""
                  style={{ width: "100%", height: 200, objectFit: "cover" }}
                />
              ))}
            </div>
          )}
        </div>
      )}
      {(likeCount > 0 || post.comment_count > 0) && (
        <div
          style={{
            padding: "6px 18px",
            display: "flex",
            justifyContent: "space-between",
            fontSize: 12,
            color: "var(--on-mut)",
          }}
        >
          <span>{likeCount > 0 ? `${likeCount} like${likeCount > 1 ? "s" : ""}` : ""}</span>
          <span>
            {post.comment_count > 0
              ? `${post.comment_count} comment${post.comment_count > 1 ? "s" : ""}`
              : ""}
          </span>
        </div>
      )}
      <div style={{ display: "flex", borderTop: "1px solid var(--outline)" }}>
        <button
          onClick={() => likeMut.mutate()}
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            padding: "10px 0",
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 600,
            color: liked ? "#e83151" : "var(--on-mut)",
          }}
        >
          <MS
            n={liked ? "favorite" : "favorite_border"}
            size={18}
            style={{ color: liked ? "#e83151" : undefined }}
          />{" "}
          Like
        </button>
        <button
          onClick={() => setShowComments(!showComments)}
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            padding: "10px 0",
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 600,
            color: showComments ? "var(--primary)" : "var(--on-mut)",
          }}
        >
          <MS n="chat_bubble_outline" size={17} /> Comment
        </button>
        <button
          onClick={() => {
            navigator.clipboard.writeText(`${window.location.origin}/community/posts/${post.id}`);
            toast("Link copied!");
          }}
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            padding: "10px 0",
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 600,
            color: "var(--on-mut)",
          }}
        >
          <MS n="share" size={17} /> Share
        </button>
      </div>
      {showComments && <CommentSection postId={post.id} userId={userId} />}
    </div>
  );
}

function CommentSection({ postId, userId: _userId }: { postId: string; userId: string | null }) {
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: comments = [] } = useQuery({
    queryKey: ["comments", postId],
    queryFn: () => communityApi.listComments(postId),
  });

  const commentMut = useMutation({
    mutationFn: () => communityApi.createComment(postId, text, replyTo?.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["comments", postId] });
      qc.invalidateQueries({ queryKey: ["community-posts"] });
      setText("");
      setReplyTo(null);
    },
  });

  return (
    <div style={{ borderTop: "1px solid var(--outline)", padding: "12px 18px" }}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
          marginBottom: comments.length > 0 ? 12 : 0,
        }}
      >
        {comments.map((c) => (
          <CommentItem
            key={c.id}
            comment={c}
            onReply={(id, name) => {
              setReplyTo({ id, name });
              inputRef.current?.focus();
            }}
            depth={0}
          />
        ))}
      </div>
      {replyTo && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginBottom: 6,
            fontSize: 11,
            color: "var(--on-mut)",
          }}
        >
          <MS n="reply" size={13} /> Replying to <strong>{replyTo.name}</strong>
          <button
            onClick={() => setReplyTo(null)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
              color: "var(--on-mut)",
            }}
          >
            <MS n="close" size={12} />
          </button>
        </div>
      )}
      <div style={{ display: "flex", gap: 8 }}>
        <input
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={replyTo ? `Reply to ${replyTo.name}...` : "Write a comment..."}
          onKeyDown={(e) => {
            if (e.key === "Enter" && text.trim()) commentMut.mutate();
          }}
          style={{
            flex: 1,
            padding: "8px 12px",
            borderRadius: 20,
            border: "1px solid var(--mid)",
            background: "var(--low)",
            fontSize: 13,
            fontFamily: "Manrope, sans-serif",
            outline: "none",
          }}
        />
        <button
          onClick={() => text.trim() && commentMut.mutate()}
          disabled={!text.trim() || commentMut.isPending}
          style={{
            width: 34,
            height: 34,
            borderRadius: "50%",
            border: "none",
            background: text.trim() ? "#050a26" : "var(--mid)",
            color: "white",
            cursor: text.trim() ? "pointer" : "not-allowed",
            display: "grid",
            placeItems: "center",
          }}
        >
          <MS n="send" size={15} />
        </button>
      </div>
    </div>
  );
}

function CommentItem({
  comment,
  onReply,
  depth,
}: {
  comment: PostComment;
  onReply: (id: string, name: string) => void;
  depth: number;
}) {
  const [showReplies, setShowReplies] = useState(depth === 0 && (comment.replies?.length ?? 0) > 0);
  return (
    <div style={{ marginLeft: depth > 0 ? 24 : 0 }}>
      <div style={{ display: "flex", gap: 8 }}>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            background: depth > 0 ? "var(--mid)" : "linear-gradient(135deg, #050a26, #3b3a72)",
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
            marginTop: 2,
          }}
        >
          <span style={{ color: "white", fontSize: 10, fontWeight: 700 }}>
            {(comment.author_name ?? "U").charAt(0).toUpperCase()}
          </span>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ background: "var(--low)", borderRadius: 12, padding: "8px 12px" }}>
            <p style={{ fontWeight: 700, fontSize: 12, marginBottom: 2 }}>
              {comment.author_name || "User"}
            </p>
            <p style={{ fontSize: 13, lineHeight: 1.5 }}>{comment.content}</p>
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 4, paddingLeft: 4 }}>
            <span style={{ fontSize: 10.5, color: "var(--on-mut)" }}>
              {timeAgo(new Date(comment.created_at))}
            </span>
            <button
              onClick={() => onReply(comment.id, comment.author_name || "User")}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: 10.5,
                fontWeight: 700,
                color: "var(--on-var)",
                padding: 0,
              }}
            >
              Reply
            </button>
            {comment.reply_count > 0 && !showReplies && (
              <button
                onClick={() => setShowReplies(true)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 10.5,
                  fontWeight: 700,
                  color: "var(--primary)",
                  padding: 0,
                }}
              >
                View {comment.reply_count} {comment.reply_count === 1 ? "reply" : "replies"}
              </button>
            )}
          </div>
        </div>
      </div>
      {showReplies &&
        comment.replies?.map((r) => (
          <div key={r.id} style={{ marginTop: 8 }}>
            <CommentItem comment={r} onReply={onReply} depth={depth + 1} />
          </div>
        ))}
    </div>
  );
}
