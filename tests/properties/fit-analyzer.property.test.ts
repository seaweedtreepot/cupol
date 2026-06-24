/**
 * Fit Analyzer 프로퍼티 기반 테스트
 *
 * Feature: portfolio-generator
 * Validates: Requirements 6.3, 6.4, 6.5, 6.6, 6.7
 *
 * 패턴:
 * - 각 프로퍼티 테스트는 설계 문서의 Correctness Property를 직접 검증합니다.
 * - 태그 형식: "Feature: portfolio-generator, Property {N}: {description}"
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  calculateTechMatchRate,
  calculateMissingSkills,
  checkExperienceMet,
  calculateOverallScore,
  generateSuggestions,
} from '@/lib/fit-analyzer';
import type { Experience, FitReport } from '@/types';

// ──────────────────────────────────────────────
// Helpers / Arbitraries
// ──────────────────────────────────────────────

/** 알파벳+숫자로 구성된 기술 스택 이름 생성 (빈 문자열 방지) */
const skillArb = fc.stringMatching(/^[a-zA-Z][a-zA-Z0-9]{0,9}$/);

/** 고유 기술 스택 배열 (대소문자 혼합 허용, 최대 30개) */
const skillArrayArb = fc
  .array(skillArb, { minLength: 0, maxLength: 30 })
  .map((arr) => [...new Set(arr.map((s) => s.toLowerCase()))]);

/**
 * YYYY-MM 형식의 날짜 문자열 생성
 * 연도 범위: 2000~2022 (테스트 결정성 보장을 위해 현재 시간과 무관한 과거 구간)
 */
const yearMonthArb = fc
  .tuple(fc.integer({ min: 2000, max: 2022 }), fc.integer({ min: 1, max: 12 }))
  .map(([y, m]) => `${y}-${String(m).padStart(2, '0')}`);

/**
 * 유효한 Experience 엔트리 생성
 * startDate ≤ endDate 보장, endDate = 'present' 없음 (결정성 보장)
 */
const experienceArb: fc.Arbitrary<Experience> = fc
  .tuple(yearMonthArb, yearMonthArb)
  .chain(([d1, d2]) => {
    // 시간 순서 정렬
    const [start, end] = d1 <= d2 ? [d1, d2] : [d2, d1];
    return fc.constant<Experience>({
      id: 'exp-id',
      company: 'Company',
      position: 'Engineer',
      startDate: start,
      endDate: end,
      description: '',
    });
  });

const experienceArrayArb: fc.Arbitrary<Experience[]> = fc.array(
  experienceArb,
  { minLength: 0, maxLength: 10 }
);

// ──────────────────────────────────────────────
// Property 3: 기술 스택 일치율 계산 정확성
// Feature: portfolio-generator, Property 3: 기술 스택 일치율 계산 정확성
// Validates: Requirements 6.3
// ──────────────────────────────────────────────
describe('Property 3: 기술 스택 일치율 계산 정확성', () => {
  it(
    '결과 = (교집합 크기 / required.length) × 100 이며 항상 0~100 이다',
    () => {
      fc.assert(
        fc.property(skillArrayArb, skillArrayArb, (userSkills, requiredSkills) => {
          const result = calculateTechMatchRate(userSkills, requiredSkills);

          // 범위 검증: 항상 0~100
          expect(result).toBeGreaterThanOrEqual(0);
          expect(result).toBeLessThanOrEqual(100);

          if (requiredSkills.length === 0) {
            // requiredSkills 가 비어있으면 100 반환 (spec)
            expect(result).toBe(100);
          } else {
            // 교집합 직접 계산 (대소문자 무시)
            const userSet = new Set(userSkills.map((s) => s.toLowerCase()));
            const intersectionSize = requiredSkills.filter((s) =>
              userSet.has(s.toLowerCase())
            ).length;

            const expected = (intersectionSize / requiredSkills.length) * 100;
            expect(result).toBeCloseTo(expected, 10);
          }
        }),
        { numRuns: 100 }
      );
    }
  );
});

// ──────────────────────────────────────────────
// Property 4: 부족 기술 스택 = 집합 차이
// Feature: portfolio-generator, Property 4: 부족 기술 스택 = 집합 차이
// Validates: Requirements 6.4
// ──────────────────────────────────────────────
describe('Property 4: 부족 기술 스택 = 집합 차이', () => {
  it(
    'missingSkills 의 모든 원소는 requiredSkills 에 있고 userSkills 에는 없다',
    () => {
      fc.assert(
        fc.property(skillArrayArb, skillArrayArb, (userSkills, requiredSkills) => {
          const missing = calculateMissingSkills(userSkills, requiredSkills);

          const userSet = new Set(userSkills.map((s) => s.toLowerCase()));
          const requiredSet = new Set(
            requiredSkills.map((s) => s.toLowerCase())
          );

          for (const skill of missing) {
            // 반드시 required 에 포함
            expect(requiredSet.has(skill.toLowerCase())).toBe(true);
            // 반드시 user 에 없음
            expect(userSet.has(skill.toLowerCase())).toBe(false);
          }

          // 반대 방향: required 에 있고 user 에 없는 기술이 모두 missing 에 포함
          const missingSet = new Set(missing.map((s) => s.toLowerCase()));
          for (const req of requiredSkills) {
            if (!userSet.has(req.toLowerCase())) {
              expect(missingSet.has(req.toLowerCase())).toBe(true);
            }
          }
        }),
        { numRuns: 100 }
      );
    }
  );
});

// ──────────────────────────────────────────────
// Property 5: 경력 요구사항 충족 판정
// Feature: portfolio-generator, Property 5: 경력 요구사항 충족 판정
// Validates: Requirements 6.5
// ──────────────────────────────────────────────
describe('Property 5: 경력 요구사항 충족 판정', () => {
  it(
    '총 경력 개월 수 >= minYears*12 이면 true, 아니면 false',
    () => {
      fc.assert(
        fc.property(
          experienceArrayArb,
          fc.integer({ min: 0, max: 20 }),
          (experiences, minYears) => {
            const result = checkExperienceMet(experiences, minYears);

            // 총 경력 개월 직접 계산 (fit-analyzer 내부 로직과 동일)
            let totalMonths = 0;
            for (const exp of experiences) {
              const [sy, sm] = exp.startDate.split('-').map(Number);
              const [ey, em] = exp.endDate.split('-').map(Number);
              const months = (ey - sy) * 12 + (em - sm);
              totalMonths += Math.max(0, months);
            }

            const expectedMet = totalMonths >= minYears * 12;
            expect(result).toBe(expectedMet);
          }
        ),
        { numRuns: 100 }
      );
    }
  );
});

// ──────────────────────────────────────────────
// Property 6: 전체 적합도 점수 범위
// Feature: portfolio-generator, Property 6: 전체 적합도 점수 범위
// Validates: Requirements 6.6
// ──────────────────────────────────────────────
describe('Property 6: 전체 적합도 점수 범위', () => {
  it(
    'calculateOverallScore 결과는 항상 0~100 이다',
    () => {
      const roleStringArb = fc.string({ minLength: 0, maxLength: 30 });

      fc.assert(
        fc.property(
          fc.float({ min: 0, max: 100, noNaN: true }),
          fc.boolean(),
          roleStringArb,
          roleStringArb,
          (techMatchRate, experienceMet, preferredRole, userTitle) => {
            const result = calculateOverallScore(
              techMatchRate,
              experienceMet,
              preferredRole,
              userTitle
            );

            expect(result).toBeGreaterThanOrEqual(0);
            expect(result).toBeLessThanOrEqual(100);
            expect(Number.isFinite(result)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    }
  );
});

// ──────────────────────────────────────────────
// Property 7: 개선 제안 최소 1개 보장
// Feature: portfolio-generator, Property 7: 개선 제안 최소 1개 보장
// Validates: Requirements 6.7
// ──────────────────────────────────────────────
describe('Property 7: 개선 제안 최소 1개 보장', () => {
  it(
    'generateSuggestions 결과 배열은 항상 1개 이상이다',
    () => {
      /** suggestions 를 제외한 FitReport partial */
      const partialReportArb: fc.Arbitrary<Omit<FitReport, 'suggestions'>> =
        fc.record({
          techMatchRate: fc.float({ min: 0, max: 100, noNaN: true }),
          missingSkills: skillArrayArb,
          experienceMet: fc.boolean(),
          overallScore: fc.float({ min: 0, max: 100, noNaN: true }),
        });

      fc.assert(
        fc.property(partialReportArb, (report) => {
          const suggestions = generateSuggestions(report);

          expect(Array.isArray(suggestions)).toBe(true);
          expect(suggestions.length).toBeGreaterThanOrEqual(1);
        }),
        { numRuns: 100 }
      );
    }
  );
});
