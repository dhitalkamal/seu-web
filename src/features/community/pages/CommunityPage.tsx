import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AppLayout from "@/shared/layouts/AppLayout";
import { PH, KPI, MS, useToast } from "@/shared/components/v8";
import communityApi from "../api/community.api";
import intelligenceApi from "@/features/intelligence/api/intelligence.api";
import { useAuthStore } from "@/shared/store/auth.store";
import type { CommunityPost } from "../api/community.api";

/** Communities page - browse, join, and post in communities. */
export default function CommunityPage() {
  const { toast, toastEl } = useToast();
  const qc = useQueryClient();
  // Pull the logged-in user so we can compare against post.author_id below
  const currentUser = useAuthStore((s) => s.user);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [postContent, setPostContent] = useState("");

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
      setShowForm(false);
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
   * postMutation if the content is clean.  A flagged result shows a
   * warning toast and aborts — the user can edit and try again.
   */
  async function handlePostSubmit() {
    if (!postContent || postMutation.isPending) return;
    try {
      const result = await intelligenceApi.moderateContent(postContent);
      if (result.flagged) {
        // Surface the violated categories so the user knows what to fix
        const cats = result.categories.length ? result.categories.join(", ") : "policy violation";
        toast(`Post blocked: content flagged for ${cats}. Please revise before posting.`);
        return;
      }
    } catch {
      // If the moderation API is unavailable, log silently and allow the post
      // through rather than blocking the user entirely.
      console.warn("Moderation check failed — skipping.");
    }
    postMutation.mutate();
  }

  const activeCommunity = communities.find((c) => c.id === selected);

  return (
    <AppLayout variant="user">
      {toastEl}
      <PH
        crumbs={["Discover", "Communities"]}
        title="Communities"
        sub="Join communities and connect with attendees and organisers."
        actions={
          <button className="btn-sm primary" onClick={() => setShowForm((p) => !p)}>
            <MS n="add" size={13} />
            {showForm ? "Cancel" : "New community"}
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

      {/* create form */}
      {showForm && (
        <div className="panel" style={{ marginBottom: 18 }}>
          <div className="panel-head">
            <span className="panel-title">Create community</span>
          </div>
          <div className="panel-body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div className="field">
              <label className="field-lab">Name</label>
              <input
                className="field-in"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tech Kathmandu"
              />
            </div>
            <div className="field">
              <label className="field-lab">Description</label>
              <textarea
                className="field-in"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="About this community..."
              />
            </div>
            <button
              className="btn-sm primary"
              onClick={() => createMutation.mutate()}
              disabled={!name || createMutation.isPending}
              style={{ justifyContent: "center" }}
            >
              Create
            </button>
          </div>
        </div>
      )}

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
              {/* compose post */}
              <div className="field">
                <textarea
                  className="field-in"
                  rows={3}
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  placeholder="Write a post..."
                />
              </div>
              {/* clicking Post runs moderation first, then submits if clean */}
              <button
                className="btn-sm primary"
                onClick={handlePostSubmit}
                disabled={!postContent || postMutation.isPending}
                style={{ justifyContent: "center" }}
              >
                Post
              </button>
              {/* post list */}
              <div
                style={{
                  borderTop: "1px solid var(--outline)",
                  paddingTop: 14,
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

// * ─── Sentiment badge ───────────────────────────────────────────────────────

/**
 * Map a raw sentiment string returned by the API to a human-readable label
 * and a corresponding CSS colour token so the dot is always on-brand.
 */
function sentimentStyle(sentiment: string): { label: string; color: string } {
  const s = sentiment.toLowerCase();
  if (s === "positive") return { label: "Positive", color: "#16a34a" };
  if (s === "negative") return { label: "Negative", color: "#e83151" };
  return { label: "Neutral", color: "#6b7280" };
}

/**
 * Tiny badge that shows a coloured dot + label for the sentiment of a post.
 * Renders nothing while the query is loading so it never causes layout shift.
 */
function SentimentBadge({ postId, content }: { postId: string; content: string }) {
  // Each badge fetches sentiment independently, keyed by post ID so React
  // Query caches and deduplicates them across re-renders.
  const { data } = useQuery({
    queryKey: ["post-sentiment", postId],
    queryFn: () => intelligenceApi.analyzeSentiment(content),
    // Stale time of 10 minutes — sentiment doesn't change after posting
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
      {/* coloured dot indicator */}
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

// * ─── Post card ─────────────────────────────────────────────────────────────

type PostCardProps = {
  post: CommunityPost;
  /** ID of the currently logged-in user — used to decide whether to show the delete button. */
  currentUserId: string | null;
  /** Called with the post id when the user confirms deletion. */
  onDelete: (postId: string) => void;
  /** Disables the delete button while a delete request is in flight. */
  isDeleting: boolean;
};

/**
 * Renders a single community post with its content, timestamp, sentiment badge,
 * and — for the post's own author — a small trash-icon delete button.
 */
function PostCard({ post, currentUserId, onDelete, isDeleting }: PostCardProps) {
  // Only the author should see the delete affordance
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
          {/* delete button — only rendered for the post's author */}
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
