/**
 * Fit Analyzer 유닛 테스트
 *
 * fit-analyzer.ts의 모든 순수 함수에 대한 단위 테스트.
 * Requirements: 6.2, 6.3, 6.4, 6.5, 6.6, 6.7
 */

import { describe, it, expect } from 'vitest';
import {
  calculateTechMatchRate,
  calculateMissingSkills,
  calculateExperienceYears,
  checkExperienceMet,
  calculateOverallScore,
  generateSuggestions,
  analyze,
} from '@/lib/fit-analyzer';
import type { Experience, ProfileData, CompanyCriteria, FitReport } from '@/types';

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────

function makeExperience(
  startDate: string,
  endDate: string,
  overrides: Partial<Experience> = {}
): Experience {
  return {
    id: 'exp-1',
    company: 'ACME',
    position: 'Developer',
    description: '',
    startDate,
    endDate,
    ...overrides,
  };
}

function makeProfile(overrides: Partial<ProfileData> = {}): ProfileData {
  return {
    id: 'p-1',
    userId: 'u-1',
    name: '홍길동',
    title: 'Frontend Developer',
    bio: '',
    email: 'test@example.com',
    skills: ['React', 'TypeScript', 'Node.js'],
    githubUrl: '',
    projects: [],
    experiences: [],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

function makeCriteria(overrides: Partial<CompanyCriteria> = {}): CompanyCriteria {
  return {
    requiredSkills: ['React', 'TypeScript'],
    minExperienceYears: 2,
    preferredRole: 'Frontend',
    additionalRequirements: '',
    ...overrides,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// calculateTechMatchRate
// ────────────────────────────────────────────────────────────────────────────

describe('calculateTechMatchRate', () => {
  it('모든 기술이 일치할 때 100을 반환한다', () => {
    expect(calculateTechMatchRate(['React', 'TypeScript'], ['React', 'TypeScript'])).toBe(100);
  });

  it('기술이 하나도 일치하지 않을 때 0을 반환한다', () => {
    expect(calculateTechMatchRate(['Vue', 'Python'], ['React', 'TypeScript'])).toBe(0);
  });

  it('일부 기술이 일치할 때 올바른 비율을 반환한다', () => {
    // 1 / 2 * 100 = 50
    expect(calculateTechMatchRate(['React', 'Python'], ['React', 'TypeScript'])).toBe(50);
  });

  it('요구 기술이 비어있으면 100을 반환한다', () => {
    expect(calculateTechMatchRate(['React'], [])).toBe(100);
  });

  it('사용자 기술이 비어있으면 0을 반환한다', () => {
    expect(calculateTechMatchRate([], ['React', 'TypeScript'])).toBe(0);
  });

  it('대소문자를 구분하지 않고 비교한다', () => {
    expect(calculateTechMatchRate(['react', 'TYPESCRIPT'], ['React', 'TypeScript'])).toBe(100);
  });

  it('결과는 항상 0 이상이다', () => {
    const rate = calculateTechMatchRate([], ['React']);
    expect(rate).toBeGreaterThanOrEqual(0);
  });

  it('결과는 항상 100 이하이다', () => {
    const rate = calculateTechMatchRate(['React', 'TS', 'Extra'], ['React']);
    expect(rate).toBeLessThanOrEqual(100);
  });

  it('3개 중 2개 일치 시 약 66.67을 반환한다', () => {
    const rate = calculateTechMatchRate(['React', 'TypeScript', 'Python'], ['React', 'TypeScript', 'Vue']);
    expect(rate).toBeCloseTo(66.67, 1);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// calculateMissingSkills
// ────────────────────────────────────────────────────────────────────────────

describe('calculateMissingSkills', () => {
  it('부족한 기술만 반환한다', () => {
    const missing = calculateMissingSkills(
      ['React', 'TypeScript'],
      ['React', 'TypeScript', 'Node.js']
    );
    expect(missing).toEqual(['Node.js']);
  });

  it('모든 기술이 일치하면 빈 배열을 반환한다', () => {
    const missing = calculateMissingSkills(['React', 'TypeScript'], ['React', 'TypeScript']);
    expect(missing).toEqual([]);
  });

  it('모든 기술이 없으면 요구 기술 전체를 반환한다', () => {
    const missing = calculateMissingSkills([], ['React', 'TypeScript']);
    expect(missing).toEqual(['React', 'TypeScript']);
  });

  it('대소문자를 구분하지 않고 비교한다', () => {
    const missing = calculateMissingSkills(['react'], ['React', 'TypeScript']);
    expect(missing).toEqual(['TypeScript']);
  });

  it('요구 기술이 비어있으면 빈 배열을 반환한다', () => {
    const missing = calculateMissingSkills(['React'], []);
    expect(missing).toEqual([]);
  });

  it('부족 기술은 요구 기술의 원래 케이싱을 유지한다', () => {
    const missing = calculateMissingSkills(['react'], ['React', 'TypeScript']);
    expect(missing).toContain('TypeScript');
    // 'React'는 소문자 'react'와 일치하므로 포함되지 않아야 함
    expect(missing).not.toContain('React');
  });
});

// ────────────────────────────────────────────────────────────────────────────
// calculateExperienceYears
// ────────────────────────────────────────────────────────────────────────────

describe('calculateExperienceYears', () => {
  it('경력이 없으면 0을 반환한다', () => {
    expect(calculateExperienceYears([])).toBe(0);
  });

  it('정확히 1년 경력을 계산한다', () => {
    const exp = makeExperience('2022-01', '2023-01');
    expect(calculateExperienceYears([exp])).toBeCloseTo(1, 5);
  });

  it('정확히 2년 경력을 계산한다', () => {
    const exp = makeExperience('2020-01', '2022-01');
    expect(calculateExperienceYears([exp])).toBeCloseTo(2, 5);
  });

  it('여러 경력의 합산을 계산한다', () => {
    const exps = [
      makeExperience('2020-01', '2021-01', { id: 'e1' }), // 1년
      makeExperience('2021-06', '2022-06', { id: 'e2' }), // 1년
    ];
    expect(calculateExperienceYears(exps)).toBeCloseTo(2, 5);
  });

  it("'present'를 현재 날짜로 처리한다", () => {
    // 현재 날짜 이전 시작이면 양수 경력이 계산되어야 함
    const exp = makeExperience('2020-01', 'present');
    const years = calculateExperienceYears([exp]);
    expect(years).toBeGreaterThan(0);
  });

  it("'present'는 대소문자 구분 없이 처리된다", () => {
    const expLower = makeExperience('2020-01', 'present', { id: 'e1' });
    const expUpper = makeExperience('2020-01', 'Present', { id: 'e2' });
    // 둘 다 비슷한 값이어야 함
    expect(calculateExperienceYears([expLower])).toBeCloseTo(
      calculateExperienceYears([expUpper]),
      1
    );
  });

  it('소수점 경력을 정확히 계산한다 (6개월 = 0.5년)', () => {
    const exp = makeExperience('2022-01', '2022-07'); // 6개월
    expect(calculateExperienceYears([exp])).toBeCloseTo(0.5, 5);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// checkExperienceMet
// ────────────────────────────────────────────────────────────────────────────

describe('checkExperienceMet', () => {
  it('총 경력이 최소 요구 연수 이상이면 true를 반환한다', () => {
    const exps = [makeExperience('2020-01', '2023-01')]; // 3년
    expect(checkExperienceMet(exps, 2)).toBe(true);
  });

  it('총 경력이 최소 요구 연수와 정확히 같으면 true를 반환한다', () => {
    const exps = [makeExperience('2021-01', '2023-01')]; // 정확히 2년
    expect(checkExperienceMet(exps, 2)).toBe(true);
  });

  it('총 경력이 최소 요구 연수 미만이면 false를 반환한다', () => {
    const exps = [makeExperience('2022-01', '2023-01')]; // 1년
    expect(checkExperienceMet(exps, 2)).toBe(false);
  });

  it('경력이 없고 최소 요구 연수가 0이면 true를 반환한다', () => {
    expect(checkExperienceMet([], 0)).toBe(true);
  });

  it('경력이 없고 최소 요구 연수가 1년이면 false를 반환한다', () => {
    expect(checkExperienceMet([], 1)).toBe(false);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// calculateOverallScore
// ────────────────────────────────────────────────────────────────────────────

describe('calculateOverallScore', () => {
  it('모든 조건 충족 시 100을 반환한다', () => {
    const score = calculateOverallScore(100, true, 'Frontend', 'Frontend Developer');
    expect(score).toBe(100);
  });

  it('아무 조건도 충족하지 않으면 0을 반환한다', () => {
    const score = calculateOverallScore(0, false, 'Backend', 'Frontend Developer');
    expect(score).toBe(0);
  });

  it('가중치를 올바르게 적용한다 (기술 50%, 경력 30%, 역할 20%)', () => {
    // techMatchRate=100, experienceMet=false, roleScore=100
    // 100*0.5 + 0*0.3 + 100*0.2 = 50 + 0 + 20 = 70
    const score = calculateOverallScore(100, false, 'Frontend', 'Frontend Developer');
    expect(score).toBeCloseTo(70, 5);
  });

  it('preferredRole이 빈 문자열이면 역할 점수 100으로 처리한다', () => {
    // 기술 0%, 경력 충족, 역할 빈값(100)
    // 0*0.5 + 100*0.3 + 100*0.2 = 0 + 30 + 20 = 50
    const score = calculateOverallScore(0, true, '', 'Frontend Developer');
    expect(score).toBeCloseTo(50, 5);
  });

  it('userTitle에 preferredRole이 포함되지 않으면 역할 점수 0으로 처리한다', () => {
    // 기술 100%, 경력 충족, 역할 불일치(0)
    // 100*0.5 + 100*0.3 + 0*0.2 = 50 + 30 + 0 = 80
    const score = calculateOverallScore(100, true, 'Backend', 'Frontend Developer');
    expect(score).toBeCloseTo(80, 5);
  });

  it('결과는 항상 0 이상이다', () => {
    const score = calculateOverallScore(0, false, 'Backend', 'Frontend');
    expect(score).toBeGreaterThanOrEqual(0);
  });

  it('결과는 항상 100 이하이다', () => {
    const score = calculateOverallScore(100, true, '', '');
    expect(score).toBeLessThanOrEqual(100);
  });

  it('역할 비교는 대소문자를 구분하지 않는다', () => {
    const scoreMatch = calculateOverallScore(0, false, 'frontend', 'FRONTEND DEVELOPER');
    const scoreMismatch = calculateOverallScore(0, false, 'backend', 'FRONTEND DEVELOPER');
    // match: 0*0.5 + 0*0.3 + 100*0.2 = 20
    // mismatch: 0*0.5 + 0*0.3 + 0*0.2 = 0
    expect(scoreMatch).toBeCloseTo(20, 5);
    expect(scoreMismatch).toBeCloseTo(0, 5);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// generateSuggestions
// ────────────────────────────────────────────────────────────────────────────

describe('generateSuggestions', () => {
  function makePartialReport(
    overrides: Partial<Omit<FitReport, 'suggestions'>> = {}
  ): Omit<FitReport, 'suggestions'> {
    return {
      techMatchRate: 50,
      missingSkills: [],
      experienceMet: true,
      overallScore: 60,
      ...overrides,
    };
  }

  it('항상 최소 1개 이상의 제안을 반환한다', () => {
    const report = makePartialReport({ overallScore: 60, experienceMet: true, missingSkills: [] });
    const suggestions = generateSuggestions(report);
    expect(suggestions.length).toBeGreaterThanOrEqual(1);
  });

  it('부족 기술이 있으면 해당 기술 습득 제안을 포함한다', () => {
    const report = makePartialReport({ missingSkills: ['GraphQL', 'Docker'] });
    const suggestions = generateSuggestions(report);
    expect(suggestions.some((s) => s.includes('GraphQL') && s.includes('Docker'))).toBe(true);
  });

  it('경력 미충족이면 경험 추가 제안을 포함한다', () => {
    const report = makePartialReport({ experienceMet: false });
    const suggestions = generateSuggestions(report);
    expect(suggestions.some((s) => s.includes('경력'))).toBe(true);
  });

  it('전체 점수 80 이상이면 지원 격려 제안을 포함한다', () => {
    const report = makePartialReport({ overallScore: 85, missingSkills: [], experienceMet: true });
    const suggestions = generateSuggestions(report);
    expect(suggestions.some((s) => s.includes('적합도가 높'))).toBe(true);
  });

  it('전체 점수 50 미만이면 보완 권고 제안을 포함한다', () => {
    const report = makePartialReport({
      overallScore: 30,
      missingSkills: [],
      experienceMet: true,
    });
    const suggestions = generateSuggestions(report);
    expect(suggestions.some((s) => s.includes('보완'))).toBe(true);
  });

  it('점수 50~79에서 부족 기술도 없고 경력도 충족이면 기본 제안을 반환한다', () => {
    const report = makePartialReport({
      overallScore: 65,
      missingSkills: [],
      experienceMet: true,
    });
    const suggestions = generateSuggestions(report);
    // 최소 1개 보장 (기본 제안)
    expect(suggestions.length).toBeGreaterThanOrEqual(1);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// analyze (통합)
// ────────────────────────────────────────────────────────────────────────────

describe('analyze', () => {
  it('FitReport의 모든 필드를 반환한다', () => {
    const profile = makeProfile();
    const criteria = makeCriteria();
    const report = analyze(profile, criteria);

    expect(report).toHaveProperty('techMatchRate');
    expect(report).toHaveProperty('missingSkills');
    expect(report).toHaveProperty('experienceMet');
    expect(report).toHaveProperty('overallScore');
    expect(report).toHaveProperty('suggestions');
  });

  it('기술 일치율이 올바르게 계산된다', () => {
    const profile = makeProfile({ skills: ['React', 'TypeScript'] });
    const criteria = makeCriteria({ requiredSkills: ['React', 'TypeScript', 'GraphQL'] });
    const report = analyze(profile, criteria);
    // 2/3 * 100 ≈ 66.67
    expect(report.techMatchRate).toBeCloseTo(66.67, 1);
  });

  it('부족 기술 목록이 올바르게 반환된다', () => {
    const profile = makeProfile({ skills: ['React'] });
    const criteria = makeCriteria({ requiredSkills: ['React', 'TypeScript'] });
    const report = analyze(profile, criteria);
    expect(report.missingSkills).toEqual(['TypeScript']);
  });

  it('경력 충족 여부가 올바르게 계산된다', () => {
    const exp = makeExperience('2020-01', '2023-01'); // 3년
    const profile = makeProfile({ experiences: [exp] });
    const criteria = makeCriteria({ minExperienceYears: 2 });
    const report = analyze(profile, criteria);
    expect(report.experienceMet).toBe(true);
  });

  it('경력 미충족 시 experienceMet이 false이다', () => {
    const profile = makeProfile({ experiences: [] }); // 0년
    const criteria = makeCriteria({ minExperienceYears: 1 });
    const report = analyze(profile, criteria);
    expect(report.experienceMet).toBe(false);
  });

  it('overallScore는 0~100 범위이다', () => {
    const profile = makeProfile();
    const criteria = makeCriteria();
    const report = analyze(profile, criteria);
    expect(report.overallScore).toBeGreaterThanOrEqual(0);
    expect(report.overallScore).toBeLessThanOrEqual(100);
  });

  it('suggestions는 최소 1개 이상이다', () => {
    const profile = makeProfile();
    const criteria = makeCriteria();
    const report = analyze(profile, criteria);
    expect(report.suggestions.length).toBeGreaterThanOrEqual(1);
  });

  it('완벽한 매치 시 높은 점수를 반환한다', () => {
    const exp = makeExperience('2020-01', '2024-01'); // 4년
    const profile = makeProfile({
      title: 'Frontend Developer',
      skills: ['React', 'TypeScript'],
      experiences: [exp],
    });
    const criteria = makeCriteria({
      requiredSkills: ['React', 'TypeScript'],
      minExperienceYears: 2,
      preferredRole: 'Frontend',
    });
    const report = analyze(profile, criteria);
    // 100*0.5 + 100*0.3 + 100*0.2 = 100
    expect(report.overallScore).toBe(100);
    expect(report.missingSkills).toEqual([]);
    expect(report.experienceMet).toBe(true);
  });
});
