import client from "@/shared/api/client";

const BASE = "/org/api/v1/communities";

// * types

export type Community = {
  id: string;
  name: string;
  description: string;
  member_count: number;
  is_member: boolean;
  created_at: string;
};

export type CommunityPost = {
  id: string;
  community_id: string;
  author_id: string;
  content: string;
  created_at: string;
  // * extended backend fields
  /** One of: text, image, video, link, poll. */
  post_type: "text" | "image" | "video" | "link" | "poll";
  /** Lifecycle status of the post. */
  status: "draft" | "published" | "hidden" | "removed";
  /** Attached media URLs (images, video thumbnails, etc.). */
  media_urls: string[];
  /** Cumulative like count. */
  like_count: number;
  /** Total comment count. */
  comment_count: number;
  /** Number of user reports on this post. */
  report_count: number;
  /** Whether the post is pinned at the top of the feed. */
  is_pinned: boolean;
  /** ISO timestamp set when the post is soft-deleted; null while active. */
  deleted_at: string | null;
};

type ApiOk<T> = { data: T };

// * api client

/** Community service API calls. */
const communityApi = {
  /** Fetch all communities. */
  list: () => client.get<ApiOk<Community[]>>(`${BASE}/`).then((r) => r.data.data ?? []),

  /** Create a new community. */
  create: (payload: { name: string; description: string }) =>
    client.post<ApiOk<Community>>(`${BASE}/`, payload).then((r) => r.data.data),

  /** Fetch a single community by id. */
  get: (id: string) => client.get<ApiOk<Community>>(`${BASE}/${id}/`).then((r) => r.data.data),

  /** Join a community by id. */
  join: (id: string) =>
    client.post<ApiOk<Community>>(`${BASE}/${id}/join/`).then((r) => r.data.data),

  /** List posts for a community. */
  listPosts: (id: string) =>
    client.get<ApiOk<CommunityPost[]>>(`${BASE}/${id}/posts/`).then((r) => r.data.data ?? []),

  /** Publish a post to a community. */
  createPost: (id: string, content: string) =>
    client.post<ApiOk<CommunityPost>>(`${BASE}/${id}/posts/`, { content }).then((r) => r.data.data),

  /** Soft-delete a post by its id. Returns 204 with no body on success. */
  deletePost: (postId: string) => client.delete(`${BASE}/posts/${postId}/`),
};

export default communityApi;
