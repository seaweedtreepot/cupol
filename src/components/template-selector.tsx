'use client';

/**
 * 템플릿 선택 및 커스터마이징 컴포넌트
 *
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7
 */

import React, { useState, useCallback, useEffect, useId } from 'react';
import { useTemplateStore, DEFAULT_TEMPLATES } from '@/stores/template-store';
import { validateHexColor } from '@/lib/validators';
import type { Customization } from '@/types';

// ---------------------------------------------------------------------------
// 템플릿 썸네일 카드
// ---------------------------------------------------------------------------

/** 템플릿별 대표 이모지 */
const TEMPLATE_EMOJI: Record<string, string> = {
  modern: '🚀',
  classic: '📄',
  minimal: '✨',
};

/** 템플릿별 CSS 미리보기 색상 팔레트 */
const TEMPLATE_ACCENT: Record<string, { from: string; to: string }> = {
  modern: { from: '#3B82F6', to: '#1E40AF' },
  classic: { from: '#7C3AED', to: '#4C1D95' },
  minimal: { from: '#111827', to: '#374151' },
};

interface TemplateCardProps {
  id: string;
  name: string;
  isSelected: boolean;
  onSelect: () => void;
}

function TemplateCard({ id, name, isSelected, onSelect }: TemplateCardProps) {
  const emoji = TEMPLATE_EMOJI[id] ?? '🎨';
  const accent = TEMPLATE_ACCENT[id] ?? { from: '#3B82F6', to: '#1E40AF' };

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={isSelected}
      aria-label={`${name} 템플릿 선택`}
      className={[
        'relative flex flex-col items-center gap-2 rounded-xl border-2 p-3 transition-all focus:outline-none focus:ring-2 focus:ring-blue-400',
        isSelected
          ? 'border-blue-500 bg-blue-50 shadow-md ring-2 ring-blue-300'
          : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm',
      ].join(' ')}
    >
      {/* CSS 미리보기 박스 */}
      <div
        className="w-full h-20 rounded-lg overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${accent.from} 0%, ${accent.to} 100%)`,
        }}
        aria-hidden="true"
      >
        <div className="flex flex-col gap-1.5 p-2.5">
          <div className="h-2 w-3/4 rounded-full bg-white/80" />
          <div className="h-1.5 w-1/2 rounded-full bg-white/50" />
          <div className="mt-1 flex gap-1">
            <div className="h-1 w-8 rounded-full bg-white/40" />
            <div className="h-1 w-6 rounded-full bg-white/40" />
          </div>
        </div>
      </div>

      {/* 이름 + 이모지 */}
      <div className="flex items-center gap-1.5">
        <span className="text-lg">{emoji}</span>
        <span className="text-sm font-semibold text-gray-800">{name}</span>
      </div>

      {/* 선택 체크 배지 */}
      {isSelected && (
        <span
          className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-white text-xs"
          aria-hidden="true"
        >
          ✓
        </span>
      )}
    </button>
  );
}

// ---------------------------------------------------------------------------
// 색상 입력 필드
// ---------------------------------------------------------------------------

interface ColorInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

function ColorInput({ label, value, onChange }: ColorInputProps) {
  const uid = useId();
  const [draft, setDraft] = useState(value);
  const [error, setError] = useState<string | undefined>(undefined);

  // 외부 값 동기화 (커스터마이징 리셋 등)
  useEffect(() => {
    setDraft(value);
    setError(undefined);
  }, [value]);

  function handleChange(raw: string) {
    setDraft(raw);
    if (!raw || validateHexColor(raw)) {
      setError(undefined);
      if (raw) onChange(raw);
    } else {
      setError('유효한 HEX 색상코드를 입력해주세요. (예: #FF5733)');
    }
  }

  function handleColorPickerChange(e: React.ChangeEvent<HTMLInputElement>) {
    const hex = e.target.value; // native picker는 항상 #RRGGBB 반환
    setDraft(hex);
    setError(undefined);
    onChange(hex);
  }

  const hasError = Boolean(error);

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={uid} className="text-sm font-medium text-gray-700">
        {label}
      </label>

      <div className="flex items-center gap-2">
        {/* 네이티브 color picker (시각적 스와치 역할) */}
        <input
          type="color"
          value={validateHexColor(draft) ? draft : '#3B82F6'}
          onChange={handleColorPickerChange}
          aria-label={`${label} 색상 피커`}
          className="h-9 w-10 cursor-pointer rounded border border-gray-300 bg-transparent p-0.5"
        />

        {/* HEX 텍스트 입력 */}
        <input
          id={uid}
          type="text"
          value={draft}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="#RRGGBB"
          maxLength={7}
          aria-invalid={hasError}
          aria-describedby={hasError ? `${uid}-error` : undefined}
          className={[
            'w-32 rounded-md border px-3 py-2 text-sm font-mono outline-none transition-colors focus:ring-2',
            hasError
              ? 'border-red-500 focus:ring-red-300'
              : 'border-gray-300 focus:ring-blue-300',
          ].join(' ')}
        />

        {/* 색상 미리보기 스와치 */}
        {validateHexColor(draft) && (
          <div
            className="h-8 w-8 rounded-full border border-gray-200 shadow-sm"
            style={{ background: draft }}
            aria-hidden="true"
          />
        )}
      </div>

      {hasError && (
        <p id={`${uid}-error`} role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 라이브 미리보기 박스
// ---------------------------------------------------------------------------

interface PreviewBoxProps {
  customization: Customization;
  templateName: string;
}

function PreviewBox({ customization, templateName }: PreviewBoxProps) {
  const { primaryColor, secondaryColor, fontFamily } = customization;

  return (
    <div
      className="w-full rounded-xl border border-gray-200 overflow-hidden shadow-sm"
      role="img"
      aria-label="템플릿 미리보기"
    >
      {/* 헤더 영역 */}
      <div
        className="px-4 py-3 text-white"
        style={{ background: primaryColor, fontFamily }}
      >
        <div className="text-sm font-bold">홍길동</div>
        <div className="text-xs opacity-80 mt-0.5">풀스택 개발자</div>
      </div>

      {/* 본문 영역 */}
      <div className="bg-white px-4 py-3" style={{ fontFamily }}>
        <div
          className="text-xs font-semibold mb-2 pb-1 border-b"
          style={{ color: secondaryColor, borderColor: primaryColor }}
        >
          Skills
        </div>
        <div className="flex flex-wrap gap-1 mb-2">
          {['React', 'TypeScript', 'Next.js'].map((skill) => (
            <span
              key={skill}
              className="text-xs px-2 py-0.5 rounded-full text-white"
              style={{ background: primaryColor }}
            >
              {skill}
            </span>
          ))}
        </div>
        <div
          className="text-xs font-semibold mt-2 pb-1 border-b"
          style={{ color: secondaryColor, borderColor: primaryColor }}
        >
          Projects
        </div>
        <div className="text-xs text-gray-600 mt-1.5">
          <span className="font-medium" style={{ color: secondaryColor }}>
            포트폴리오 사이트
          </span>
          <span className="text-gray-400 ml-1">· {templateName} 템플릿</span>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 메인 TemplateSelector 컴포넌트
// ---------------------------------------------------------------------------

export interface TemplateSelectorProps {
  /** "다음 단계: 생성하기" 버튼 클릭 시 호출 */
  onNext: () => void;
  /** "이전" 버튼 클릭 시 호출 (선택적) */
  onBack?: () => void;
}

export function TemplateSelector({ onNext, onBack }: TemplateSelectorProps) {
  const { templates, selectedTemplate, customization, selectTemplate, updateCustomization } =
    useTemplateStore();

  // 미리보기는 debounce 없이 즉시 반영 (2초 이내 보장)
  // Requirements 5.3, 5.6
  const [previewCustomization, setPreviewCustomization] = useState<Customization>(customization);

  // customization 변경 시 미리보기 즉시 갱신
  useEffect(() => {
    setPreviewCustomization(customization);
  }, [customization]);

  const handleSelectTemplate = useCallback(
    (templateId: string) => {
      selectTemplate(templateId);
    },
    [selectTemplate]
  );

  const handlePrimaryColorChange = useCallback(
    (color: string) => {
      updateCustomization({ primaryColor: color });
    },
    [updateCustomization]
  );

  const handleSecondaryColorChange = useCallback(
    (color: string) => {
      updateCustomization({ secondaryColor: color });
    },
    [updateCustomization]
  );

  const handleFontChange = useCallback(
    (font: Customization['fontFamily']) => {
      updateCustomization({ fontFamily: font });
    },
    [updateCustomization]
  );

  const fontOptions: { value: Customization['fontFamily']; label: string; preview: string }[] = [
    { value: 'serif', label: 'Serif', preview: 'Georgia, serif' },
    { value: 'sans-serif', label: 'Sans-serif', preview: 'system-ui, sans-serif' },
    { value: 'monospace', label: 'Monospace', preview: 'monospace' },
  ];

  return (
    <div className="flex flex-col gap-8">
      {/* ── 섹션 1: 템플릿 선택 ── */}
      <section aria-labelledby="template-section-heading">
        <h2 id="template-section-heading" className="text-base font-semibold text-gray-800 mb-3">
          템플릿 선택
          <span className="ml-2 text-xs font-normal text-gray-400">최소 3개 제공</span>
        </h2>

        {/* 템플릿 카드 그리드 (Requirements 5.1) */}
        <div
          className="grid gap-3"
          style={{ gridTemplateColumns: `repeat(${Math.min(templates.length, 3)}, 1fr)` }}
          role="group"
          aria-label="템플릿 목록"
        >
          {templates.map((tpl) => (
            <TemplateCard
              key={tpl.id}
              id={tpl.id}
              name={tpl.name}
              isSelected={selectedTemplate.id === tpl.id}
              onSelect={() => handleSelectTemplate(tpl.id)}
            />
          ))}
        </div>
      </section>

      {/* ── 섹션 2: 색상 커스터마이징 ── */}
      <section aria-labelledby="color-section-heading">
        <h2 id="color-section-heading" className="text-base font-semibold text-gray-800 mb-3">
          색상 설정
        </h2>
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Requirements 5.4, 5.7 */}
          <ColorInput
            label="Primary Color"
            value={customization.primaryColor}
            onChange={handlePrimaryColorChange}
          />
          <ColorInput
            label="Secondary Color"
            value={customization.secondaryColor}
            onChange={handleSecondaryColorChange}
          />
        </div>
      </section>

      {/* ── 섹션 3: 폰트 선택 ── */}
      <section aria-labelledby="font-section-heading">
        <h2 id="font-section-heading" className="text-base font-semibold text-gray-800 mb-3">
          폰트 스타일
        </h2>
        {/* Requirements 5.5 */}
        <div className="flex flex-wrap gap-3" role="radiogroup" aria-label="폰트 스타일 선택">
          {fontOptions.map(({ value, label, preview }) => {
            const isSelected = customization.fontFamily === value;
            return (
              <label
                key={value}
                className={[
                  'flex cursor-pointer items-center gap-2 rounded-lg border-2 px-4 py-2.5 transition-all',
                  isSelected
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-blue-300',
                ].join(' ')}
              >
                <input
                  type="radio"
                  name="fontFamily"
                  value={value}
                  checked={isSelected}
                  onChange={() => handleFontChange(value)}
                  className="sr-only"
                />
                <span
                  className="text-sm font-medium text-gray-700"
                  style={{ fontFamily: preview }}
                >
                  {label}
                </span>
                <span
                  className="text-xs text-gray-400"
                  style={{ fontFamily: preview }}
                >
                  Aa
                </span>
              </label>
            );
          })}
        </div>
      </section>

      {/* ── 섹션 4: 라이브 미리보기 ── */}
      <section aria-labelledby="preview-section-heading">
        <h2 id="preview-section-heading" className="text-base font-semibold text-gray-800 mb-3">
          미리보기
          {/* Requirements 5.3, 5.6 - 변경 즉시 반영 (2초 이내) */}
          <span className="ml-2 text-xs font-normal text-gray-400">변경 사항이 즉시 반영됩니다</span>
        </h2>
        <PreviewBox
          customization={previewCustomization}
          templateName={selectedTemplate.name}
        />
      </section>

      {/* ── 하단 버튼 ── */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 text-sm text-gray-500 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            ← 이전
          </button>
        ) : (
          <div />
        )}

        <button
          type="button"
          onClick={onNext}
          className="px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 active:scale-95 transition-all shadow-sm"
        >
          다음 단계: 생성하기 →
        </button>
      </div>
    </div>
  );
}

export default TemplateSelector;
