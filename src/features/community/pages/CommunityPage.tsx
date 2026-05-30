import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AppLayout from "@/shared/layouts/AppLayout";
import { PH, KPI, MS, useToast } from "@/shared/components/v8";
import communityApi from "../api/community.api";
import intelligenceApi from "@/features/intelligence/api/intelligence.api";
import { useAuthStore } from "@/shared/store/auth.store";
import type { CommunityPost } from "../api/community.api";

/** label style shared across both modals */
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

/** input / textarea / select style shared across both modals */
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

/** full-viewport overlay that closes on backdrop click */
const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.35)",
  display: "grid",
  placeItems: "center",
  zIndex: 1000,
};

/** the white card sitting in the centre of the overlay */
const cardStyle: React.CSSProperties = {
  background: "var(--surface)",
  borderRadius: 20,
  maxWidth: 480,
  width: "100%",
  boxShadow: "0 16px 48px rgba(0,0,0,0.15)",
};

/** Communities page - browse, join, and post in communities. */
export default function CommunityPage() {
  const { toast, toastEl } = useToast();
  const qc = useQueryClient();
  // pull the logged-in user so we can compare against post.author_id below
  const currentUser = useAuthStore((s) => s.user);

  // create-community modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  // create-post modal state
  const [showPostModal, setShowPostModal] = useState(false);
  const [postContent, setPostContent] = useState("");

  const [selected, setSelected] = useState<string | null>(null);

  const { data: communities = [], isLoading } = useQuery({
    queryKey: ["communities"],
    queryFn: communityApi.list,
  });

  const { data: posts = [] } = useQuery({
    queryKey: ["community-posts", selected],
    queryFn: () => communityApi.listPosts(selected!),
    enabled: !!selected,
  });

  /** Create a new community and refresh the list. */
  const createMutation = useMutation({
    mutationFn: () => communityApi.create({ name, description }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["communities"] });
      toast("Community created");
      setShowCreateModal(false);
      setName("");
      setDescription("");
    },
  });

  /** Join a community and refresh the list. */
  const joinMutation = useMutation({
    mutationFn: (id: string) => communityApi.join(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["communities"] });
      toast("Joined community");
    },
  });

  /** Publish a post to the selected community. */
  const postMutation = useMutation({
    mutationFn: () => communityApi.createPost(selected!, postContent),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["community-posts", selected] });
      setPostContent("");
      setShowPostModal(false);
      toast("Post published");
    },
  });

  /** Soft-delete a post and refresh the post list for the active community. */
  const deleteMutation = useMutation({
    mutationFn: (postId: string) => communityApi.deletePost(postId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["community-posts", selected] });
      toast("Post deleted");
    },
  });

  /**
   * Run NLP moderation on the draft post content, then only call
   * postMutation if the content is clean. A flagged result shows a
   * warning toast and aborts - the user can edit and try again.
   */
  async function handlePostSubmit() {
    if (!postContent || postMutation.isPending) return;
    try {
      const result = await intelligenceApi.moderateContent(postContent);
      if (result.flagged) {
        // surface the violated categories so the user knows what to fix
        const cats = result.categories.length ? result.categories.join(", ") : "policy violation";
        toast(`Post blocked: content flagged for ${cats}. Please revise before posting.`);
        return;
      }
    } catch {
      // moderation API unavailable - allow the post through silently
    }
    postMutation.mutate();
  }

  const activeCommunity = communities.find((c) => c.id === selected);

  return (
    <AppLayout variant="user">
      {toastEl}

      {/* create community modal */}
      {showCreateModal && (
        <div style={overlayStyle} onClick={() => setShowCreateModal(false)}>
          <div style={cardStyle} onClick={(e) => e.stopPropagation()}>
            {/* header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "18px 24px 16px",
                borderBottom: "1px solid var(--outline)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <MS n="groups" size={18} />
                <span style={{ fontWeight: 700, fontSize: 15 }}>New community</span>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 4,
                  display: "flex",
                  alignItems: "center",
                  color: "var(--on-mut)",
                }}
              >
                <MS n="close" size={18} />
              </button>
            </div>

            {/* body */}
            <div
              style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}
            >
              <div>
                <label style={labelStyle}>
                  Name <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  style={inputStyle}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tech Kathmandu"
                />
              </div>
              <div>
                <label style={labelStyle}>Description</label>
                <textarea
                  style={inputStyle}
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="About this community..."
                />
              </div>
            </div>

            {/* footer */}
            <div
              style={{
                display: "flex",
                gap: 10,
                justifyContent: "flex-end",
                padding: "16px 24px 20px",
                borderTop: "1px solid var(--outline)",
              }}
            >
              <button className="btn-sm" onClick={() => setShowCreateModal(false)}>
                Cancel
              </button>
              <button
                className="btn-sm primary"
                onClick={() => createMutation.mutate()}
                disabled={!name || createMutation.isPending}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* create post modal */}
      {showPostModal && (
        <div style={overlayStyle} onClick={() => setShowPostModal(false)}>
          <div style={cardStyle} onClick={(e) => e.stopPropagation()}>
            {/* header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "18px 24px 16px",
                borderBottom: "1px solid var(--outline)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <MS n="edit" size={18} />
                <span style={{ fontWeight: 700, fontSize: 15 }}>New post</span>
              </div>
              <button
                onClick={() => setShowPostModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 4,
                  display: "flex",
                  alignItems: "center",
                  color: "var(--on-mut)",
                }}
              >
                <MS n="close" size={18} />
              </button>
            </div>

            {/* body */}
            <div
              style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}
            >
              <div>
                <label style={labelStyle}>
                  Post content <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <textarea
                  style={inputStyle}
                  rows={5}
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  placeholder="Write a post..."
                />
              </div>
            </div>

            {/* footer */}
            <div
              style={{
                display: "flex",
                gap: 10,
                justifyContent: "flex-end",
                padding: "16px 24px 20px",
                borderTop: "1px solid var(--outline)",
              }}
            >
              <button className="btn-sm" onClick={() => setShowPostModal(false)}>
                Cancel
              </button>
              <button
                className="btn-sm primary"
                onClick={handlePostSubmit}
                disabled={!postContent || postMutation.isPending}
              >
                Post
              </button>
            </div>
          </div>
        </div>
      )}

      <PH
        crumbs={["Discover", "Communities"]}
        title="Communities"
        sub="Join communities and connect with attendees and organizers."
        actions={
          <button className="btn-sm primary" onClick={() => setShowCreateModal(true)}>
            <MS n="add" size={13} />
            New community
          </button>
        }
      />

      {/* kpi row */}
      <div className="kpi-grid">
        <KPI icon="groups" color="lav" label="Communities" value={communities.length.toString()} />
        <KPI
          icon="how_to_reg"
          color="mnt"
          label="Joined"
          value={communities.filter((c) => c.is_member).length.toString()}
        />
        <KPI
          icon="people"
          color="pch"
          label="Total members"
          value={communities.reduce((s, c) => s + (c.member_count ?? 0), 0).toLocaleString()}
        />
        <KPI icon="forum" color="nav" label="Posts" value={posts.length.toString()} />
      </div>

      {/* main grid */}
      <div className="chart-grid-21">
        {/* community list */}
        <div className="panel">
          <div className="panel-head">
            <span className="panel-title">All communities</span>
          </div>
          <div className="panel-body" style={{ padding: 0 }}>
            {isLoading ? (
              <div style={{ padding: "40px 0", textAlign: "center", color: "var(--on-mut)" }}>
                Loading...
              </div>
            ) : communities.length === 0 ? (
              <div style={{ padding: "40px 0", textAlign: "center", color: "var(--on-mut)" }}>
                No communities yet.
              </div>
            ) : (
              communities.map((c, i) => (
                <div
                  key={c.id}
                  onClick={() => setSelected(c.id)}
                  style={{
                    padding: "14px 20px",
                    borderBottom:
                      i < communities.length - 1 ? "1px solid var(--outline)" : undefined,
                    cursor: "pointer",
                    background: selected === c.id ? "var(--low)" : undefined,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{c.name}</div>
                      <div style={{ fontSize: 12, color: "var(--on-mut)", marginTop: 2 }}>
                        {c.member_count} members
                      </div>
                    </div>
                    {/* join / joined badge */}
                    {!c.is_member && (
                      <button
                        className="btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          joinMutation.mutate(c.id);
                        }}
                        disabled={joinMutation.isPending}
                        style={{ fontSize: 11 }}
                      >
                        Join
                      </button>
                    )}
                    {c.is_member && (
                      <span className="pill active" style={{ fontSize: 10 }}>
                        Joined
                      </span>
                    )}
                  </div>
                  {c.description && (
                    <div style={{ fontSize: 12, color: "var(--on-var)", marginTop: 4 }}>
                      {c.description}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* posts panel */}
        <div className="panel">
          <div className="panel-head">
            <span className="panel-title">
              {activeCommunity ? activeCommunity.name : "Select a community"}
            </span>
            {/* new post button - only shown once a community is selected */}
            {selected && (
              <button className="btn-sm" onClick={() => setShowPostModal(true)}>
                <MS n="edit" size={13} />
                New post
              </button>
            )}
          </div>
          {!selected ? (
            <div
              className="panel-body"
              style={{ textAlign: "center", color: "var(--on-mut)", padding: "40px 0" }}
            >
              Click a community to view posts.
            </div>
          ) : (
            <div
              className="panel-body"
              style={{ display: "flex", flexDirection: "column", gap: 14 }}
            >
              {/* post list */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                {posts.length === 0 && (
                  <div style={{ fontSize: 13, color: "var(--on-mut)" }}>No posts yet.</div>
                )}
                {posts.map((p) => (
                  <PostCard
                    key={p.id}
                    post={p}
                    currentUserId={currentUser?.id ?? null}
                    onDelete={(id) => deleteMutation.mutate(id)}
                    isDeleting={deleteMutation.isPending}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

// * --- Sentiment badge -------------------------------------------------------

/**
 * Map a raw sentiment string returned by the API to a human-readable label
 * and a corresponding CSS color token so the dot is always on-brand.
 */
function sentimentStyle(sentiment: string): { label: string; color: string } {
  const s = sentiment.toLowerCase();
  if (s === "positive") return { label: "Positive", color: "#16a34a" };
  if (s === "negative") return { label: "Negative", color: "#e83151" };
  return { label: "Neutral", color: "#6b7280" };
}

/**
 * Tiny badge that shows a colored dot + label for the sentiment of a post.
 * Renders nothing while the query is loading so it never causes layout shift.
 */
function SentimentBadge({ postId, content }: { postId: string; content: string }) {
  // each badge fetches sentiment independently, keyed by post ID so React
  // Query caches and deduplicates them across re-renders.
  const { data } = useQuery({
    queryKey: ["post-sentiment", postId],
    queryFn: () => intelligenceApi.analyzeSentiment(content),
    // stale time of 10 minutes - sentiment doesn't change after posting
    staleTime: 10 * 60 * 1000,
  });

  if (!data) return null;

  const { label, color } = sentimentStyle(data.sentiment);

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontSize: 10.5,
        fontWeight: 600,
        color,
        fontFamily: "'JetBrains Mono', monospace",
      }}
    >
      {/* colored dot indicator */}
      <span
        style={{
          display: "inline-block",
          width: 7,
          height: 7,
          borderRadius: "50%",
          background: color,
          flexShrink: 0,
        }}
      />
      {label}
    </span>
  );
}

// * --- Post card -------------------------------------------------------------

type PostCardProps = {
  post: CommunityPost;
  /** ID of the currently logged-in user - used to decide whether to show the delete button. */
  currentUserId: string | null;
  /** Called with the post id when the user confirms deletion. */
  onDelete: (postId: string) => void;
  /** Disables the delete button while a delete request is in flight. */
  isDeleting: boolean;
};

/**
 * Renders a single community post with its content, timestamp, sentiment badge,
 * and - for the post's own author - a small trash-icon delete button.
 */
function PostCard({ post, currentUserId, onDelete, isDeleting }: PostCardProps) {
  // only the author should see the delete affordance
  const isOwner = currentUserId !== null && post.author_id === currentUserId;

  return (
    <div style={{ padding: 12, background: "var(--low)", borderRadius: 10 }}>
      {/* post body */}
      <div style={{ fontSize: 13, lineHeight: 1.55 }}>{post.content}</div>
      {/* footer row: timestamp left, sentiment + delete right */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 6,
        }}
      >
        <div
          style={{
            fontSize: 10.5,
            color: "var(--on-mut)",
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          {new Date(post.created_at).toLocaleString()}
        </div>
        {/* right-side controls */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <SentimentBadge postId={post.id} content={post.content} />
          {/* delete button - only rendered for the post's author */}
          {isOwner && (
            <button
              title="Delete post"
              disabled={isDeleting}
              onClick={() => onDelete(post.id)}
              style={{
                background: "none",
                border: "none",
                cursor: isDeleting ? "not-allowed" : "pointer",
                padding: 2,
                display: "flex",
                alignItems: "center",
                color: "var(--on-mut)",
                opacity: isDeleting ? 0.4 : 1,
              }}
            >
              {/* Material Symbols trash icon via the existing MS helper */}
              <MS n="delete" size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
