/**
 * Portfolio Store - 통합 포트폴리오 엔티티 관리
 *
 * 하나의 Portfolio = 생성된 HTML 사이트 + 사용자가 붙인 이름 + 공개여부 + 원본 데이터(수정용)
 * - 생성 흐름 마지막에 1개만 생성된다.
 * - HTML 형태로 저장/조회/수정/내보내기 한다 (JSON 아님).
 * - 입력 폼 → 템플릿 → 발행(이름/공개여부) 단계의 임시 draft도 함께 관리한다.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { STORAGE_KEYS } from '@/constants/storage-keys';
import type { ProfileData, Customization } from '@/types';

// ---------------------------------------------------------------------------
// 타입
// ---------------------------------------------------------------------------

export interface Portfolio {
  id: string;
  userId: string;
  ownerName: string;          // 작성자(소유자) 이름
  title: string;              // 사용자가 붙인 포트폴리오 이름
  profileData: ProfileData;   // 수정/재생성용 원본 데이터
  html: string;               // 생성된 전체 HTML
  templateId: string;
  customization: Customization;
  visibility: 'public' | 'private';
  createdAt: string;
  updatedAt: string;
}

/** 생성 흐름 중 임시 보관하는 입력 데이터 */
export interface PortfolioDraft {
  profileData: Omit<ProfileData, 'id' | 'createdAt' | 'updatedAt'> | null;
  /** 수정 모드일 때 대상 포트폴리오 id */
  editingId: string | null;
}

interface PortfolioState {
  portfolios: Portfolio[];
  draft: PortfolioDraft;
}

interface PortfolioActions {
  /** 새 포트폴리오 생성 (생성 흐름 마지막 단계) */
  createPortfolio: (input: Omit<Portfolio, 'id' | 'createdAt' | 'updatedAt'>) => Portfolio;
  /** 기존 포트폴리오 갱신 (수정 모드) */
  updatePortfolio: (id: string, patch: Partial<Omit<Portfolio, 'id' | 'createdAt'>>) => void;
  /** 단일 삭제 */
  deletePortfolio: (id: string) => void;
  /** 일괄 삭제 */
  deleteMany: (ids: string[]) => void;
  /** 공개/비공개 토글 */
  setVisibility: (id: string, visibility: 'public' | 'private') => void;
  /** id로 조회 */
  getById: (id: string) => Portfolio | undefined;
  /** 특정 사용자의 포트폴리오 */
  getByUser: (userId: string) => Portfolio[];
  /** 공개 포트폴리오 전체 */
  getPublic: () => Portfolio[];

  /** draft 설정 (입력 폼 완료 시) */
  setDraft: (profileData: PortfolioDraft['profileData'], editingId?: string | null) => void;
  /** draft 초기화 */
  clearDraft: () => void;
}

export type PortfolioStore = PortfolioState & PortfolioActions;

// ---------------------------------------------------------------------------
// 유틸
// ---------------------------------------------------------------------------

const genId = (): string =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

const safeStorage = (): Storage => {
  try {
    const k = '__cupol_pf_test__';
    localStorage.setItem(k, '1');
    localStorage.removeItem(k);
    return localStorage;
  } catch {
    const mem = new Map<string, string>();
    return {
      getItem: (k: string) => mem.get(k) ?? null,
      setItem: (k: string, v: string) => { mem.set(k, v); },
      removeItem: (k: string) => { mem.delete(k); },
      clear: () => { mem.clear(); },
      key: (i: number) => Array.from(mem.keys())[i] ?? null,
      get length() { return mem.size; },
    } as Storage;
  }
};

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const usePortfolioStore = create<PortfolioStore>()(
  persist(
    (set, get) => ({
      portfolios: [],
      draft: { profileData: null, editingId: null },

      createPortfolio: (input) => {
        const now = new Date().toISOString();
        const pf: Portfolio = { ...input, id: genId(), createdAt: now, updatedAt: now };
        set((s) => ({ portfolios: [...s.portfolios, pf] }));
        return pf;
      },

      updatePortfolio: (id, patch) => {
        set((s) => ({
          portfolios: s.portfolios.map((p) =>
            p.id === id ? { ...p, ...patch, id: p.id, createdAt: p.createdAt, updatedAt: new Date().toISOString() } : p
          ),
        }));
      },

      deletePortfolio: (id) => {
        set((s) => ({ portfolios: s.portfolios.filter((p) => p.id !== id) }));
      },

      deleteMany: (ids) => {
        const idSet = new Set(ids);
        set((s) => ({ portfolios: s.portfolios.filter((p) => !idSet.has(p.id)) }));
      },

      setVisibility: (id, visibility) => {
        set((s) => ({
          portfolios: s.portfolios.map((p) =>
            p.id === id ? { ...p, visibility, updatedAt: new Date().toISOString() } : p
          ),
        }));
      },

      getById: (id) => get().portfolios.find((p) => p.id === id),
      getByUser: (userId) => get().portfolios.filter((p) => p.userId === userId),
      getPublic: () => get().portfolios.filter((p) => p.visibility === 'public'),

      setDraft: (profileData, editingId = null) => {
        set({ draft: { profileData, editingId } });
      },
      clearDraft: () => set({ draft: { profileData: null, editingId: null } }),
    }),
    {
      name: STORAGE_KEYS.PORTFOLIO_ITEMS,
      storage: createJSONStorage(safeStorage),
      partialize: (s) => ({ portfolios: s.portfolios, draft: s.draft }),
    }
  )
);
