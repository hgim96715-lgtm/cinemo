import { useMutation, useQueryClient } from "@tanstack/react-query";
import { loginRequest, type AuthResponse } from "../lib/auth-api";

type LoginInput = {
  email: string;
  password: string;
};

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation<AuthResponse, Error, LoginInput>({
    mutationFn: loginRequest,
    onSuccess: ({ user }) => {
      queryClient.setQueryData(["auth-user"], user);
    },
  });
}
