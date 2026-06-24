/**
 * Fit Analyzer 모듈
 *
 * 사용자 포트폴리오와 기업 인재상 기준을 비교 분석하는 순수 함수 모듈.
 * 부수효과(side effects) 없이 입력값만으로 결과를 계산합니다.
 *
 * Requirements: 6.2, 6.3, 6.4, 6.5, 6.6, 6.7
 */

import type { ProfileData, Experience, CompanyCriteria, FitReport } from '@/types';

/**
 * 기술 스택 일치율 계산
 * (교집합 크기 / 요구 기술 크기) × 100
 *
 * - 대소문자 구분 없이 비교
 * - requiredSkills가 비어있으면 100 반환
 * - 결과는 항상 0~100 범위로 클램프
 *
 * @param userSkills 사용자 기술 스택
 * @param requiredSkills 기업 요구 기술 스택
 * @returns 0~100 범위의 일치율
 */
export function calculateTechMatchRate(
  userSkills: string[],
  requiredSkills: string[]
): number {
  if (requiredSkills.length === 0) {
    return 100;
  }

  const normalizedUserSkills = new Set(userSkills.map((s) => s.toLowerCase()));

  const intersectionCount = requiredSkills.filter((skill) =>
    normalizedUserSkills.has(skill.toLowerCase())
  ).length;

  const rate = (intersectionCount / requiredSkills.length) * 100;

  // 0~100 클램프
  return Math.min(100, Math.max(0, rate));
}

/**
 * 부족한 기술 스택 목록 반환
 * 요구 기술 중 사용자가 보유하지 않은 기술을 반환 (대소문자 구분 없이 비교)
 *
 * @param userSkills 사용자 기술 스택
 * @param requiredSkills 기업 요구 기술 스택
 * @returns 요구 기술에는 있으나 사용자에게 없는 기술 목록
 */
export function calculateMissingSkills(
  userSkills: string[],
  requiredSkills: string[]
): string[] {
  const normalizedUserSkills = new Set(userSkills.map((s) => s.toLowerCase()));

  return requiredSkills.filter(
    (skill) => !normalizedUserSkills.has(skill.toLowerCase())
  );
}

/**
 * 총 경력 연수 계산
 * experiences 배열에서 각 경력의 기간을 합산하여 총 연수(년)를 반환합니다.
 *
 * - startDate: YYYY-MM 형식
 * - endDate: YYYY-MM 형식 또는 'present'
 * - 결과는 소수점 포함 가능
 *
 * @param experiences 경력 목록
 * @returns 총 경력 연수 (소수점 포함)
 */
export function calculateExperienceYears(experiences: Experience[]): number {
  const now = new Date();

  let totalMonths = 0;

  for (const exp of experiences) {
    const [startYear, startMonth] = exp.startDate.split('-').map(Number);

    let endYear: number;
    let endMonth: number;

    if (exp.endDate.toLowerCase() === 'present') {
      endYear = now.getFullYear();
      endMonth = now.getMonth() + 1; // getMonth()는 0-based
    } else {
      [endYear, endMonth] = exp.endDate.split('-').map(Number);
    }

    const months = (endYear - startYear) * 12 + (endMonth - startMonth);
    // 음수 방지 (비정상 데이터 방어)
    totalMonths += Math.max(0, months);
  }

  return totalMonths / 12;
}

/**
 * 경력 요구사항 충족 여부 확인
 *
 * @param experiences 경력 목록
 * @param minYears 최소 요구 경력 연수
 * @returns 충족 여부
 */
export function checkExperienceMet(
  experiences: Experience[],
  minYears: number
): boolean {
  return calculateExperienceYears(experiences) >= minYears;
}

/**
 * 전체 적합도 점수 계산 (가중 합산)
 *
 * 가중치:
 * - 기술 일치율: 50%
 * - 경력 충족:   30% (충족=100, 미충족=0)
 * - 역할 적합도: 20% (preferredRole 비어있으면 100, 포함되면 100, 아니면 0)
 *
 * 결과는 0~100으로 클램프.
 *
 * @param techMatchRate 기술 일치율 (0~100)
 * @param experienceMet 경력 충족 여부
 * @param preferredRole 기업 선호 역할
 * @param userTitle 사용자 직함
 * @returns 0~100 범위의 전체 적합도 점수
 */
export function calculateOverallScore(
  techMatchRate: number,
  experienceMet: boolean,
  preferredRole: string,
  userTitle: string
): number {
  const experienceScore = experienceMet ? 100 : 0;

  const roleScore =
    preferredRole.trim() === ''
      ? 100
      : userTitle.toLowerCase().includes(preferredRole.toLowerCase())
      ? 100
      : 0;

  const score =
    techMatchRate * 0.5 + experienceScore * 0.3 + roleScore * 0.2;

  return Math.min(100, Math.max(0, score));
}

/**
 * 포트폴리오 개선 제안 생성
 * 분석 결과를 바탕으로 최소 1개 이상의 개선 제안을 생성합니다.
 *
 * 제안 로직:
 * - 부족 기술이 있으면: 기술 습득 권장
 * - 경력 미충족이면: 경험 추가 권장
 * - 전체 점수 80 이상이면: 지원 격려
 * - 전체 점수 50 미만이면: 보완 권고
 * - 위 조건에 해당하는 제안이 없으면: 기본 제안 추가
 *
 * @param report suggestions를 제외한 FitReport
 * @returns 최소 1개 이상의 개선 제안 배열
 */
export function generateSuggestions(
  report: Omit<FitReport, 'suggestions'>
): string[] {
  const suggestions: string[] = [];

  if (report.missingSkills.length > 0) {
    suggestions.push(
      `다음 기술을 추가로 습득하는 것을 추천합니다: ${report.missingSkills.join(', ')}`
    );
  }

  if (!report.experienceMet) {
    suggestions.push('요구 경력을 충족하기 위해 관련 경험을 더 쌓으세요');
  }

  if (report.overallScore >= 80) {
    suggestions.push(
      '전반적으로 적합도가 높습니다. 포트폴리오를 잘 다듬어 지원해보세요!'
    );
  }

  if (report.overallScore < 50) {
    suggestions.push('포트폴리오를 더 보완하여 재도전해보세요');
  }

  // 위 조건에 해당하는 제안이 하나도 없는 경우 기본 제안 추가
  if (suggestions.length === 0) {
    suggestions.push(
      '포트폴리오를 꾸준히 업데이트하여 최신 상태를 유지하세요'
    );
  }

  return suggestions;
}

/**
 * 전체 적합도 분석 수행
 * ProfileData와 CompanyCriteria를 받아 FitReport를 반환합니다.
 *
 * @param profile 사용자 프로필 데이터
 * @param criteria 기업 인재상 기준
 * @returns 분석 결과 FitReport
 */
export function analyze(
  profile: ProfileData,
  criteria: CompanyCriteria
): FitReport {
  const techMatchRate = calculateTechMatchRate(
    profile.skills,
    criteria.requiredSkills
  );

  const missingSkills = calculateMissingSkills(
    profile.skills,
    criteria.requiredSkills
  );

  const experienceMet = checkExperienceMet(
    profile.experiences,
    criteria.minExperienceYears
  );

  const overallScore = calculateOverallScore(
    techMatchRate,
    experienceMet,
    criteria.preferredRole,
    profile.title
  );

  const partialReport: Omit<FitReport, 'suggestions'> = {
    techMatchRate,
    missingSkills,
    experienceMet,
    overallScore,
  };

  const suggestions = generateSuggestions(partialReport);

  return {
    ...partialReport,
    suggestions,
  };
}
