'use client';

import type { AvatarConfig, ProfileConfig } from '@cinemo/shared';
import { create } from 'zustand';

export type AuthUser = {
  id: string;
  email: string;
  nickname: string;
  role: 'user' | 'admin';
  isTestAccount: boolean;
  avatarConfig: AvatarConfig;
  bio: string | null;
  profilePublic: boolean;
  tags: string[];
};
export type UpdateProfileInput = Partial<ProfileConfig> & { nickname?: string };

type AuthState = {
  accessToken: string | null;
  user: AuthUser | null;
  hydrated: boolean;
  setSession: (accessToken: string, user: AuthUser) => void;
  setUser: (user: AuthUser) => void;
  clearSession: () => void;
  hydrate: () => void;
};

const STORAGE_KEY = 'cinemo_access_token';

export const useAuthStore = create<AuthState>((set) => ({
  hydrated: false,
  accessToken: null,
  user: null,

  setSession: (accessToken, user) => {
    localStorage.setItem(STORAGE_KEY, accessToken);
    set({ accessToken, user });
  },

  setUser: (user) => set({ user }),

  clearSession: () => {
    localStorage.removeItem(STORAGE_KEY);
    set({ accessToken: null, user: null });
  },

  hydrate: () => {
    if (typeof window === 'undefined') return;
    const accessToken = localStorage.getItem(STORAGE_KEY);
    set({ accessToken, hydrated: true });
  },
}));
