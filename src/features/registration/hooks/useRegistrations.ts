import { useQuery } from "@tanstack/react-query";
import registrationApi from "@/features/registration/api/registration.api";

/**
 * Fetches all registrations belonging to the authenticated user.
 * @returns React Query result whose `data` is a Registration array.
 */
export function useMyRegistrations() {
  return useQuery({
    queryKey: ["registrations", "mine"],
    queryFn: () => registrationApi.listMine(),
  });
}
