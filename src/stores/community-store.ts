/**
 * Community Store
 * 공개 프로필 목록, 커뮤니티 필터, 커피챗 요청 상태 관리
 *
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.14, 8.15
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ChatRequest, CommunityFilter, PublicProfileCard } from '@/types';
import { STORAGE_KEYS } from '@/constants/storage-keys';

/**
 * PublicProfileCard를 로컬에서 확장한 타입.
 * company 필드는 필터링용으로만 사용되며 base 타입에는 없는 선택적 필드다.
 */
export type PublicProfileCardExtended = PublicProfileCard & {
  company?: string;
};

interface CommunityState {
  /** 공개 프로필 목록 (세션 기반, persist 제외) */
  publicProfiles: PublicProfileCardExtended[];
  /** 현재 적용 중인 필터 */
  filter: CommunityFilter;
  /** 커피챗 요청 목록 (persist 대상) */
  chatRequests: ChatRequest[];
}

interface CommunityActions {
  /**
   * 필터 옵션 업데이트.
   * role / company / skill 변경 시 page를 1로 초기화한다.
   */
  setFilter(filter: Partial<CommunityFilter>): void;

  /**
   * 현재 필터 조건에 맞는 프로필 목록 반환.
   * - role: title 필드와 대소문자 무시 부분 일치
   * - company: company 필드와 대소문자 무시 부분 일치
   * - skill: skills 배열 중 하나라도 대소문자 무시 부분 일치
   */
  getFilteredProfiles(): PublicProfileCardExtended[];

  /**
   * 현재 페이지에 해당하는 프로필 목록 반환 (최대 12개).
   */
  getPaginatedProfiles(): PublicProfileCardExtended[];

  /**
   * 필터 적용 결과를 기준으로 전체 페이지 수 반환.
   */
  getTotalPages(): number;

  /**
   * 커피챗 요청 추가.
   */
  addChatRequest(request: ChatRequest): void;

  /**
   * 커피챗 요청 상태 변경 (accepted | rejected).
   */
  updateChatRequestStatus(
    requestId: string,
    status: 'accepted' | 'rejected'
  ): void;

  /**
   * 특정 사용자가 수신한 커피챗 요청 목록 반환 (toUserId 기준).
   */
  getChatRequestsForUser(userId: string): ChatRequest[];

  /**
   * 공개 프로필 목록 설정 (외부에서 프로필 데이터를 주입할 때 사용).
   */
  setPublicProfiles(profiles: PublicProfileCardExtended[]): void;
}

type CommunityStore = CommunityState & CommunityActions;

const DEFAULT_FILTER: CommunityFilter = {
  page: 1,
  pageSize: 12,
};

/** 필터링 기준이 변경되는 키 목록 */
const FILTER_RESET_KEYS: Array<keyof CommunityFilter> = [
  'role',
  'company',
  'skill',
];

export const useCommunityStore = create<CommunityStore>()(
  persist(
    (set, get) => ({
      // ──────────────────────── State ────────────────────────
      publicProfiles: [],
      filter: DEFAULT_FILTER,
      chatRequests: [],

      // ──────────────────────── Actions ────────────────────────
      setFilter(partial) {
        const shouldResetPage = FILTER_RESET_KEYS.some(
          (key) => key in partial
        );
        set((state) => ({
          filter: {
            ...state.filter,
            ...partial,
            // 필터 조건(role/company/skill) 변경 시 항상 1페이지로 초기화
            page: shouldResetPage ? 1 : (partial.page ?? state.filter.page),
          },
        }));
      },

      getFilteredProfiles() {
        const { publicProfiles, filter } = get();
        const { role, company, skill } = filter;

        return publicProfiles.filter((profile) => {
          if (role) {
            const roleLower = role.toLowerCase();
            if (!profile.title.toLowerCase().includes(roleLower)) {
              return false;
            }
          }

          if (company) {
            const companyLower = company.toLowerCase();
            const profileCompany = profile.company?.toLowerCase() ?? '';
            if (!profileCompany.includes(companyLower)) {
              return false;
            }
          }

          if (skill) {
            const skillLower = skill.toLowerCase();
            const hasSkill = profile.skills.some((s) =>
              s.toLowerCase().includes(skillLower)
            );
            if (!hasSkill) {
              return false;
            }
          }

          return true;
        });
      },

      getPaginatedProfiles() {
        const { filter } = get();
        const filtered = get().getFilteredProfiles();
        const { page, pageSize } = filter;
        const start = (page - 1) * pageSize;
        return filtered.slice(start, start + pageSize);
      },

      getTotalPages() {
        const { filter } = get();
        const filtered = get().getFilteredProfiles();
        return Math.ceil(filtered.length / filter.pageSize) || 1;
      },

      addChatRequest(request) {
        set((state) => ({
          chatRequests: [...state.chatRequests, request],
        }));
      },

      updateChatRequestStatus(requestId, status) {
        set((state) => ({
          chatRequests: state.chatRequests.map((req) =>
            req.id === requestId
              ? {
                  ...req,
                  status,
                  respondedAt: new Date().toISOString(),
                }
              : req
          ),
        }));
      },

      getChatRequestsForUser(userId) {
        return get().chatRequests.filter((req) => req.toUserId === userId);
      },

      setPublicProfiles(profiles) {
        set({ publicProfiles: profiles });
      },
    }),
    {
      name: STORAGE_KEYS.CHAT_REQUESTS, // 'cupol_chat_requests'
      // publicProfiles와 filter는 세션 기반이므로 persist에서 제외
      partialize: (state) => ({ chatRequests: state.chatRequests }),
    }
  )
);
