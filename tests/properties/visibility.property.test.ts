/**
 * Property-based tests for Visibility Controller
 *
 * Feature: portfolio-generator, Property 8: 포트폴리오 접근 제어 규칙
 *
 * Validates: Requirements 7.3, 7.6, 7.7
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { canAccess, setVisibility, generateShareURL } from '@/lib/visibility-controller';
import type { PortfolioMeta } from '@/types';

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

/** 임의의 non-empty 문자열 ID (UUID 유사) */
const arbId = fc.uuid();

/** 임의의 visibility 값 */
const arbVisibility = fc.constantFrom('public' as const, 'private' as const);

/** 임의의 PortfolioMeta 객체 */
const arbPortfolioMeta: fc.Arbitrary<PortfolioMeta> = fc
  .record({
    id: arbId,
    userId: arbId,
    profileDataId: arbId,
    visibility: arbVisibility,
    shareUrl: fc.oneof(fc.constant(''), fc.string({ minLength: 1, maxLength: 50 })),
    generatedSiteId: arbId,
    createdAt: fc.constant(new Date(0).toISOString()),
    updatedAt: fc.constant(new Date(0).toISOString()),
  });

/** 임의의 접근자 userId (null 포함) */
const arbAccessingUserId: fc.Arbitrary<string | null> = fc.oneof(
  fc.constant(null),
  arbId,
);

// ---------------------------------------------------------------------------
// Property 8: 포트폴리오 접근 제어 규칙
// ---------------------------------------------------------------------------

describe('Property 8: 포트폴리오 접근 제어 규칙 (Validates: Requirements 7.3, 7.6, 7.7)', () => {
  /**
   * canAccess(meta, userId) === (meta.visibility === 'public' || (userId !== null && userId === meta.userId))
   *
   * For any portfolio and accessing user, canAccess returns true ONLY IF
   * visibility is 'public' OR the accessing user is the owner.
   */
  it('Feature: portfolio-generator, Property 8: canAccess는 public이거나 소유자인 경우에만 true를 반환해야 한다', () => {
    fc.assert(
      fc.property(arbPortfolioMeta, arbAccessingUserId, (meta, userId) => {
        const result = canAccess(meta, userId);
        const expected =
          meta.visibility === 'public' ||
          (userId !== null && userId === meta.userId);

        expect(result).toBe(expected);
      }),
      { numRuns: 100 },
    );
  });

  it('소유자는 private 포트폴리오에도 항상 접근 가능해야 한다', () => {
    fc.assert(
      fc.property(arbPortfolioMeta, (meta) => {
        const privateMeta: PortfolioMeta = { ...meta, visibility: 'private' };
        expect(canAccess(privateMeta, meta.userId)).toBe(true);
      }),
      { numRuns: 100 },
    );
  });

  it('null 사용자(비인증)는 public 포트폴리오에만 접근 가능해야 한다', () => {
    fc.assert(
      fc.property(arbPortfolioMeta, (meta) => {
        const result = canAccess(meta, null);
        expect(result).toBe(meta.visibility === 'public');
      }),
      { numRuns: 100 },
    );
  });

  it('비소유자 인증 사용자는 public 포트폴리오에만 접근 가능해야 한다', () => {
    fc.assert(
      fc.property(
        arbPortfolioMeta,
        // 소유자 ID와 다른 ID를 생성
        fc.uuid().filter((id) => true), // 필터는 record 안에서 처리
        (meta, _) => {
          // 소유자와 반드시 다른 UUID 생성
          const otherId = `other-${meta.userId}`;
          const result = canAccess(meta, otherId);
          expect(result).toBe(meta.visibility === 'public');
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ---------------------------------------------------------------------------
// setVisibility 불변성 테스트
// ---------------------------------------------------------------------------

describe('setVisibility 불변성 (Validates: Requirements 7.1, 7.2, 7.7)', () => {
  it('setVisibility는 원본 meta 객체를 변경하지 않아야 한다', () => {
    fc.assert(
      fc.property(arbPortfolioMeta, arbVisibility, (meta, visibility) => {
        const originalId = meta.id;
        const originalUserId = meta.userId;
        const originalProfileDataId = meta.profileDataId;
        const originalVisibility = meta.visibility;
        const originalShareUrl = meta.shareUrl;
        const originalGeneratedSiteId = meta.generatedSiteId;
        const originalCreatedAt = meta.createdAt;

        setVisibility(meta, visibility);

        // 원본 객체가 변경되지 않았는지 검증
        expect(meta.id).toBe(originalId);
        expect(meta.userId).toBe(originalUserId);
        expect(meta.profileDataId).toBe(originalProfileDataId);
        expect(meta.visibility).toBe(originalVisibility);
        expect(meta.shareUrl).toBe(originalShareUrl);
        expect(meta.generatedSiteId).toBe(originalGeneratedSiteId);
        expect(meta.createdAt).toBe(originalCreatedAt);
      }),
      { numRuns: 100 },
    );
  });

  it('setVisibility가 반환한 객체의 visibility는 요청한 값과 일치해야 한다', () => {
    fc.assert(
      fc.property(arbPortfolioMeta, arbVisibility, (meta, visibility) => {
        const result = setVisibility(meta, visibility);
        expect(result.visibility).toBe(visibility);
      }),
      { numRuns: 100 },
    );
  });

  it("public으로 전환 시 shareUrl은 항상 '/portfolio/view/'로 시작해야 한다", () => {
    fc.assert(
      fc.property(arbPortfolioMeta, (meta) => {
        // shareUrl이 비어 있을 때만 새로 생성됨을 검증
        const metaWithoutShareUrl: PortfolioMeta = { ...meta, shareUrl: '' };
        const result = setVisibility(metaWithoutShareUrl, 'public');
        expect(result.shareUrl).toMatch(/^\/portfolio\/view\//);
      }),
      { numRuns: 100 },
    );
  });
});

// ---------------------------------------------------------------------------
// generateShareURL 형식 테스트
// ---------------------------------------------------------------------------

describe('generateShareURL 형식 (Validates: Requirements 7.2)', () => {
  it("generateShareURL은 항상 '/portfolio/view/'로 시작하는 문자열을 반환해야 한다", () => {
    fc.assert(
      fc.property(arbId, (portfolioId) => {
        const url = generateShareURL(portfolioId);
        expect(typeof url).toBe('string');
        expect(url.startsWith('/portfolio/view/')).toBe(true);
      }),
      { numRuns: 100 },
    );
  });

  it('generateShareURL은 portfolioId를 URL에 포함해야 한다', () => {
    fc.assert(
      fc.property(arbId, (portfolioId) => {
        const url = generateShareURL(portfolioId);
        expect(url).toContain(portfolioId);
      }),
      { numRuns: 100 },
    );
  });
});
