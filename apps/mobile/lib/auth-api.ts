import { apiClient } from "./axios";
import { saveAuthTokens, saveAuthUser } from "./auth-session";

type RegisterInput = {
  email: string;
  password: string;
  nickname: string;
};

type LoginInput = {
  email: string;
  password: string;
};

export type AuthUser = {
  id: string;
  email: string;
  nickname: string;
  role: string;
};

export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
  message: string;
};

export async function registerRequest(
  input: RegisterInput,
): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>(
    "/v1/auth/register",
    input,
  );

  await saveAuthTokens({
    accessToken: response.data.accessToken,
    refreshToken: response.data.refreshToken,
  });
  await saveAuthUser({
    nickname: response.data.user.nickname,
  });

  return response.data;
}

export async function loginRequest(input: LoginInput): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>("/v1/auth/login", input);

  await saveAuthTokens({
    accessToken: response.data.accessToken,
    refreshToken: response.data.refreshToken,
  });

  await saveAuthUser({
    nickname: response.data.user.nickname,
  });

  return response.data;
}

export type PasswordResetRequestResponse = {
  message: string;
};

export type ResetPasswordRequest = {
  email: string;
  code: string;
  newPassword: string;
};

export type VerifyPasswordResetCodeRequest = {
  email: string;
  code: string;
};

export async function requestPasswordReset(
  email: string,
): Promise<PasswordResetRequestResponse> {
  const response = await apiClient.post<PasswordResetRequestResponse>(
    "/v1/auth/password-reset/request",
    { email },
  );

  return response.data;
}

export async function verifyPasswordResetCode(
  input: VerifyPasswordResetCodeRequest,
): Promise<PasswordResetRequestResponse> {
  const response = await apiClient.post<PasswordResetRequestResponse>(
    "/v1/auth/password-reset/verify",
    input,
  );

  return response.data;
}

export async function resetPasswordRequest(
  input: ResetPasswordRequest,
): Promise<PasswordResetRequestResponse> {
  const response = await apiClient.post<PasswordResetRequestResponse>(
    "/v1/auth/password-reset/confirm",
    input,
  );

  return response.data;
}
