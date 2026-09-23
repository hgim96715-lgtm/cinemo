import type {
  AuthResponse,
  AuthUser,
  AvailabilityResponse,
  MessageResponse,
  PublicProfileResponse,
} from '@cinemo/api-contract';
import { apiFetch } from './api-fetch';
import type { UpdateProfileInput } from './auth-store';

export function loginRequest(email: string, password: string) {
  return apiFetch<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function registerRequest(
  email: string,
  password: string,
  nickname: string,
) {
  return apiFetch<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, nickname }),
  });
}

export function meRequest(token: string) {
  return apiFetch<AuthUser>('/auth/me', { token });
}

export function exchangeOAuthCodeRequest(code: string) {
  return apiFetch<AuthResponse>('/auth/google/exchange', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
}

export function updateProfileRequest(
  token: string,
  profile: UpdateProfileInput,
) {
  return apiFetch<AuthUser>('/auth/profile', {
    method: 'PATCH',
    token,
    body: JSON.stringify(profile),
  });
}

export function getPublicProfileRequest(nickname: string) {
  return apiFetch<PublicProfileResponse>(
    `/profiles/${encodeURIComponent(nickname)}`,
  );
}

export function checkEmailRequest(email: string) {
  return apiFetch<AvailabilityResponse>(
    `/auth/check-email?email=${encodeURIComponent(email)}`,
  );
}

export function checkNicknameRequest(nickname: string) {
  return apiFetch<AvailabilityResponse>(
    `/auth/check-nickname?nickname=${encodeURIComponent(nickname)}`,
  );
}

export function requestPasswordReset(email: string) {
  return apiFetch<MessageResponse>('/auth/password-reset/request', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export function resetPasswordRequest(token: string, newPassword: string) {
  return apiFetch<MessageResponse>('/auth/password-reset/confirm', {
    method: 'POST',
    body: JSON.stringify({ token, newPassword }),
  });
}
