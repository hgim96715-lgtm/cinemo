import { useMutation } from "@tanstack/react-query";
import {
  resetPasswordRequest,
  type PasswordResetRequestResponse,
  type ResetPasswordRequest,
} from "../lib/auth-api";

export function useResetPassword() {
  return useMutation<PasswordResetRequestResponse, Error, ResetPasswordRequest>(
    {
      mutationFn: resetPasswordRequest,
    },
  );
}
