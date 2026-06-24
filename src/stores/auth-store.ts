/**
 * CustomPortfolio: 대신취업해줘 - Auth Store
 * 사용자 인증 상태 관리 (Zustand + persist 미들웨어)
 * Requirements: 1.1, 1.3, 1.4, 1.7, 1.8
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { STORAGE_KEYS } from '@/constants/storage-keys';
import type { UserSession } from '@/types';

/** Auth Store 상태 */
interface AuthState {
  user: UserSession | null;
  isAuthenticated: boolean;
}

/** Auth Store 액션 */
interface AuthActions {
  /** 로그인: 사용자 세션 설정 및 인증 상태 활성화 */
  login: (user: UserSession) => void;
  /** 로그아웃: 사용자 세션 초기화 및 인증 상태 비활성화 */
  logout: () => void;
  /** 사용자 정보 업데이트 (isAuthenticated 유지) */
  setUser: (user: UserSession) => void;
}

export type AuthStore = AuthState & AuthActions;

/**
 * localStorage 접근 불가 시 인메모리 폴백 스토리지
 * (Requirements 1.8 - Graceful Degradation)
 */
const safeStorage = (): Storage => {
  try {
    const testKey = '__cupol_storage_test__';
    localStorage.setItem(testKey, '1');
    localStorage.removeItem(testKey);
    return localStorage;
  } catch {
    // localStorage 사용 불가 시 인메모리 폴백
    const memStore = new Map<string, string>();
    return {
      getItem: (key: string) => memStore.get(key) ?? null,
      setItem: (key: string, value: string) => { memStore.set(key, value); },
      removeItem: (key: string) => { memStore.delete(key); },
      clear: () => { memStore.clear(); },
      key: (index: number) => Array.from(memStore.keys())[index] ?? null,
      get length() { return memStore.size; },
    } as Storage;
  }
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      // 초기 상태
      user: null,
      isAuthenticated: false,

      // 로그인: 사용자 설정 + 인증 상태 true
      login: (user: UserSession) =>
        set({ user, isAuthenticated: true }),

      // 로그아웃: 사용자 초기화 + 인증 상태 false
      logout: () =>
        set({ user: null, isAuthenticated: false }),

      // 사용자 정보 업데이트 (이미 인증된 상태에서 프로필 변경 시)
      setUser: (user: UserSession) =>
        set({ user, isAuthenticated: true }),
    }),
    {
      name: STORAGE_KEYS.AUTH_SESSION,
      storage: createJSONStorage(safeStorage),
      // 직렬화 대상: user와 isAuthenticated만 persist
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
