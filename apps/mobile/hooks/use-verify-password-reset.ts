import { useMutation } from "@tanstack/react-query";
import {
  verifyPasswordResetCode,
  type PasswordResetRequestResponse,
  type VerifyPasswordResetCodeRequest,
} from "../lib/auth-api";

export function useVerifyPasswordResetCode() {
  return useMutation<
    PasswordResetRequestResponse,
    Error,
    VerifyPasswordResetCodeRequest
  >({
    mutationFn: verifyPasswordResetCode,
  });
}
