/**
 * Profile Store 단위 테스트
 * Requirements: 3.7, 9.1, 9.2, 9.3, 9.4, 9.5, 9.6
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useProfileStore } from '@/stores/profile-store';
import type { ProfileData } from '@/types';

// ---------------------------------------------------------------------------
// 테스트 픽스처
// ---------------------------------------------------------------------------

const makeProfile = (overrides: Partial<ProfileData> = {}): ProfileData => ({
  id: 'profile-001',
  userId: 'user-001',
  name: '홍길동',
  title: '프론트엔드 개발자',
  bio: '열정적인 개발자입니다.',
  email: 'hong@example.com',
  skills: ['TypeScript', 'React'],
  githubUrl: 'https://github.com/hong',
  projects: [],
  experiences: [],
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  ...overrides,
});

// ---------------------------------------------------------------------------
// 테스트
// ---------------------------------------------------------------------------

describe('Profile Store', () => {
  beforeEach(() => {
    useProfileStore.setState({ profiles: [], activeProfileId: null });
  });

  // -------------------------------------------------------------------------
  // 초기 상태
  // -------------------------------------------------------------------------
  describe('초기 상태', () => {
    it('profiles는 빈 배열이어야 한다', () => {
      const { profiles } = useProfileStore.getState();
      expect(profiles).toEqual([]);
    });

    it('activeProfileId는 null이어야 한다', () => {
      const { activeProfileId } = useProfileStore.getState();
      expect(activeProfileId).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // saveProfile
  // -------------------------------------------------------------------------
  describe('saveProfile()', () => {
    it('새 프로필을 profiles 배열에 추가해야 한다', () => {
      const { saveProfile } = useProfileStore.getState();
      const input = {
        userId: 'user-001',
        name: '홍길동',
        title: '개발자',
        bio: '자기소개',
        email: 'hong@example.com',
        skills: ['React'],
        githubUrl: 'https://github.com/hong',
        projects: [],
        experiences: [],
      };

      saveProfile(input);

      const { profiles } = useProfileStore.getState();
      expect(profiles).toHaveLength(1);
      expect(profiles[0].name).toBe('홍길동');
    });

    it('반환된 프로필은 자동 생성된 id, createdAt, updatedAt을 가져야 한다', () => {
      const { saveProfile } = useProfileStore.getState();
      const profile = saveProfile({
        userId: 'user-001',
        name: '테스트',
        title: '',
        bio: '',
        email: 'test@example.com',
        skills: [],
        githubUrl: '',
        projects: [],
        experiences: [],
      });

      expect(profile.id).toBeTruthy();
      expect(profile.createdAt).toBeTruthy();
      expect(profile.updatedAt).toBeTruthy();
      // ISO 8601 형식 확인
      expect(new Date(profile.createdAt).toISOString()).toBe(profile.createdAt);
    });

    it('여러 프로필을 저장할 수 있어야 한다', () => {
      const { saveProfile } = useProfileStore.getState();
      saveProfile({
        userId: 'user-001',
        name: '첫번째',
        title: '',
        bio: '',
        email: 'a@example.com',
        skills: [],
        githubUrl: '',
        projects: [],
        experiences: [],
      });
      saveProfile({
        userId: 'user-002',
        name: '두번째',
        title: '',
        bio: '',
        email: 'b@example.com',
        skills: [],
        githubUrl: '',
        projects: [],
        experiences: [],
      });

      const { profiles } = useProfileStore.getState();
      expect(profiles).toHaveLength(2);
    });

    it('각 저장된 프로필은 고유한 id를 가져야 한다', () => {
      const { saveProfile } = useProfileStore.getState();
      const p1 = saveProfile({
        userId: 'u1',
        name: 'A',
        title: '',
        bio: '',
        email: 'a@example.com',
        skills: [],
        githubUrl: '',
        projects: [],
        experiences: [],
      });
      const p2 = saveProfile({
        userId: 'u2',
        name: 'B',
        title: '',
        bio: '',
        email: 'b@example.com',
        skills: [],
        githubUrl: '',
        projects: [],
        experiences: [],
      });

      expect(p1.id).not.toBe(p2.id);
    });
  });

  // -------------------------------------------------------------------------
  // updateProfile
  // -------------------------------------------------------------------------
  describe('updateProfile()', () => {
    it('지정된 필드만 업데이트해야 한다', () => {
      const { saveProfile, updateProfile } = useProfileStore.getState();
      const profile = saveProfile({
        userId: 'user-001',
        name: '홍길동',
        title: '개발자',
        bio: '',
        email: 'hong@example.com',
        skills: [],
        githubUrl: '',
        projects: [],
        experiences: [],
      });

      updateProfile(profile.id, { name: '홍길동(수정)', title: '시니어 개발자' });

      const { profiles } = useProfileStore.getState();
      const updated = profiles.find((p) => p.id === profile.id);
      expect(updated?.name).toBe('홍길동(수정)');
      expect(updated?.title).toBe('시니어 개발자');
      expect(updated?.email).toBe('hong@example.com'); // 변경되지 않음
    });

    it('updatedAt이 갱신되어야 한다', async () => {
      const { saveProfile, updateProfile } = useProfileStore.getState();
      const profile = saveProfile({
        userId: 'user-001',
        name: '홍길동',
        title: '',
        bio: '',
        email: 'hong@example.com',
        skills: [],
        githubUrl: '',
        projects: [],
        experiences: [],
      });

      // 약간의 시간 지연
      await new Promise((r) => setTimeout(r, 5));
      updateProfile(profile.id, { title: '시니어' });

      const { profiles } = useProfileStore.getState();
      const updated = profiles.find((p) => p.id === profile.id);
      expect(updated?.updatedAt).not.toBe(profile.updatedAt);
    });

    it('createdAt은 변경되지 않아야 한다', () => {
      const { saveProfile, updateProfile } = useProfileStore.getState();
      const profile = saveProfile({
        userId: 'user-001',
        name: '홍길동',
        title: '',
        bio: '',
        email: 'hong@example.com',
        skills: [],
        githubUrl: '',
        projects: [],
        experiences: [],
      });

      updateProfile(profile.id, { name: '수정된 이름' });

      const { profiles } = useProfileStore.getState();
      const updated = profiles.find((p) => p.id === profile.id);
      expect(updated?.createdAt).toBe(profile.createdAt);
    });

    it('존재하지 않는 id로 업데이트해도 오류가 발생하지 않아야 한다', () => {
      const { updateProfile } = useProfileStore.getState();
      expect(() => updateProfile('non-existent-id', { name: '테스트' })).not.toThrow();
    });
  });

  // -------------------------------------------------------------------------
  // deleteProfile
  // -------------------------------------------------------------------------
  describe('deleteProfile()', () => {
    it('지정된 id의 프로필을 삭제해야 한다', () => {
      const { saveProfile, deleteProfile } = useProfileStore.getState();
      const profile = saveProfile({
        userId: 'u1',
        name: '삭제될 프로필',
        title: '',
        bio: '',
        email: 'del@example.com',
        skills: [],
        githubUrl: '',
        projects: [],
        experiences: [],
      });

      deleteProfile(profile.id);

      const { profiles } = useProfileStore.getState();
      expect(profiles.find((p) => p.id === profile.id)).toBeUndefined();
    });

    it('삭제 후 나머지 프로필은 유지되어야 한다', () => {
      const { saveProfile, deleteProfile } = useProfileStore.getState();
      const p1 = saveProfile({
        userId: 'u1',
        name: 'A',
        title: '',
        bio: '',
        email: 'a@example.com',
        skills: [],
        githubUrl: '',
        projects: [],
        experiences: [],
      });
      const p2 = saveProfile({
        userId: 'u2',
        name: 'B',
        title: '',
        bio: '',
        email: 'b@example.com',
        skills: [],
        githubUrl: '',
        projects: [],
        experiences: [],
      });

      deleteProfile(p1.id);

      const { profiles } = useProfileStore.getState();
      expect(profiles).toHaveLength(1);
      expect(profiles[0].id).toBe(p2.id);
    });

    it('삭제된 프로필이 activeProfileId이면 null로 초기화해야 한다', () => {
      const { saveProfile, deleteProfile, setActiveProfile } = useProfileStore.getState();
      const profile = saveProfile({
        userId: 'u1',
        name: '활성 프로필',
        title: '',
        bio: '',
        email: 'a@example.com',
        skills: [],
        githubUrl: '',
        projects: [],
        experiences: [],
      });
      setActiveProfile(profile.id);

      deleteProfile(profile.id);

      const { activeProfileId } = useProfileStore.getState();
      expect(activeProfileId).toBeNull();
    });

    it('삭제된 프로필이 activeProfileId가 아니면 activeProfileId는 유지되어야 한다', () => {
      const { saveProfile, deleteProfile, setActiveProfile } = useProfileStore.getState();
      const p1 = saveProfile({
        userId: 'u1',
        name: 'A',
        title: '',
        bio: '',
        email: 'a@example.com',
        skills: [],
        githubUrl: '',
        projects: [],
        experiences: [],
      });
      const p2 = saveProfile({
        userId: 'u2',
        name: 'B',
        title: '',
        bio: '',
        email: 'b@example.com',
        skills: [],
        githubUrl: '',
        projects: [],
        experiences: [],
      });
      setActiveProfile(p2.id);

      deleteProfile(p1.id);

      const { activeProfileId } = useProfileStore.getState();
      expect(activeProfileId).toBe(p2.id);
    });
  });

  // -------------------------------------------------------------------------
  // exportToJSON
  // -------------------------------------------------------------------------
  describe('exportToJSON()', () => {
    it('프로필 데이터를 유효한 JSON 문자열로 직렬화해야 한다', () => {
      const { saveProfile, exportToJSON } = useProfileStore.getState();
      const profile = saveProfile({
        userId: 'u1',
        name: '홍길동',
        title: '개발자',
        bio: '소개',
        email: 'hong@example.com',
        skills: ['React', 'TypeScript'],
        githubUrl: 'https://github.com/hong',
        projects: [],
        experiences: [],
      });

      const json = exportToJSON(profile.id);

      expect(() => JSON.parse(json)).not.toThrow();
    });

    it('직렬화된 JSON에 원본 ProfileData의 모든 필드가 포함되어야 한다', () => {
      const { saveProfile, exportToJSON } = useProfileStore.getState();
      const profile = saveProfile({
        userId: 'u1',
        name: '홍길동',
        title: '개발자',
        bio: '소개',
        email: 'hong@example.com',
        skills: ['React'],
        githubUrl: 'https://github.com/hong',
        projects: [],
        experiences: [],
      });

      const json = exportToJSON(profile.id);
      const parsed = JSON.parse(json) as ProfileData;

      expect(parsed.id).toBe(profile.id);
      expect(parsed.name).toBe('홍길동');
      expect(parsed.email).toBe('hong@example.com');
      expect(parsed.skills).toEqual(['React']);
    });

    it('존재하지 않는 profileId로 호출 시 오류를 던져야 한다', () => {
      const { exportToJSON } = useProfileStore.getState();
      expect(() => exportToJSON('non-existent')).toThrow();
    });
  });

  // -------------------------------------------------------------------------
  // importFromJSON
  // -------------------------------------------------------------------------
  describe('importFromJSON()', () => {
    describe('성공 케이스', () => {
      it('유효한 JSON을 가져오면 { success: true, profile } 를 반환해야 한다', () => {
        const profile = makeProfile();
        const { importFromJSON } = useProfileStore.getState();

        const result = importFromJSON(JSON.stringify(profile));

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.profile.id).toBe(profile.id);
        }
      });

      it('가져온 프로필이 profiles 배열에 추가되어야 한다', () => {
        const profile = makeProfile();
        const { importFromJSON } = useProfileStore.getState();

        importFromJSON(JSON.stringify(profile));

        const { profiles } = useProfileStore.getState();
        expect(profiles.find((p) => p.id === profile.id)).toBeDefined();
      });

      it('같은 id의 프로필이 있을 경우 교체해야 한다', () => {
        const original = makeProfile({ name: '원본 이름' });
        useProfileStore.setState({ profiles: [original] });

        const updated = makeProfile({ name: '수정된 이름' });
        const { importFromJSON } = useProfileStore.getState();

        importFromJSON(JSON.stringify(updated));

        const { profiles } = useProfileStore.getState();
        expect(profiles).toHaveLength(1);
        expect(profiles[0].name).toBe('수정된 이름');
      });
    });

    describe('실패 케이스 - JSON 파싱 오류', () => {
      it('구문 오류가 있는 JSON에 대해 { success: false, error: "invalid_json" } 을 반환해야 한다', () => {
        const { importFromJSON } = useProfileStore.getState();

        const result = importFromJSON('{ not valid json }');

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBe('invalid_json');
        }
      });

      it('빈 문자열에 대해 invalid_json 오류를 반환해야 한다', () => {
        const { importFromJSON } = useProfileStore.getState();

        const result = importFromJSON('');

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBe('invalid_json');
        }
      });

      it('JSON 파싱 실패 시 기존 상태를 변경하지 않아야 한다', () => {
        const existing = makeProfile({ id: 'existing-001', name: '기존 프로필' });
        useProfileStore.setState({ profiles: [existing] });

        const { importFromJSON } = useProfileStore.getState();
        importFromJSON('{ bad json');

        const { profiles } = useProfileStore.getState();
        expect(profiles).toHaveLength(1);
        expect(profiles[0].name).toBe('기존 프로필');
      });
    });

    describe('실패 케이스 - 스키마 검증 오류', () => {
      it('필수 필드 누락 시 { success: false, error: "missing_fields" } 를 반환해야 한다', () => {
        const { importFromJSON } = useProfileStore.getState();
        const invalidData = { id: 'x', userId: 'u', title: '개발자' }; // name 누락

        const result = importFromJSON(JSON.stringify(invalidData));

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBe('missing_fields');
        }
      });

      it('스키마 검증 실패 시 기존 상태를 변경하지 않아야 한다 (Requirements: 9.4, 9.5, 9.6)', () => {
        const existing = makeProfile({ id: 'guard-001', name: '보존될 프로필' });
        useProfileStore.setState({ profiles: [existing] });

        const { importFromJSON } = useProfileStore.getState();
        importFromJSON(JSON.stringify({ id: 'new', name: '' })); // 빈 name - 검증 실패

        const { profiles } = useProfileStore.getState();
        expect(profiles).toHaveLength(1);
        expect(profiles[0].name).toBe('보존될 프로필');
      });

      it('null 값이 포함된 JSON에 대해 missing_fields 오류를 반환해야 한다', () => {
        const { importFromJSON } = useProfileStore.getState();

        const result = importFromJSON('null');

        expect(result.success).toBe(false);
      });
    });
  });

  // -------------------------------------------------------------------------
  // setActiveProfile
  // -------------------------------------------------------------------------
  describe('setActiveProfile()', () => {
    it('activeProfileId를 지정된 id로 설정해야 한다', () => {
      const { setActiveProfile } = useProfileStore.getState();
      setActiveProfile('profile-abc');

      const { activeProfileId } = useProfileStore.getState();
      expect(activeProfileId).toBe('profile-abc');
    });

    it('null로 설정할 수 있어야 한다', () => {
      const { setActiveProfile } = useProfileStore.getState();
      setActiveProfile('profile-abc');
      setActiveProfile(null);

      const { activeProfileId } = useProfileStore.getState();
      expect(activeProfileId).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // persist 스토리지 키
  // -------------------------------------------------------------------------
  describe('persist 스토리지 키', () => {
    it('스토리지 키가 cupol_profile_data이어야 한다', () => {
      const storeName = useProfileStore.persist.getOptions().name;
      expect(storeName).toBe('cupol_profile_data');
    });
  });

  // -------------------------------------------------------------------------
  // exportToJSON + importFromJSON 라운드트립
  // -------------------------------------------------------------------------
  describe('JSON 라운드트립', () => {
    it('export 후 import하면 원본 프로필과 동일해야 한다 (Requirements: 9.1, 9.2, 9.3)', () => {
      const { saveProfile, exportToJSON, importFromJSON } = useProfileStore.getState();
      const original = saveProfile({
        userId: 'u1',
        name: '라운드트립 테스트',
        title: '개발자',
        bio: '바이오',
        email: 'round@example.com',
        skills: ['TypeScript', 'Next.js'],
        githubUrl: 'https://github.com/test',
        projects: [
          {
            id: 'proj-1',
            title: '사이드 프로젝트',
            description: '설명',
            url: 'https://example.com',
            technologies: ['React'],
          },
        ],
        experiences: [
          {
            id: 'exp-1',
            company: '테크 회사',
            position: '개발자',
            startDate: '2022-01',
            endDate: '2023-12',
            description: '업무 설명',
          },
        ],
      });

      // 다른 스토어 상태로 교체
      useProfileStore.setState({ profiles: [] });

      const jsonStr = JSON.stringify(original);
      const result = importFromJSON(jsonStr);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.profile).toEqual(original);
      }
    });
  });
});
