import client from "@/shared/api/client";

const BASE = "/org/api/v1/communities";

export type Community = {
  id: string;
  name: string;
  slug: string;
  description: string;
  privacy: string;
  member_count: number;
  is_member: boolean;
  created_by: string;
  organization_id: string | null;
  created_at: string;
};

export type CommunityPost = {
  id: string;
  community_id: string;
  author_id: string;
  author_name: string;
  author_avatar: string;
  content: string;
  post_type: "text" | "image" | "video" | "link" | "poll";
  status: "draft" | "published" | "hidden" | "removed";
  media_urls: string[];
  like_count: number;
  comment_count: number;
  report_count: number;
  is_pinned: boolean;
  is_liked: boolean;
  repost_count: number;
  created_at: string;
  deleted_at: string | null;
};

export type PostComment = {
  id: string;
  post_id: string;
  author_id: string;
  author_name: string;
  author_avatar: string;
  content: string;
  parent_id: string | null;
  like_count: number;
  reply_count: number;
  created_at: string;
  replies: PostComment[];
};

export type Hashtag = {
  id: string;
  name: string;
  post_count: number;
};

type ApiOk<T> = { data: T };

const communityApi = {
  list: () => client.get<ApiOk<Community[]>>(`${BASE}/`).then((r) => r.data.data ?? []),

  create: (payload: {
    name: string;
    slug: string;
    description?: string;
    privacy?: string;
    organization_id?: string;
  }) => client.post<ApiOk<Community>>(`${BASE}/`, payload).then((r) => r.data.data),

  join: (id: string) =>
    client.post<ApiOk<Community>>(`${BASE}/${id}/join/`).then((r) => r.data.data),

  listPosts: (id: string) =>
    client.get<ApiOk<CommunityPost[]>>(`${BASE}/${id}/posts/`).then((r) => r.data.data ?? []),

  createPost: (
    id: string,
    payload: { content: string; media_urls?: string[]; post_type?: string }
  ) => client.post<ApiOk<CommunityPost>>(`${BASE}/${id}/posts/`, payload).then((r) => r.data.data),

  deletePost: (postId: string) => client.delete(`${BASE}/posts/${postId}/`),

  likePost: (postId: string) => client.post(`${BASE}/posts/${postId}/like/`),

  unlikePost: (postId: string) => client.delete(`${BASE}/posts/${postId}/like/`),

  listComments: (postId: string) =>
    client
      .get<ApiOk<PostComment[]>>(`${BASE}/posts/${postId}/comments/`)
      .then((r) => r.data.data ?? []),

  createComment: (postId: string, content: string, parentId?: string) =>
    client
      .post<ApiOk<PostComment>>(`${BASE}/posts/${postId}/comments/`, {
        content,
        parent_id: parentId ?? null,
      })
      .then((r) => r.data.data),

  listHashtags: () =>
    client.get<ApiOk<Hashtag[]>>(`${BASE}/hashtags/`).then((r) => r.data.data ?? []),
};

export default communityApi;
