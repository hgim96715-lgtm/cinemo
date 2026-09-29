import { useMutation } from "@tanstack/react-query";
import {
  requestPasswordReset,
  type PasswordResetRequestResponse,
} from "../lib/auth-api";

export function usePasswordReset() {
  return useMutation<PasswordResetRequestResponse, Error, string>({
    mutationFn: requestPasswordReset,
  });
}
