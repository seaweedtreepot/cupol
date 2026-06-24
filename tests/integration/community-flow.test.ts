/**
 * 커뮤니티 탐색 흐름 통합 테스트
 *
 * 스토어 레이어를 사용하는 통합 테스트 (UI 렌더링 없음)
 *
 * 테스트 대상 흐름:
 *   1. 공개 프로필 목록 설정 (setPublicProfiles)
 *   2. 직함(role) 필터 적용 (setFilter + getFilteredProfiles)
 *   3. 기술 스택(skill) 필터 적용
 *   4. 페이지네이션 (15개 프로필 → 1페이지 12개, 2페이지 3개)
 *   5. 커피챗 요청 (addChatRequest + getChatRequestsForUser + updateChatRequestStatus)
 *   6. 수락된 요청에 respondedAt이 설정되었는지 검증
 *
 * Requirements: 전체 통합 흐름
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useCommunityStore } from '@/stores/community-store';
import type { PublicProfileCardExtended } from '@/stores/community-store';
import type { ChatRequest } from '@/types';

// ---------------------------------------------------------------------------
// 테스트 픽스처 헬퍼
// ---------------------------------------------------------------------------

/** 공개 프로필 카드 생성 헬퍼 */
const makeProfile = (
  overrides: Partial<PublicProfileCardExtended> = {}
): PublicProfileCardExtended => ({
  userId: `user-${Math.random().toString(36).slice(2, 7)}`,
  name: '테스트 사용자',
  title: '프론트엔드 개발자',
  profileImage: '',
  skills: ['TypeScript', 'React'],
  portfolioCount: 1,
  company: '테크 컴퍼니',
  ...overrides,
});

/** 커피챗 요청 생성 헬퍼 */
const makeChatRequest = (
  overrides: Partial<ChatRequest> = {}
): ChatRequest => ({
  id: `req-${Math.random().toString(36).slice(2, 7)}`,
  fromUserId: 'sender-001',
  toUserId: 'receiver-001',
  requesterName: '홍길동',
  requesterEmail: 'hong@example.com',
  requesterOrganization: '테크 스타트업',
  message: '커피챗 요청합니다!',
  status: 'pending',
  createdAt: new Date().toISOString(),
  ...overrides,
});

// ---------------------------------------------------------------------------
// 15개 프로필 시드 데이터
// ---------------------------------------------------------------------------

const SEED_PROFILES: PublicProfileCardExtended[] = [
  makeProfile({ userId: 'user-01', name: '사용자01', title: 'React 개발자', skills: ['React', 'TypeScript'], company: '알파 컴퍼니' }),
  makeProfile({ userId: 'user-02', name: '사용자02', title: 'Vue 개발자', skills: ['Vue', 'JavaScript'], company: '베타 컴퍼니' }),
  makeProfile({ userId: 'user-03', name: '사용자03', title: 'React 개발자', skills: ['React', 'Next.js', 'TypeScript'], company: '알파 컴퍼니' }),
  makeProfile({ userId: 'user-04', name: '사용자04', title: '백엔드 개발자', skills: ['Node.js', 'TypeScript'], company: '감마 컴퍼니' }),
  makeProfile({ userId: 'user-05', name: '사용자05', title: 'React 개발자', skills: ['React', 'Redux'], company: '델타 컴퍼니' }),
  makeProfile({ userId: 'user-06', name: '사용자06', title: '풀스택 개발자', skills: ['TypeScript', 'React', 'Node.js'], company: '베타 컴퍼니' }),
  makeProfile({ userId: 'user-07', name: '사용자07', title: 'React 개발자', skills: ['React', 'TypeScript'], company: '엡실론 컴퍼니' }),
  makeProfile({ userId: 'user-08', name: '사용자08', title: '모바일 개발자', skills: ['React Native', 'TypeScript'], company: '제타 컴퍼니' }),
  makeProfile({ userId: 'user-09', name: '사용자09', title: 'Angular 개발자', skills: ['Angular', 'TypeScript'], company: '에타 컴퍼니' }),
  makeProfile({ userId: 'user-10', name: '사용자10', title: '프론트엔드 개발자', skills: ['JavaScript', 'CSS'], company: '세타 컴퍼니' }),
  makeProfile({ userId: 'user-11', name: '사용자11', title: 'React 개발자', skills: ['React', 'GraphQL'], company: '요타 컴퍼니' }),
  makeProfile({ userId: 'user-12', name: '사용자12', title: '데이터 엔지니어', skills: ['Python', 'SQL'], company: '카파 컴퍼니' }),
  makeProfile({ userId: 'user-13', name: '사용자13', title: 'React 개발자', skills: ['React', 'TypeScript', 'Webpack'], company: '람다 컴퍼니' }),
  makeProfile({ userId: 'user-14', name: '사용자14', title: 'DevOps 엔지니어', skills: ['Docker', 'Kubernetes'], company: '뮤 컴퍼니' }),
  makeProfile({ userId: 'user-15', name: '사용자15', title: 'React 개발자', skills: ['React', 'Vite'], company: '뉴 컴퍼니' }),
];

// ---------------------------------------------------------------------------
// 테스트
// ---------------------------------------------------------------------------

describe('커뮤니티 탐색 통합 흐름', () => {
  // 각 테스트 전에 스토어 초기화
  beforeEach(() => {
    useCommunityStore.setState({
      publicProfiles: [],
      filter: { page: 1, pageSize: 12 },
      chatRequests: [],
    });
  });

  // -------------------------------------------------------------------------
  // Step 1: 공개 프로필 목록 설정
  // -------------------------------------------------------------------------
  describe('1단계: 공개 프로필 목록 설정', () => {
    it('setPublicProfiles()가 publicProfiles를 설정해야 한다', () => {
      const { setPublicProfiles } = useCommunityStore.getState();
      setPublicProfiles(SEED_PROFILES);

      const { publicProfiles } = useCommunityStore.getState();
      expect(publicProfiles).toHaveLength(15);
    });

    it('setPublicProfiles()가 기존 프로필을 교체해야 한다', () => {
      const { setPublicProfiles } = useCommunityStore.getState();
      setPublicProfiles(SEED_PROFILES);
      setPublicProfiles([SEED_PROFILES[0]]);

      const { publicProfiles } = useCommunityStore.getState();
      expect(publicProfiles).toHaveLength(1);
    });
  });

  // -------------------------------------------------------------------------
  // Step 2: 직함(role) 필터
  // -------------------------------------------------------------------------
  describe('2단계: 직함(role) 필터', () => {
    beforeEach(() => {
      useCommunityStore.getState().setPublicProfiles(SEED_PROFILES);
    });

    it('role 필터가 title과 부분 일치하는 프로필만 반환해야 한다 (Requirements: 8.2)', () => {
      const { setFilter, getFilteredProfiles } = useCommunityStore.getState();
      setFilter({ role: 'React' });

      const results = getFilteredProfiles();

      expect(results.length).toBeGreaterThan(0);
      results.forEach((profile) => {
        expect(profile.title.toLowerCase()).toContain('react');
      });
    });

    it('role 필터가 대소문자를 구분하지 않아야 한다', () => {
      const { setFilter, getFilteredProfiles } = useCommunityStore.getState();
      setFilter({ role: 'REACT' });
      const upperResults = getFilteredProfiles();

      setFilter({ role: 'react' });
      const lowerResults = getFilteredProfiles();

      expect(upperResults.length).toBe(lowerResults.length);
    });

    it('존재하지 않는 role로 필터링하면 빈 배열을 반환해야 한다', () => {
      const { setFilter, getFilteredProfiles } = useCommunityStore.getState();
      setFilter({ role: '존재하지않는직함XXXXXX' });

      const results = getFilteredProfiles();
      expect(results).toHaveLength(0);
    });

    it('role 필터 변경 시 page가 1로 초기화되어야 한다', () => {
      const { setFilter } = useCommunityStore.getState();
      setFilter({ page: 3 });
      setFilter({ role: 'React' });

      const { filter } = useCommunityStore.getState();
      expect(filter.page).toBe(1);
    });
  });

  // -------------------------------------------------------------------------
  // Step 3: 기술 스택(skill) 필터
  // -------------------------------------------------------------------------
  describe('3단계: 기술 스택(skill) 필터', () => {
    beforeEach(() => {
      useCommunityStore.getState().setPublicProfiles(SEED_PROFILES);
    });

    it('skill 필터가 skills 배열에 부분 일치하는 프로필만 반환해야 한다 (Requirements: 8.4)', () => {
      const { setFilter, getFilteredProfiles } = useCommunityStore.getState();
      setFilter({ skill: 'TypeScript' });

      const results = getFilteredProfiles();

      expect(results.length).toBeGreaterThan(0);
      results.forEach((profile) => {
        const hasSkill = profile.skills.some((s) =>
          s.toLowerCase().includes('typescript')
        );
        expect(hasSkill).toBe(true);
      });
    });

    it('skill 필터가 대소문자를 구분하지 않아야 한다', () => {
      const { setFilter, getFilteredProfiles } = useCommunityStore.getState();
      setFilter({ skill: 'typescript' });
      const lower = getFilteredProfiles();

      setFilter({ skill: 'TYPESCRIPT' });
      const upper = getFilteredProfiles();

      expect(lower.length).toBe(upper.length);
    });

    it('TypeScript를 보유하지 않은 프로필은 TypeScript 필터에서 제외되어야 한다', () => {
      const { setFilter, getFilteredProfiles } = useCommunityStore.getState();
      setFilter({ skill: 'TypeScript' });

      const results = getFilteredProfiles();
      const excluded = results.filter(
        (p) => !p.skills.some((s) => s.toLowerCase().includes('typescript'))
      );
      expect(excluded).toHaveLength(0);
    });

    it('skill 필터 변경 시 page가 1로 초기화되어야 한다', () => {
      const { setFilter } = useCommunityStore.getState();
      setFilter({ page: 2 });
      setFilter({ skill: 'TypeScript' });

      const { filter } = useCommunityStore.getState();
      expect(filter.page).toBe(1);
    });
  });

  // -------------------------------------------------------------------------
  // Step 4: 페이지네이션
  // -------------------------------------------------------------------------
  describe('4단계: 페이지네이션 (Requirements: 8.1)', () => {
    beforeEach(() => {
      useCommunityStore.getState().setPublicProfiles(SEED_PROFILES);
      // 필터 초기화 (모든 프로필이 조회되도록)
      useCommunityStore.getState().setFilter({ role: undefined, skill: undefined, company: undefined });
    });

    it('1페이지는 최대 12개 프로필을 반환해야 한다', () => {
      const { setFilter, getPaginatedProfiles } = useCommunityStore.getState();
      setFilter({ page: 1 });

      const page1 = getPaginatedProfiles();
      expect(page1).toHaveLength(12);
    });

    it('2페이지는 나머지 3개 프로필을 반환해야 한다', () => {
      const { setFilter, getPaginatedProfiles } = useCommunityStore.getState();
      setFilter({ page: 2 });

      const page2 = getPaginatedProfiles();
      expect(page2).toHaveLength(3);
    });

    it('getTotalPages()가 올바른 전체 페이지 수를 반환해야 한다', () => {
      const { getTotalPages } = useCommunityStore.getState();

      expect(getTotalPages()).toBe(2); // ceil(15/12) = 2
    });

    it('1페이지와 2페이지의 프로필이 중복되지 않아야 한다', () => {
      const { setFilter, getPaginatedProfiles } = useCommunityStore.getState();

      setFilter({ page: 1 });
      const page1 = getPaginatedProfiles();

      setFilter({ page: 2 });
      const page2 = getPaginatedProfiles();

      const page1Ids = new Set(page1.map((p) => p.userId));
      const overlap = page2.filter((p) => page1Ids.has(p.userId));
      expect(overlap).toHaveLength(0);
    });

    it('12개 이하 프로필이면 총 페이지 수가 1이어야 한다', () => {
      const { setPublicProfiles, getTotalPages } = useCommunityStore.getState();
      setPublicProfiles(SEED_PROFILES.slice(0, 5));

      expect(getTotalPages()).toBe(1);
    });

    it('프로필이 없으면 총 페이지 수가 1이어야 한다 (빈 상태 기본값)', () => {
      const { setPublicProfiles, getTotalPages } = useCommunityStore.getState();
      setPublicProfiles([]);

      expect(getTotalPages()).toBe(1);
    });

    it('한 페이지 결과는 최대 12개를 초과하지 않아야 한다 (Requirements: 8.1)', () => {
      const { getPaginatedProfiles } = useCommunityStore.getState();

      const results = getPaginatedProfiles();
      expect(results.length).toBeLessThanOrEqual(12);
    });
  });

  // -------------------------------------------------------------------------
  // Step 5 & 6: 커피챗 요청 및 상태 변경
  // -------------------------------------------------------------------------
  describe('5~6단계: 커피챗 요청 흐름', () => {
    it('addChatRequest()가 요청을 chatRequests에 추가해야 한다', () => {
      const { addChatRequest } = useCommunityStore.getState();
      const request = makeChatRequest({ id: 'req-001', toUserId: 'receiver-001' });

      addChatRequest(request);

      const { chatRequests } = useCommunityStore.getState();
      expect(chatRequests).toHaveLength(1);
      expect(chatRequests[0].id).toBe('req-001');
    });

    it('getChatRequestsForUser()가 특정 사용자의 요청만 반환해야 한다', () => {
      const { addChatRequest, getChatRequestsForUser } = useCommunityStore.getState();

      addChatRequest(makeChatRequest({ id: 'req-A', toUserId: 'user-A', fromUserId: 'sender-1' }));
      addChatRequest(makeChatRequest({ id: 'req-B', toUserId: 'user-B', fromUserId: 'sender-2' }));
      addChatRequest(makeChatRequest({ id: 'req-C', toUserId: 'user-A', fromUserId: 'sender-3' }));

      const userARequests = getChatRequestsForUser('user-A');
      expect(userARequests).toHaveLength(2);
      userARequests.forEach((req) => expect(req.toUserId).toBe('user-A'));
    });

    it('updateChatRequestStatus()가 상태를 "accepted"로 변경해야 한다', () => {
      const { addChatRequest, updateChatRequestStatus, getChatRequestsForUser } =
        useCommunityStore.getState();

      const request = makeChatRequest({ id: 'req-accept', toUserId: 'receiver-001', status: 'pending' });
      addChatRequest(request);

      updateChatRequestStatus('req-accept', 'accepted');

      const requests = getChatRequestsForUser('receiver-001');
      const updated = requests.find((r) => r.id === 'req-accept');
      expect(updated?.status).toBe('accepted');
    });

    it('수락된 요청에 respondedAt이 설정되어야 한다 (Requirements: 8.15)', () => {
      const { addChatRequest, updateChatRequestStatus } = useCommunityStore.getState();
      const request = makeChatRequest({ id: 'req-with-time', toUserId: 'receiver-001' });
      addChatRequest(request);

      const beforeUpdate = new Date().toISOString();
      updateChatRequestStatus('req-with-time', 'accepted');

      const { chatRequests } = useCommunityStore.getState();
      const updated = chatRequests.find((r) => r.id === 'req-with-time');

      expect(updated?.respondedAt).toBeDefined();
      expect(updated?.respondedAt).toBeTruthy();
      // respondedAt이 유효한 ISO 날짜 형식인지 확인
      expect(new Date(updated!.respondedAt!).toISOString()).toBe(updated!.respondedAt);
      // beforeUpdate 이후 시각이어야 함
      expect(updated!.respondedAt! >= beforeUpdate).toBe(true);
    });

    it('거절된 요청에도 respondedAt이 설정되어야 한다', () => {
      const { addChatRequest, updateChatRequestStatus } = useCommunityStore.getState();
      const request = makeChatRequest({ id: 'req-reject', toUserId: 'receiver-001' });
      addChatRequest(request);

      updateChatRequestStatus('req-reject', 'rejected');

      const { chatRequests } = useCommunityStore.getState();
      const updated = chatRequests.find((r) => r.id === 'req-reject');
      expect(updated?.status).toBe('rejected');
      expect(updated?.respondedAt).toBeTruthy();
    });

    it('다른 요청의 상태는 변경되지 않아야 한다', () => {
      const { addChatRequest, updateChatRequestStatus } = useCommunityStore.getState();

      const req1 = makeChatRequest({ id: 'req-001', toUserId: 'receiver-001', status: 'pending' });
      const req2 = makeChatRequest({ id: 'req-002', toUserId: 'receiver-001', status: 'pending' });
      addChatRequest(req1);
      addChatRequest(req2);

      updateChatRequestStatus('req-001', 'accepted');

      const { chatRequests } = useCommunityStore.getState();
      const untouched = chatRequests.find((r) => r.id === 'req-002');
      expect(untouched?.status).toBe('pending');
      expect(untouched?.respondedAt).toBeUndefined();
    });
  });

  // -------------------------------------------------------------------------
  // 전체 흐름 통합 시나리오
  // -------------------------------------------------------------------------
  describe('전체 커뮤니티 탐색 흐름 시나리오', () => {
    it('프로필 설정 → 필터 → 페이지네이션 → 커피챗 요청 → 수락 전체 흐름이 성공해야 한다', () => {
      const {
        setPublicProfiles,
        setFilter,
        getFilteredProfiles,
        getPaginatedProfiles,
        getTotalPages,
        addChatRequest,
        getChatRequestsForUser,
        updateChatRequestStatus,
      } = useCommunityStore.getState();

      // 1. 15개 공개 프로필 설정
      setPublicProfiles(SEED_PROFILES);
      expect(useCommunityStore.getState().publicProfiles).toHaveLength(15);

      // 2. React 직함 필터
      setFilter({ role: 'React' });
      const reactDevs = getFilteredProfiles();
      expect(reactDevs.length).toBeGreaterThan(0);
      reactDevs.forEach((p) => expect(p.title.toLowerCase()).toContain('react'));

      // 3. TypeScript 기술 스택 필터 추가
      setFilter({ skill: 'TypeScript' });
      const filtered = getFilteredProfiles();
      // React AND TypeScript 보유자만
      filtered.forEach((p) => {
        expect(p.title.toLowerCase()).toContain('react');
        expect(p.skills.some((s) => s.toLowerCase().includes('typescript'))).toBe(true);
      });

      // 4. 필터 초기화 후 페이지네이션 확인
      setFilter({ role: undefined, skill: undefined });
      setFilter({ page: 1 });
      const page1 = getPaginatedProfiles();
      expect(page1.length).toBeLessThanOrEqual(12);
      expect(getTotalPages()).toBe(2);

      // 5. 프로필 선택 → 커피챗 요청
      const targetUser = SEED_PROFILES[0];
      const request = makeChatRequest({
        id: 'chat-flow-001',
        fromUserId: 'current-user',
        toUserId: targetUser.userId,
        message: '안녕하세요! 커피챗 요청드립니다.',
      });
      addChatRequest(request);

      const inboxRequests = getChatRequestsForUser(targetUser.userId);
      expect(inboxRequests).toHaveLength(1);
      expect(inboxRequests[0].status).toBe('pending');

      // 6. 요청 수락 → respondedAt 확인
      updateChatRequestStatus('chat-flow-001', 'accepted');

      const acceptedRequests = getChatRequestsForUser(targetUser.userId);
      const accepted = acceptedRequests.find((r) => r.id === 'chat-flow-001');
      expect(accepted?.status).toBe('accepted');
      expect(accepted?.respondedAt).toBeTruthy();
    });
  });
});
