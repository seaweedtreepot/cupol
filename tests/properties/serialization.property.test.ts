/**
 * Property-Based Tests: Profile Store JSON 직렬화
 *
 * Feature: portfolio-generator
 *
 * Property 1: ProfileData JSON 직렬화 라운드트립
 *   Feature: portfolio-generator, Property 1: ProfileData JSON 직렬화 라운드트립
 *   Validates: Requirements 9.1, 9.2, 9.3
 *
 * Property 2: 잘못된 JSON 가져오기 시 상태 보존
 *   Feature: portfolio-generator, Property 2: 잘못된 JSON 가져오기 시 상태 보존
 *   Validates: Requirements 9.4, 9.5, 9.6
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { useProfileStore } from '@/stores/profile-store';

// ---------------------------------------------------------------------------
// 헬퍼: 테스트 전 store 초기화
// ---------------------------------------------------------------------------

function resetStore() {
  useProfileStore.setState({ profiles: [], activeProfileId: null });
}

// ---------------------------------------------------------------------------
// fast-check 아비트러리: 유효한 ProfileData 생성
// ---------------------------------------------------------------------------

/** 유효한 이메일 아비트러리 */
const validEmail = () =>
  fc
    .tuple(
      fc.stringMatching(/^[a-zA-Z0-9._+-]{1,15}$/),
      fc.stringMatching(/^[a-zA-Z0-9-]{1,10}$/),
      fc.stringMatching(/^[a-zA-Z]{2,5}$/)
    )
    .map(([local, domain, tld]) => `${local}@${domain}.${tld}`);

/** 유효한 http/https URL 아비트러리 */
const validUrl = () =>
  fc
    .tuple(
      fc.constantFrom('http', 'https'),
      fc.stringMatching(/^[a-zA-Z0-9-]{1,20}$/),
      fc.stringMatching(/^[a-zA-Z]{2,5}$/)
    )
    .map(([protocol, host, tld]) => `${protocol}://${host}.${tld}`);

/** 빈 문자열 또는 유효한 URL (githubUrl 필드 대응) */
const githubUrlArb = () => fc.oneof(fc.constant(''), validUrl());

/** 유효한 ISO 날짜 문자열 (new Date().toISOString() 형태) */
const isoDateArb = () =>
  fc
    .integer({ min: 0, max: Date.now() })
    .map((ms) => new Date(ms).toISOString());

/** Project 아비트러리 */
const projectArb = () =>
  fc.record({
    id: fc.uuid(),
    title: fc.string({ minLength: 1, maxLength: 100 }),
    description: fc.string({ minLength: 0, maxLength: 1000 }),
    url: fc.oneof(fc.constant(''), validUrl()),
    technologies: fc.array(fc.string({ minLength: 1, maxLength: 30 }), {
      minLength: 0,
      maxLength: 10,
    }),
  });

/** Experience 아비트러리 */
const experienceArb = () =>
  fc.record({
    id: fc.uuid(),
    company: fc.string({ minLength: 1, maxLength: 50 }),
    position: fc.string({ minLength: 1, maxLength: 50 }),
    startDate: fc.stringMatching(/^\d{4}-(0[1-9]|1[0-2])$/),
    endDate: fc.oneof(
      fc.constant('present'),
      fc.stringMatching(/^\d{4}-(0[1-9]|1[0-2])$/)
    ),
    description: fc.string({ minLength: 0, maxLength: 1000 }),
  });

/**
 * 유효한 ProfileData 아비트러리
 *
 * 제약:
 * - name: 최소 1자, 최대 50자, 공백만으로 구성되지 않음
 * - email: 유효한 이메일 형식
 * - githubUrl: 빈 문자열 또는 유효한 http/https URL
 * - skills: 최대 30개
 * - projects: 최대 20개
 * - experiences: 최대 20개
 */
const validProfileDataArb = () =>
  fc
    .record({
      id: fc.uuid(),
      userId: fc.uuid(),
      // name: 비공백 문자 포함, 1~50자
      name: fc
        .tuple(
          fc.string({ minLength: 1, maxLength: 48 }),
          fc.constantFrom('A', 'B', 'C', 'Z') // 공백만인 경우 방지용 non-whitespace 앵커
        )
        .map(([s, anchor]) => (anchor + s).slice(0, 50).trimEnd() || anchor),
      title: fc.string({ minLength: 0, maxLength: 50 }),
      bio: fc.string({ minLength: 0, maxLength: 500 }),
      email: validEmail(),
      skills: fc.array(fc.string({ minLength: 1, maxLength: 20 }), {
        minLength: 0,
        maxLength: 30,
      }),
      githubUrl: githubUrlArb(),
      projects: fc.array(projectArb(), { minLength: 0, maxLength: 20 }),
      experiences: fc.array(experienceArb(), { minLength: 0, maxLength: 20 }),
      createdAt: isoDateArb(),
      updatedAt: isoDateArb(),
    })
    // name이 trim() 후 빈 문자열인 경우 필터링 (Zod refine 조건)
    .filter((p) => p.name.trim().length > 0);

// ---------------------------------------------------------------------------
// Property 1: ProfileData JSON 직렬화 라운드트립
// ---------------------------------------------------------------------------

describe(
  'Feature: portfolio-generator, Property 1: ProfileData JSON 직렬화 라운드트립',
  () => {
    /**
     * Validates: Requirements 9.1, 9.2, 9.3
     *
     * For any valid ProfileData object:
     *   exportToJSON(id) → JSON string → importFromJSON(json) → same ProfileData
     */
    it('유효한 ProfileData를 내보낸 후 가져오면 원본과 동일한 객체가 복원된다', () => {
      fc.assert(
        fc.property(validProfileDataArb(), (profileData) => {
          // 테스트 전 store 초기화
          resetStore();

          const store = useProfileStore.getState();

          // 1. 프로필을 store에 직접 주입 (exportToJSON은 id로 조회)
          useProfileStore.setState({ profiles: [profileData] });

          // 2. 내보내기
          const json = useProfileStore.getState().exportToJSON(profileData.id);

          // 3. store 초기화 후 가져오기
          resetStore();
          const result = useProfileStore.getState().importFromJSON(json);

          // 4. 성공적으로 복원되어야 한다
          expect(result.success).toBe(true);
          if (!result.success) return; // 타입 가드

          // 5. 복원된 데이터가 원본과 동일해야 한다
          expect(result.profile).toEqual(profileData);

          // 6. store의 profiles에 복원된 데이터가 저장되어야 한다
          const stored = useProfileStore
            .getState()
            .profiles.find((p) => p.id === profileData.id);
          expect(stored).toEqual(profileData);
        }),
        { numRuns: 100 }
      );
    });
  }
);

// ---------------------------------------------------------------------------
// Property 2: 잘못된 JSON 가져오기 시 상태 보존
// ---------------------------------------------------------------------------

describe(
  'Feature: portfolio-generator, Property 2: 잘못된 JSON 가져오기 시 상태 보존',
  () => {
    /**
     * Validates: Requirements 9.4, 9.5, 9.6
     *
     * For any invalid JSON string (syntax error or missing/invalid required fields):
     * - importFromJSON returns { success: false }
     * - existing profiles in the store are NOT modified
     */

    /**
     * 구문 오류 JSON 아비트러리
     * 유효한 JSON이 아닌 임의 문자열
     */
    const invalidSyntaxJsonArb = fc
      .string({ minLength: 1, maxLength: 200 })
      .filter((s) => {
        try {
          JSON.parse(s);
          return false; // 파싱 성공하면 제외 (syntax error 케이스가 아님)
        } catch {
          return true;
        }
      });

    /**
     * 유효한 JSON이지만 ProfileData 검증에 실패하는 케이스 아비트러리
     * - name 필드가 없거나 빈 문자열이거나 공백만인 경우
     */
    const invalidProfileJsonArb = fc
      .oneof(
        // name 필드 누락
        fc
          .record({
            id: fc.uuid(),
            userId: fc.uuid(),
            title: fc.string(),
            bio: fc.string(),
            email: validEmail(),
            skills: fc.array(fc.string()),
            githubUrl: fc.constant(''),
            projects: fc.constant([]),
            experiences: fc.constant([]),
            createdAt: isoDateArb(),
            updatedAt: isoDateArb(),
          })
          .map((obj) => JSON.stringify(obj)),

        // name이 빈 문자열
        fc
          .record({
            id: fc.uuid(),
            userId: fc.uuid(),
            name: fc.constant(''),
            title: fc.string(),
            bio: fc.string(),
            email: validEmail(),
            skills: fc.array(fc.string()),
            githubUrl: fc.constant(''),
            projects: fc.constant([]),
            experiences: fc.constant([]),
            createdAt: isoDateArb(),
            updatedAt: isoDateArb(),
          })
          .map((obj) => JSON.stringify(obj)),

        // name이 공백만으로 구성
        fc
          .record({
            id: fc.uuid(),
            userId: fc.uuid(),
            name: fc.stringMatching(/^\s+$/), // 공백만
            title: fc.string(),
            bio: fc.string(),
            email: validEmail(),
            skills: fc.array(fc.string()),
            githubUrl: fc.constant(''),
            projects: fc.constant([]),
            experiences: fc.constant([]),
            createdAt: isoDateArb(),
            updatedAt: isoDateArb(),
          })
          .map((obj) => JSON.stringify(obj)),

        // 이메일이 유효하지 않은 경우 (required field 검증 실패)
        fc
          .record({
            id: fc.uuid(),
            userId: fc.uuid(),
            name: fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
            title: fc.string(),
            bio: fc.string(),
            email: fc.string().filter((s) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)),
            skills: fc.array(fc.string()),
            githubUrl: fc.constant(''),
            projects: fc.constant([]),
            experiences: fc.constant([]),
            createdAt: isoDateArb(),
            updatedAt: isoDateArb(),
          })
          .map((obj) => JSON.stringify(obj))
      );

    it('구문 오류 JSON 가져오기 시 실패를 반환하고 기존 프로필을 유지한다', () => {
      fc.assert(
        fc.property(
          validProfileDataArb(),
          invalidSyntaxJsonArb,
          (existingProfile, badJson) => {
            // 기존 프로필로 store 초기화
            useProfileStore.setState({ profiles: [existingProfile] });

            const profilesBefore = useProfileStore.getState().profiles;

            // 잘못된 JSON 가져오기 시도
            const result = useProfileStore.getState().importFromJSON(badJson);

            // 실패를 반환해야 한다
            expect(result.success).toBe(false);
            if (result.success) return;
            expect(result.error).toBe('invalid_json');

            // 기존 프로필이 변경되지 않아야 한다
            const profilesAfter = useProfileStore.getState().profiles;
            expect(profilesAfter).toEqual(profilesBefore);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('필수 필드가 누락되거나 유효하지 않은 JSON 가져오기 시 실패를 반환하고 기존 프로필을 유지한다', () => {
      fc.assert(
        fc.property(
          validProfileDataArb(),
          invalidProfileJsonArb,
          (existingProfile, invalidJson) => {
            // 기존 프로필로 store 초기화
            useProfileStore.setState({ profiles: [existingProfile] });

            const profilesBefore = useProfileStore.getState().profiles;

            // 잘못된 ProfileData JSON 가져오기 시도
            const result =
              useProfileStore.getState().importFromJSON(invalidJson);

            // 실패를 반환해야 한다
            expect(result.success).toBe(false);
            if (result.success) return;
            expect(result.error).toBe('missing_fields');

            // 기존 프로필이 변경되지 않아야 한다
            const profilesAfter = useProfileStore.getState().profiles;
            expect(profilesAfter).toEqual(profilesBefore);
          }
        ),
        { numRuns: 100 }
      );
    });
  }
);
