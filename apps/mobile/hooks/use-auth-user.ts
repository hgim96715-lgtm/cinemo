import { useQuery } from "@tanstack/react-query";
import { getAuthUser } from "../lib/auth-session";

export const AUTH_USER_QUERY_KEY = ["auth-user"] as const;

export function useAuthUser() {
  return useQuery({
    queryKey: AUTH_USER_QUERY_KEY,
    queryFn: getAuthUser,
    staleTime: Infinity,
  });
}
