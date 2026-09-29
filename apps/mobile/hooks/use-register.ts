import { useMutation, useQueryClient } from "@tanstack/react-query";
import { registerRequest, type AuthResponse } from "../lib/auth-api";

type RegisterInput = {
  email: string;
  password: string;
  nickname: string;
};

export function useRegister() {
  const queryClient = useQueryClient();

  return useMutation<AuthResponse, Error, RegisterInput>({
    mutationFn: registerRequest,
    onSuccess: ({ user }) => {
      queryClient.setQueryData(["auth-user"], user);
    },
  });
}
