'use client';

/**
 * 적합도 분석 페이지
 * Company_Criteria 입력 후 Fit Analyzer를 호출하고 결과를 표시한다.
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9
 */

import { useState, useCallback } from 'react';
import Link from 'next/link';
import Navigation from '@/components/navigation';
import MascotMessage from '@/components/mascot-message';
import { useProfileStore } from '@/stores/profile-store';
import { useAuthStore } from '@/stores/auth-store';
import { analyze } from '@/lib/fit-analyzer';
import type { CompanyCriteria, FitReport } from '@/types';

// ---------------------------------------------------------------------------
// 공통 UI 헬퍼
// ---------------------------------------------------------------------------

interface FieldWrapperProps {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}

function FieldWrapper({ label, required, error, hint, children }: FieldWrapperProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">
        {label}
        {required && (
          <span className="ml-0.5 text-red-500" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

function inputClass(hasError: boolean) {
  return [
    'w-full rounded-md border px-3 py-2 text-sm outline-none transition-colors focus:ring-2',
    hasError
      ? 'border-red-500 focus:ring-red-300'
      : 'border-gray-300 focus:ring-blue-300',
  ].join(' ');
}

// ---------------------------------------------------------------------------
// 요구 기술 스택 태그 입력 컴포넌트 (Requirements: 6.1, 6.9)
// ---------------------------------------------------------------------------

interface RequiredSkillsInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  error?: string;
}

function RequiredSkillsInput({ value, onChange, error }: RequiredSkillsInputProps) {
  const [input, setInput] = useState('');
  const hasError = Boolean(error);

  function addSkill(raw: string) {
    const tag = raw.trim();
    if (!tag || value.includes(tag)) return;
    onChange([...value, tag]);
    setInput('');
  }

  function removeSkill(idx: number) {
    onChange(value.filter((_, i) => i !== idx));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addSkill(input);
    }
    if (e.key === 'Backspace' && input === '' && value.length > 0) {
      removeSkill(value.length - 1);
    }
  }

  return (
    <div
      className={[
        'flex flex-wrap gap-1.5 rounded-md border px-3 py-2 text-sm transition-colors focus-within:ring-2 cursor-text',
        hasError
          ? 'border-red-500 focus-within:ring-red-300'
          : 'border-gray-300 focus-within:ring-blue-300',
      ].join(' ')}
    >
      {value.map((tag, i) => (
        <span
          key={i}
          className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-0.5 text-xs text-indigo-800"
        >
          {tag}
          <button
            type="button"
            aria-label={`${tag} 태그 제거`}
            onClick={() => removeSkill(i)}
            className="text-indigo-500 hover:text-indigo-900 focus:outline-none"
          >
            ×
          </button>
        </span>
      ))}
      <input
        type="text"
        value={input}
        placeholder={value.length === 0 ? 'Enter 또는 쉼표로 태그 추가' : undefined}
        aria-label="요구 기술 스택 입력"
        aria-invalid={hasError}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          if (input.trim()) addSkill(input);
        }}
        className="min-w-[160px] flex-1 bg-transparent outline-none"
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// 결과 표시 컴포넌트
// ---------------------------------------------------------------------------

/** 기술 일치율 색상 결정 (Requirements: 6.3) */
function getTechMatchColor(rate: number): string {
  if (rate >= 70) return 'bg-green-500';
  if (rate >= 40) return 'bg-yellow-400';
  return 'bg-red-500';
}

function getTechMatchTextColor(rate: number): string {
  if (rate >= 70) return 'text-green-700';
  if (rate >= 40) return 'text-yellow-700';
  return 'text-red-600';
}

/** 전체 적합도 게이지 색상 (Requirements: 6.6) */
function getOverallScoreColor(score: number): string {
  if (score >= 70) return 'bg-blue-500';
  if (score >= 40) return 'bg-indigo-400';
  return 'bg-purple-500';
}

interface FitResultProps {
  report: FitReport;
}

function FitResult({ report }: FitResultProps) {
  const { techMatchRate, missingSkills, experienceMet, overallScore, suggestions } =
    report;

  return (
    <div className="flex flex-col gap-6 mt-6">
      {/* 커폴이 완료 메시지 */}
      <MascotMessage
        type="success"
        message="분석 완료! 결과를 확인해봐. 개선 제안도 꼼꼼히 읽어봐 💪"
      />

      {/* ---- 기술 일치율 (Requirements: 6.3) ---- */}
      <section
        aria-labelledby="tech-match-heading"
        className="bg-white rounded-xl border border-gray-100 shadow-sm p-5"
      >
        <h2
          id="tech-match-heading"
          className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3"
        >
          기술 일치율
        </h2>
        <div className="flex items-center gap-3">
          <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${getTechMatchColor(techMatchRate)}`}
              style={{ width: `${techMatchRate}%` }}
              role="progressbar"
              aria-valuenow={techMatchRate}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`기술 일치율 ${Math.round(techMatchRate)}%`}
            />
          </div>
          <span
            className={`text-lg font-bold min-w-[52px] text-right ${getTechMatchTextColor(techMatchRate)}`}
          >
            {Math.round(techMatchRate)}%
          </span>
        </div>
      </section>

      {/* ---- 부족 기술 목록 (Requirements: 6.4) ---- */}
      <section
        aria-labelledby="missing-skills-heading"
        className="bg-white rounded-xl border border-gray-100 shadow-sm p-5"
      >
        <h2
          id="missing-skills-heading"
          className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3"
        >
          부족 기술
        </h2>
        {missingSkills.length === 0 ? (
          <p className="text-sm text-green-600 font-medium">없음 ✅</p>
        ) : (
          <ul className="flex flex-wrap gap-2" aria-label="부족 기술 목록">
            {missingSkills.map((skill) => (
              <li key={skill}>
                <span className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-800">
                  {skill}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ---- 경력 충족 여부 (Requirements: 6.5) ---- */}
      <section
        aria-labelledby="experience-heading"
        className="bg-white rounded-xl border border-gray-100 shadow-sm p-5"
      >
        <h2
          id="experience-heading"
          className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3"
        >
          경력 요구사항
        </h2>
        {experienceMet ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-4 py-1.5 text-sm font-semibold text-green-800">
            ✅ 충족
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-4 py-1.5 text-sm font-semibold text-red-800">
            ❌ 미충족
          </span>
        )}
      </section>

      {/* ---- 전체 적합도 점수 게이지 (Requirements: 6.6) ---- */}
      <section
        aria-labelledby="overall-score-heading"
        className="bg-white rounded-xl border border-gray-100 shadow-sm p-5"
      >
        <h2
          id="overall-score-heading"
          className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3"
        >
          전체 적합도 점수
        </h2>
        <div className="flex flex-col gap-2">
          {/* 반원형 게이지처럼 보이도록 수치 강조 + 프로그레스바 */}
          <div className="flex items-end gap-2">
            <span className="text-4xl font-extrabold text-gray-800">
              {Math.round(overallScore)}
            </span>
            <span className="text-lg font-semibold text-gray-500 mb-1">/ 100</span>
          </div>
          <div className="w-full h-5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${getOverallScoreColor(overallScore)}`}
              style={{ width: `${overallScore}%` }}
              role="progressbar"
              aria-valuenow={overallScore}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`전체 적합도 점수 ${Math.round(overallScore)}점`}
            />
          </div>
        </div>
      </section>

      {/* ---- 개선 제안 (Requirements: 6.7) ---- */}
      <section
        aria-labelledby="suggestions-heading"
        className="bg-white rounded-xl border border-gray-100 shadow-sm p-5"
      >
        <h2
          id="suggestions-heading"
          className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3"
        >
          개선 제안
        </h2>
        <ul className="flex flex-col gap-2" aria-label="개선 제안 목록">
          {suggestions.map((suggestion, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
              <span
                className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center"
                aria-hidden="true"
              >
                {i + 1}
              </span>
              {suggestion}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 메인 페이지 컴포넌트
// ---------------------------------------------------------------------------

export default function FitAnalysisPage() {
  // Stores
  const activeProfileId = useProfileStore((state) => state.activeProfileId);
  const profiles = useProfileStore((state) => state.profiles);
  const user = useAuthStore((state) => state.user);

  const activeProfile = profiles.find((p) => p.id === activeProfileId) ?? null;

  // 프로필 유효성: skills 또는 experiences 중 하나 이상 데이터 있어야 함 (Requirements: 6.8)
  const hasProfileData =
    activeProfile !== null &&
    (activeProfile.skills.length > 0 || activeProfile.experiences.length > 0);

  // 폼 상태
  const [requiredSkills, setRequiredSkills] = useState<string[]>([]);
  const [minExperienceYears, setMinExperienceYears] = useState<number>(0);
  const [preferredRole, setPreferredRole] = useState('');
  const [additionalRequirements, setAdditionalRequirements] = useState('');

  // 검증 오류
  const [skillsError, setSkillsError] = useState('');

  // 분석 상태
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [report, setReport] = useState<FitReport | null>(null);

  /** 분석 실행 (Requirements: 6.2, 6.9) */
  const handleAnalyze = useCallback(() => {
    // 기술 스택 필수 검증 (Requirements: 6.9)
    if (requiredSkills.length === 0) {
      setSkillsError('요구 기술 스택을 1개 이상 입력해주세요.');
      return;
    }
    setSkillsError('');

    // Profile_Data 미입력 시 분석 수행하지 않음 (Requirements: 6.8)
    // — 이 경우 버튼 자체가 보이지 않으므로 방어 코드로만 둠
    if (!hasProfileData || !activeProfile) return;

    setIsAnalyzing(true);
    setReport(null);

    // 동기 함수이지만 UX를 위해 약간의 딜레이 (진행 중 표시)
    setTimeout(() => {
      const criteria: CompanyCriteria = {
        requiredSkills,
        minExperienceYears,
        preferredRole,
        additionalRequirements,
      };

      const result = analyze(activeProfile, criteria);
      setReport(result);
      setIsAnalyzing(false);
    }, 400);
  }, [
    requiredSkills,
    minExperienceYears,
    preferredRole,
    additionalRequirements,
    activeProfile,
    hasProfileData,
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* 페이지 제목 */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">적합도 분석</h1>
        <p className="text-sm text-gray-500 mb-6">
          기업 인재상 조건을 입력하면 내 포트폴리오와 비교 분석해줘요.
        </p>

        {/* ---- Profile_Data 미입력 안내 (Requirements: 6.8) ---- */}
        {!hasProfileData ? (
          <div className="flex flex-col gap-4">
            <MascotMessage
              type="guide"
              message="포트폴리오 정보를 먼저 입력해줘! 프로필 페이지로 이동해봐 →"
            />
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex flex-col items-center gap-4">
              <p className="text-sm text-gray-600 text-center">
                적합도 분석을 하려면 기술 스택이나 경력 정보가 필요해요.
                <br />
                먼저 포트폴리오를 작성해주세요!
              </p>
              <Link
                href="/portfolio/create"
                className="inline-flex items-center gap-1 px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
              >
                포트폴리오 만들기 →
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* ---- 커폴이 가이드 메시지 ---- */}
            {!isAnalyzing && !report && (
              <div className="mb-6">
                <MascotMessage
                  type="guide"
                  message={`${user?.name ?? ''}의 프로필로 분석할게! 기업 조건을 입력해봐 🔍`}
                />
              </div>
            )}
            {isAnalyzing && (
              <div className="mb-6">
                <MascotMessage
                  type="loading"
                  message="커폴이가 적합도를 분석하는 중이야... 잠깐만 기다려봐!"
                />
              </div>
            )}

            {/* ---- Company_Criteria 입력 폼 (Requirements: 6.1) ---- */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-base font-semibold text-gray-800 mb-5">
                기업 인재상 조건 입력
              </h2>

              <div className="flex flex-col gap-5">
                {/* 요구 기술 스택 (Required, min 1) */}
                <FieldWrapper
                  label="요구 기술 스택"
                  required
                  error={skillsError}
                  hint="Enter 또는 쉼표(,)로 태그를 추가하세요."
                >
                  <RequiredSkillsInput
                    value={requiredSkills}
                    onChange={(tags) => {
                      setRequiredSkills(tags);
                      if (tags.length > 0) setSkillsError('');
                    }}
                    error={skillsError}
                  />
                </FieldWrapper>

                {/* 최소 경력 연수 */}
                <FieldWrapper label="최소 경력 연수" hint="0 입력 시 경력 무관">
                  <input
                    type="number"
                    min={0}
                    step={0.5}
                    value={minExperienceYears}
                    onChange={(e) =>
                      setMinExperienceYears(Math.max(0, Number(e.target.value)))
                    }
                    className={inputClass(false)}
                    aria-label="최소 경력 연수"
                  />
                </FieldWrapper>

                {/* 선호 역할 */}
                <FieldWrapper label="선호 역할" hint="예: 프론트엔드 개발자, 백엔드 개발자 (선택)">
                  <input
                    type="text"
                    value={preferredRole}
                    onChange={(e) => setPreferredRole(e.target.value)}
                    placeholder="예: 프론트엔드 개발자"
                    className={inputClass(false)}
                    aria-label="선호 역할"
                  />
                </FieldWrapper>

                {/* 기타 요구사항 */}
                <FieldWrapper label="기타 요구사항" hint="자유롭게 기입 (선택)">
                  <textarea
                    value={additionalRequirements}
                    onChange={(e) => setAdditionalRequirements(e.target.value)}
                    placeholder="예: 팀워크 우선, 자기주도적 학습 가능자"
                    rows={3}
                    className={
                      inputClass(false) + ' resize-y min-h-[72px]'
                    }
                    aria-label="기타 요구사항"
                  />
                </FieldWrapper>
              </div>

              {/* 분석 버튼 (Requirements: 6.2) */}
              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="px-6 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                  {isAnalyzing ? '분석 중...' : '분석하기 🔍'}
                </button>
              </div>
            </div>

            {/* ---- 분석 결과 표시 (Requirements: 6.3~6.7) ---- */}
            {report && <FitResult report={report} />}
          </>
        )}
      </main>
    </div>
  );
}
