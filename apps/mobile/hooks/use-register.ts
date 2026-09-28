import { useMutation } from "@tanstack/react-query";
import { registerRequest, type AuthResponse } from "../lib/auth-api";

type RegisterInput = {
  email: string;
  password: string;
  nickname: string;
};

export function useRegister() {
  return useMutation<AuthResponse, Error, RegisterInput>({
    mutationFn: registerRequest,
  });
}
