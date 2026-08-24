import { PublicProfile, type AvatarConfig } from '@cinemo/shared';
import { apiFetch } from './api';
import type { AuthUser, UpdateProfileInput } from './auth-store';

export type AuthResponse = {
  accessToken: string;
  user: AuthUser;
  message: string;
};

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

export function updateAvatarRequest(token: string, avatar: AvatarConfig) {
  return apiFetch<AuthUser>('/auth/avatar', {
    method: 'PATCH',
    token,
    body: JSON.stringify(avatar),
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
  return apiFetch<PublicProfile>(`/profiles/${encodeURIComponent(nickname)}`);
}

export function checkEmailRequest(email: string) {
  return apiFetch<{ available: boolean }>(
    `/auth/check-email?email=${encodeURIComponent(email)}`,
  );
}

export function checkNicknameRequest(nickname: string) {
  return apiFetch<{ available: boolean }>(
    `/auth/check-nickname?nickname=${encodeURIComponent(nickname)}`,
  );
}
