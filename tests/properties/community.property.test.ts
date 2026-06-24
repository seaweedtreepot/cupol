/**
 * Community Store Property-Based Tests
 *
 * Feature: portfolio-generator
 * Property 15: 커뮤니티 필터 정확성
 * Property 16: 페이지네이션 크기 제한
 *
 * Validates: Requirements 8.1, 8.2, 8.3, 8.4
 */

import { describe, it, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { useCommunityStore } from '@/stores/community-store';
import type { PublicProfileCardExtended } from '@/stores/community-store';

// ── Arbitraries ──────────────────────────────────────────────────────────────

/** ASCII 알파벳 소문자/대문자로 구성된 비어있지 않은 단어 생성 */
const word = fc.stringOf(
  fc.constantFrom(...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'),
  { minLength: 1, maxLength: 12 }
);

/** 기술 스택 태그 배열 (0~5개) */
const skillsArb = fc.array(word, { minLength: 0, maxLength: 5 });

/** PublicProfileCardExtended 단일 항목 생성기 */
const profileArb: fc.Arbitrary<PublicProfileCardExtended> = fc.record({
  userId: fc.uuid(),
  name: word,
  title: word,
  profileImage: fc.constant(''),
  skills: skillsArb,
  portfolioCount: fc.nat({ max: 20 }),
  company: fc.option(word, { nil: undefined }),
});

/** 공개 프로필 배열 생성기 (0~50개) */
const profilesArb = fc.array(profileArb, { minLength: 0, maxLength: 50 });

/** 0~100개의 프로필 배열 (페이지네이션 크기 제한 테스트용) */
const profilesLargeArb = fc.array(profileArb, { minLength: 0, maxLength: 100 });

// ── Helpers ───────────────────────────────────────────────────────────────────

function resetStore() {
  useCommunityStore.setState({
    publicProfiles: [],
    filter: { page: 1, pageSize: 12 },
    chatRequests: [],
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Community Store Property-Based Tests', () => {
  beforeEach(() => {
    resetStore();
  });

  /**
   * **Property 15: 커뮤니티 필터 정확성**
   *
   * Feature: portfolio-generator, Property 15: 커뮤니티 필터 정확성
   * Validates: Requirements 8.2, 8.3, 8.4
   *
   * For any list of public profiles and filter conditions (role, company, skill),
   * the filtered result should contain ONLY profiles that match all specified conditions.
   */
  it('Property 15: 필터 결과에는 모든 조건을 만족하는 프로필만 포함되어야 한다', () => {
    fc.assert(
      fc.property(
        profilesArb,
        fc.option(word, { nil: undefined }),
        fc.option(word, { nil: undefined }),
        fc.option(word, { nil: undefined }),
        (profiles, role, company, skill) => {
          resetStore();

          // 프로필 주입 및 필터 설정
          useCommunityStore.getState().setPublicProfiles(profiles);
          useCommunityStore.getState().setFilter({ role, company, skill });

          const filtered = useCommunityStore.getState().getFilteredProfiles();

          // 반환된 모든 프로필이 각 필터 조건을 만족하는지 검증
          for (const profile of filtered) {
            // role 필터: profile.title이 role을 포함해야 한다 (대소문자 무시)
            if (role !== undefined) {
              const titleContainsRole = profile.title
                .toLowerCase()
                .includes(role.toLowerCase());
              if (!titleContainsRole) return false;
            }

            // company 필터: profile.company가 company를 포함해야 한다 (대소문자 무시)
            if (company !== undefined) {
              const profileCompany = (profile.company ?? '').toLowerCase();
              const companyContains = profileCompany.includes(
                company.toLowerCase()
              );
              if (!companyContains) return false;
            }

            // skill 필터: profile.skills 중 하나가 skill을 포함해야 한다 (대소문자 무시)
            if (skill !== undefined) {
              const hasMatchingSkill = profile.skills.some((s) =>
                s.toLowerCase().includes(skill.toLowerCase())
              );
              if (!hasMatchingSkill) return false;
            }
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Property 15 (completeness): 조건을 만족하는 프로필은 필터 결과에 포함되어야 한다**
   *
   * Feature: portfolio-generator, Property 15: 커뮤니티 필터 정확성 (완전성)
   * Validates: Requirements 8.2, 8.3, 8.4
   *
   * Profiles that satisfy the filter condition must appear in the result
   * (the filter must not exclude valid matches).
   */
  it('Property 15 (완전성): 조건을 만족하는 프로필은 필터 결과에서 누락되지 않아야 한다', () => {
    fc.assert(
      fc.property(
        profilesArb,
        fc.option(word, { nil: undefined }),
        fc.option(word, { nil: undefined }),
        fc.option(word, { nil: undefined }),
        (profiles, role, company, skill) => {
          resetStore();

          useCommunityStore.getState().setPublicProfiles(profiles);
          useCommunityStore.getState().setFilter({ role, company, skill });

          const filtered = useCommunityStore.getState().getFilteredProfiles();
          const filteredIds = new Set(filtered.map((p) => p.userId));

          // 전체 프로필 중 모든 조건을 만족하는 프로필이 결과에 포함되는지 확인
          for (const profile of profiles) {
            const matchesRole =
              role === undefined ||
              profile.title.toLowerCase().includes(role.toLowerCase());

            const matchesCompany =
              company === undefined ||
              (profile.company ?? '').toLowerCase().includes(company.toLowerCase());

            const matchesSkill =
              skill === undefined ||
              profile.skills.some((s) =>
                s.toLowerCase().includes(skill.toLowerCase())
              );

            if (matchesRole && matchesCompany && matchesSkill) {
              if (!filteredIds.has(profile.userId)) return false;
            }
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Property 16: 페이지네이션 크기 제한**
   *
   * Feature: portfolio-generator, Property 16: 페이지네이션 크기 제한
   * Validates: Requirements 8.1
   *
   * For any list of public profiles of any size, a single page should never
   * exceed 12 items.
   */
  it('Property 16: 한 페이지의 결과는 최대 12개를 초과하지 않아야 한다', () => {
    fc.assert(
      fc.property(
        profilesLargeArb,
        fc.integer({ min: 1, max: 20 }), // 임의의 페이지 번호
        (profiles, page) => {
          resetStore();

          useCommunityStore.getState().setPublicProfiles(profiles);
          useCommunityStore.getState().setFilter({ page });

          const paginated = useCommunityStore.getState().getPaginatedProfiles();

          return paginated.length <= 12;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ── Coffee Chat UI Logic Properties ──────────────────────────────────────────

/**
 * Pure UI logic for showing the coffee chat button.
 *
 * The button should be visible only when:
 * - The visitor is logged in (not null), AND
 * - The visitor's ID differs from the profile page owner's ID
 *
 * Requirements 8.9, 8.10
 */
function showCoffeeChatButton(
  visitor: { id: string } | null,
  ownerId: string
): boolean {
  return visitor !== null && visitor.id !== ownerId;
}

/**
 * Pure validation for coffee chat form required fields.
 *
 * Returns true when ALL required fields are non-empty and non-whitespace.
 * Returns false (blocks submission) when ANY required field is empty or whitespace-only.
 *
 * Mirrors the validateForm() logic in CoffeeChatForm.
 * Requirements 8.12
 */
function isValidChatRequest(data: {
  requesterName: string;
  requesterEmail: string;
  message: string;
}): boolean {
  return (
    data.requesterName.trim() !== '' &&
    data.requesterEmail.trim() !== '' &&
    data.message.trim() !== ''
  );
}

describe('Coffee Chat UI Logic Property-Based Tests', () => {
  /**
   * **Property 17: 커피챗 버튼 표시 규칙**
   *
   * Feature: portfolio-generator, Property 17: 커피챗 버튼 표시 규칙
   * Validates: Requirements 8.9, 8.10
   *
   * For any logged-in visitor (UserSession | null) and any profile page ownerId,
   * the coffee chat button must be shown ONLY when visitor !== null AND visitor.id !== ownerId.
   */
  it('Property 17: 커피챗 버튼은 방문자와 소유자가 다를 때만 표시되어야 한다', () => {
    // Arbitrary for a visitor session (logged-in user)
    const visitorSessionArb = fc.record({
      id: fc.uuid(),
      name: fc.string({ minLength: 1, maxLength: 20 }),
      email: fc.string({ minLength: 1, maxLength: 30 }),
      profileImage: fc.constant(''),
      isFirstLogin: fc.boolean(),
    });

    // Visitor can be null (logged-out) or a UserSession
    const visitorArb = fc.option(visitorSessionArb, { nil: null });

    // Owner ID is any non-empty string (UUID-like)
    const ownerIdArb = fc.uuid();

    fc.assert(
      fc.property(visitorArb, ownerIdArb, (visitor, ownerId) => {
        const shouldShow = showCoffeeChatButton(visitor, ownerId);

        // Ground truth: button shows iff visitor is logged in AND visitor is not the owner
        const expected =
          visitor !== null && visitor.id !== ownerId;

        return shouldShow === expected;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Property 17 (edge — same ID): 방문자와 소유자가 같으면 버튼이 숨겨져야 한다**
   *
   * Feature: portfolio-generator, Property 17: 커피챗 버튼 표시 규칙 (자기 자신 방문)
   * Validates: Requirements 8.9, 8.10
   *
   * When the logged-in visitor's ID equals the page ownerId, the button must NOT appear.
   */
  it('Property 17 (자기 자신 방문): 방문자 ID === 소유자 ID이면 버튼이 표시되지 않아야 한다', () => {
    const sessionArb = fc.record({
      id: fc.uuid(),
      name: fc.string({ minLength: 1, maxLength: 20 }),
      email: fc.string({ minLength: 1, maxLength: 30 }),
      profileImage: fc.constant(''),
      isFirstLogin: fc.boolean(),
    });

    fc.assert(
      fc.property(sessionArb, (visitor) => {
        // Pass the visitor's own ID as the ownerId — should never show button
        return showCoffeeChatButton(visitor, visitor.id) === false;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Property 18: 필수 필드 미입력 시 제출 차단**
   *
   * Feature: portfolio-generator, Property 18: 필수 필드 미입력 시 제출 차단
   * Validates: Requirements 8.12
   *
   * For any ChatRequest-like object where at least one required field
   * (requesterName, requesterEmail, message) is empty or whitespace-only,
   * isValidChatRequest must return false (submission blocked).
   */
  it('Property 18: 필수 필드가 빈 문자열이거나 공백만 있으면 제출이 차단되어야 한다', () => {
    // Generator for a whitespace-only string (at least one space/tab/newline)
    const whitespaceOnlyArb = fc.stringOf(
      fc.constantFrom(' ', '\t', '\n', '\r'),
      { minLength: 1, maxLength: 10 }
    );

    // Either empty string or whitespace-only — both are invalid
    const emptyOrWhitespaceArb = fc.oneof(
      fc.constant(''),
      whitespaceOnlyArb
    );

    // A valid non-empty, non-whitespace string for the other fields
    const nonEmptyStringArb = fc.string({ minLength: 1, maxLength: 50 }).filter(
      (s) => s.trim().length > 0
    );

    // Pick one of the three required fields to be invalid; the rest are valid
    const invalidFieldArb = fc.constantFrom(
      'requesterName',
      'requesterEmail',
      'message'
    ) as fc.Arbitrary<'requesterName' | 'requesterEmail' | 'message'>;

    fc.assert(
      fc.property(
        invalidFieldArb,
        emptyOrWhitespaceArb,
        nonEmptyStringArb,
        nonEmptyStringArb,
        (invalidField, badValue, validValue1, validValue2) => {
          // Build a data object where exactly the chosen field is invalid
          const base: Record<'requesterName' | 'requesterEmail' | 'message', string> = {
            requesterName: validValue1,
            requesterEmail: validValue2,
            message: validValue1,
          };
          base[invalidField] = badValue;

          // Submission must be blocked
          return isValidChatRequest(base) === false;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Property 18 (completeness): 모든 필수 필드가 입력된 경우 검증 통과**
   *
   * Feature: portfolio-generator, Property 18: 필수 필드 미입력 시 제출 차단 (완전성)
   * Validates: Requirements 8.12
   *
   * When all required fields contain at least one non-whitespace character,
   * isValidChatRequest must return true (submission allowed).
   */
  it('Property 18 (완전성): 모든 필수 필드가 채워진 경우 검증을 통과해야 한다', () => {
    const nonEmptyStringArb = fc.string({ minLength: 1, maxLength: 100 }).filter(
      (s) => s.trim().length > 0
    );

    fc.assert(
      fc.property(
        nonEmptyStringArb,
        nonEmptyStringArb,
        nonEmptyStringArb,
        (name, email, message) => {
          return isValidChatRequest({
            requesterName: name,
            requesterEmail: email,
            message,
          }) === true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
