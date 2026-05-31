/** batch-resolves user UUIDs to display names via the IAM internal endpoint */

import { useQuery } from "@tanstack/react-query";
import client from "@/shared/api/client";

type UserInfo = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  avatar_url: string | null;
};

/** fetch a batch of user IDs and return a map of id -> UserInfo */
async function fetchUserNames(ids: string[]): Promise<Record<string, UserInfo>> {
  if (ids.length === 0) return {};
  const r = await client.post<{ data: Record<string, UserInfo> }>("/iam/api/v1/users/resolve/", {
    ids,
  });
  return r.data?.data ?? {};
}

/**
 * resolves a list of user UUIDs to their display names.
 * returns a map keyed by user ID with full_name, email, avatar_url.
 * safe to call with duplicates or empty arrays.
 */
export function useUserNames(userIds: string[]) {
  const unique = [...new Set(userIds.filter(Boolean))];
  const { data = {}, isLoading } = useQuery({
    queryKey: ["user-names", unique.sort().join(",")],
    queryFn: () => fetchUserNames(unique),
    enabled: unique.length > 0,
    staleTime: 5 * 60 * 1000,
  });
  return { userMap: data, isLoading };
}

/** shortcut to get a display name from the map, falling back to truncated UUID */
export function displayName(
  userMap: Record<string, UserInfo>,
  userId: string | undefined | null
): string {
  if (!userId) return "...";
  const user = userMap[userId];
  return user?.full_name ?? userId.slice(0, 8);
}
