import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../lib/axios";
import { clearAuthTokens, getAuthTokens } from "../lib/auth-session";
import { AUTH_USER_QUERY_KEY } from "./use-auth-user";

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { refreshToken } = await getAuthTokens();
      if (refreshToken) {
        await apiClient.post("/v1/auth/logout", {
          refreshToken,
        });
      }
    },
    onSettled: async () => {
      await clearAuthTokens();
      queryClient.setQueryData(AUTH_USER_QUERY_KEY, null);
    },
  });
}
