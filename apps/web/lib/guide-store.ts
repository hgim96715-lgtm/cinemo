'use client';
import { GUIDE_STORAGE_KEY } from '@cinemo/shared';
import { create } from 'zustand';
import { useAuthStore } from './auth-store';

type GuideState = {
  pending: boolean;
  pendingUserId: string | null;
  requestGuide: () => void;
  finishGuide: () => void;
  shouldShowGuide: () => boolean;
};

function getUserGuideKey(userId: string) {
  return `${GUIDE_STORAGE_KEY}:${userId}`;
}

function isGuideDone(userId: string): boolean {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem(getUserGuideKey(userId)) === '1';
}

export const useGuideStore = create<GuideState>((set, get) => ({
  pending: false,
  pendingUserId: null,

  requestGuide: () => {
    const userId = useAuthStore.getState().user?.id;
    if (!userId || isGuideDone(userId)) return;
    set({ pending: true, pendingUserId: userId });
  },
  finishGuide: () => {
    const userId = get().pendingUserId;
    if (userId) {
      localStorage.setItem(getUserGuideKey(userId), '1');
      set({ pending: false, pendingUserId: null });
    }
  },
  shouldShowGuide: () => {
    const userId = get().pendingUserId;
    return Boolean(get().pending && userId && !isGuideDone(userId));
  },
}));
