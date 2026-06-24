/**
 * CustomPortfolio: 대신취업해줘 - Profile Store
 * 프로필 데이터 및 포트폴리오 상태 관리 (Zustand + persist 미들웨어)
 * Requirements: 3.7, 9.1, 9.2, 9.3, 9.4, 9.5, 9.6
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { STORAGE_KEYS } from '@/constants/storage-keys';
import { profileDataSchema } from '@/lib/validators';
import type { ProfileData } from '@/types';

// ---------------------------------------------------------------------------
// 유틸리티 타입
// ---------------------------------------------------------------------------

/** importFromJSON 성공 반환값 */
export interface ImportSuccess {
  success: true;
  profile: ProfileData;
}

/** importFromJSON 실패 반환값 */
export interface ImportFailure {
  success: false;
  error: 'invalid_json' | 'missing_fields';
}

export type ImportResult = ImportSuccess | ImportFailure;

// ---------------------------------------------------------------------------
// Store 타입 정의
// ---------------------------------------------------------------------------

/** Profile Store 상태 */
interface ProfileState {
  /** 저장된 프로필 목록 */
  profiles: ProfileData[];
  /** 현재 활성화된 프로필 ID */
  activeProfileId: string | null;
}

/** Profile Store 액션 */
interface ProfileActions {
  /**
   * 새 프로필 생성
   * id, createdAt, updatedAt은 자동 생성됨
   * Requirements: 3.7
   */
  saveProfile: (
    data: Omit<ProfileData, 'id' | 'createdAt' | 'updatedAt'>
  ) => ProfileData;

  /**
   * 기존 프로필 업데이트
   * updatedAt은 자동으로 현재 시각으로 갱신됨
   * Requirements: 3.7
   */
  updateProfile: (id: string, data: Partial<ProfileData>) => void;

  /**
   * 프로필 삭제
   * 삭제된 프로필이 activeProfileId인 경우 null로 초기화
   * Requirements: 3.7
   */
  deleteProfile: (id: string) => void;

  /**
   * 프로필 데이터를 JSON 문자열로 직렬화
   * Requirements: 9.1, 9.2
   */
  exportToJSON: (profileId: string) => string;

  /**
   * JSON 문자열에서 프로필 데이터를 복원
   * - JSON 파싱 실패 → { success: false, error: 'invalid_json' }
   * - Zod 검증 실패 → { success: false, error: 'missing_fields' }
   * - 성공 시 기존 프로필 교체 또는 추가, 상태 업데이트
   * 실패 시 기존 상태를 절대 변경하지 않음
   * Requirements: 9.3, 9.4, 9.5, 9.6
   */
  importFromJSON: (json: string) => ImportResult;

  /**
   * 활성 프로필 ID 설정
   */
  setActiveProfile: (id: string | null) => void;
}

export type ProfileStore = ProfileState & ProfileActions;

// ---------------------------------------------------------------------------
// LocalStorage 안전 접근 (Graceful Degradation)
// ---------------------------------------------------------------------------

/**
 * localStorage 접근 불가 시 인메모리 폴백 스토리지
 */
const safeStorage = (): Storage => {
  try {
    const testKey = '__cupol_profile_storage_test__';
    localStorage.setItem(testKey, '1');
    localStorage.removeItem(testKey);
    return localStorage;
  } catch {
    // localStorage 사용 불가 시 인메모리 폴백
    const memStore = new Map<string, string>();
    return {
      getItem: (key: string) => memStore.get(key) ?? null,
      setItem: (key: string, value: string) => {
        memStore.set(key, value);
      },
      removeItem: (key: string) => {
        memStore.delete(key);
      },
      clear: () => {
        memStore.clear();
      },
      key: (index: number) => Array.from(memStore.keys())[index] ?? null,
      get length() {
        return memStore.size;
      },
    } as Storage;
  }
};

// ---------------------------------------------------------------------------
// ID 생성 유틸리티
// ---------------------------------------------------------------------------

/**
 * 간단한 고유 ID 생성 (crypto.randomUUID 미지원 환경 대비 폴백)
 */
const generateId = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // 폴백: 타임스탬프 + 랜덤 값
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
};

// ---------------------------------------------------------------------------
// Profile Store 생성
// ---------------------------------------------------------------------------

export const useProfileStore = create<ProfileStore>()(
  persist(
    (set, get) => ({
      // 초기 상태
      profiles: [],
      activeProfileId: null,

      // -----------------------------------------------------------------------
      // saveProfile: 새 프로필 생성
      // -----------------------------------------------------------------------
      saveProfile: (data) => {
        const now = new Date().toISOString();
        const newProfile: ProfileData = {
          ...data,
          id: generateId(),
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({
          profiles: [...state.profiles, newProfile],
        }));
        return newProfile;
      },

      // -----------------------------------------------------------------------
      // updateProfile: 기존 프로필 업데이트
      // -----------------------------------------------------------------------
      updateProfile: (id, data) => {
        set((state) => ({
          profiles: state.profiles.map((profile) =>
            profile.id === id
              ? {
                  ...profile,
                  ...data,
                  id, // id 교체 방지
                  createdAt: profile.createdAt, // createdAt 변경 방지
                  updatedAt: new Date().toISOString(),
                }
              : profile
          ),
        }));
      },

      // -----------------------------------------------------------------------
      // deleteProfile: 프로필 삭제
      // -----------------------------------------------------------------------
      deleteProfile: (id) => {
        set((state) => ({
          profiles: state.profiles.filter((profile) => profile.id !== id),
          // 삭제된 프로필이 활성 프로필이었다면 null로 초기화
          activeProfileId:
            state.activeProfileId === id ? null : state.activeProfileId,
        }));
      },

      // -----------------------------------------------------------------------
      // exportToJSON: 프로필 데이터 JSON 직렬화
      // -----------------------------------------------------------------------
      exportToJSON: (profileId) => {
        const { profiles } = get();
        const profile = profiles.find((p) => p.id === profileId);
        if (!profile) {
          throw new Error(`Profile not found: ${profileId}`);
        }
        return JSON.stringify(profile);
      },

      // -----------------------------------------------------------------------
      // importFromJSON: JSON에서 프로필 복원 (Zod 검증 포함)
      // -----------------------------------------------------------------------
      importFromJSON: (json) => {
        // 1단계: JSON 파싱
        let parsed: unknown;
        try {
          parsed = JSON.parse(json);
        } catch {
          return { success: false, error: 'invalid_json' };
        }

        // 2단계: Zod 스키마 검증
        const result = profileDataSchema.safeParse(parsed);
        if (!result.success) {
          return { success: false, error: 'missing_fields' };
        }

        const validatedProfile: ProfileData = result.data;

        // 3단계: 유효한 경우에만 상태 업데이트 (기존 프로필 교체 또는 신규 추가)
        set((state) => {
          const existingIndex = state.profiles.findIndex(
            (p) => p.id === validatedProfile.id
          );
          if (existingIndex >= 0) {
            // 기존 프로필 교체
            const updated = [...state.profiles];
            updated[existingIndex] = validatedProfile;
            return { profiles: updated };
          }
          // 신규 추가
          return { profiles: [...state.profiles, validatedProfile] };
        });

        return { success: true, profile: validatedProfile };
      },

      // -----------------------------------------------------------------------
      // setActiveProfile: 활성 프로필 ID 설정
      // -----------------------------------------------------------------------
      setActiveProfile: (id) => {
        set({ activeProfileId: id });
      },
    }),
    {
      name: STORAGE_KEYS.PROFILE_DATA,
      storage: createJSONStorage(safeStorage),
      // profiles와 activeProfileId만 persist
      partialize: (state) => ({
        profiles: state.profiles,
        activeProfileId: state.activeProfileId,
      }),
    }
  )
);
