'use client';

/**
 * 재사용 가능한 폼 필드 공통 컴포넌트
 *
 * Requirements: 10.3, 10.4, 10.5, 3.6
 */

import React, { useState, useId, useRef, KeyboardEvent } from 'react';
import type { ZodSchema } from 'zod';
import { validateUrl, validateEmail } from '@/lib/validators';

export interface FormFieldProps {
  label: string;
  name: string;
  type: 'text' | 'email' | 'url' | 'textarea' | 'tags';
  validation?: ZodSchema;
  maxLength?: number;
  error?: string;
  value?: string | string[];
  onChange?: (value: string | string[]) => void;
  onBlur?: () => void;
  placeholder?: string;
  required?: boolean;
}

// ---------------------------------------------------------------------------
// 에러 메시지 컴포넌트
// ---------------------------------------------------------------------------

interface ErrorMessageProps {
  id: string;
  message: string;
}

function ErrorMessage({ id, message }: ErrorMessageProps) {
  return (
    <p id={id} role="alert" className="mt-1 text-sm text-red-600">
      {message}
    </p>
  );
}

// ---------------------------------------------------------------------------
// 공통 input className 생성 헬퍼
// ---------------------------------------------------------------------------

function inputClass(hasError: boolean, extra = ''): string {
  const base =
    'w-full rounded-md border px-3 py-2 text-sm outline-none transition-colors focus:ring-2';
  const errorStyles = hasError
    ? 'border-red-500 focus:ring-red-300'
    : 'border-gray-300 focus:ring-blue-300';
  return [base, errorStyles, extra].filter(Boolean).join(' ');
}

// ---------------------------------------------------------------------------
// Tags 타입 서브컴포넌트
// ---------------------------------------------------------------------------

interface TagsFieldProps {
  id: string;
  name: string;
  tags: string[];
  maxLength?: number; // 태그 최대 개수
  error?: string;
  errorId: string;
  placeholder?: string;
  required?: boolean;
  onChange: (tags: string[]) => void;
  onBlur?: () => void;
}

function TagsField({
  id,
  name,
  tags,
  maxLength,
  error,
  errorId,
  placeholder,
  required,
  onChange,
  onBlur,
}: TagsFieldProps) {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const hasError = Boolean(error);
  const isMaxReached = maxLength !== undefined && tags.length >= maxLength;

  function addTag(raw: string) {
    const tag = raw.trim();
    if (!tag) return;
    if (tags.includes(tag)) return; // 중복 방지
    if (isMaxReached) return;
    onChange([...tags, tag]);
    setInputValue('');
  }

  function removeTag(index: number) {
    const updated = tags.filter((_, i) => i !== index);
    onChange(updated);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(inputValue);
    }
    // Backspace on empty input → remove last tag
    if (e.key === 'Backspace' && inputValue === '' && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  }

  return (
    <div>
      {/* 태그 pill + 입력 영역 */}
      <div
        className={[
          'flex flex-wrap gap-1.5 rounded-md border px-3 py-2 text-sm transition-colors focus-within:ring-2',
          hasError
            ? 'border-red-500 focus-within:ring-red-300'
            : 'border-gray-300 focus-within:ring-blue-300',
        ].join(' ')}
        onClick={() => inputRef.current?.focus()}
      >
        {tags.map((tag, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-800"
          >
            {tag}
            <button
              type="button"
              aria-label={`${tag} 태그 제거`}
              onClick={(e) => {
                e.stopPropagation();
                removeTag(i);
              }}
              className="ml-0.5 text-blue-500 hover:text-blue-800 focus:outline-none"
            >
              ×
            </button>
          </span>
        ))}

        {!isMaxReached && (
          <input
            ref={inputRef}
            id={id}
            name={name}
            type="text"
            value={inputValue}
            placeholder={tags.length === 0 ? placeholder : undefined}
            required={required && tags.length === 0}
            aria-invalid={hasError}
            aria-describedby={hasError ? errorId : undefined}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => {
              // 입력 중인 값이 있으면 태그로 추가
              if (inputValue.trim()) {
                addTag(inputValue);
              }
              onBlur?.();
            }}
            className="min-w-[120px] flex-1 bg-transparent outline-none"
          />
        )}

        {isMaxReached && (
          <span className="text-xs text-gray-400 self-center">
            최대 {maxLength}개
          </span>
        )}
      </div>

      {/* 최대 개수 도달 안내 (Requirement 3.8) */}
      {isMaxReached && !hasError && (
        <p className="mt-1 text-xs text-gray-500">
          태그를 최대 {maxLength}개까지 입력할 수 있습니다.
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 메인 FormField 컴포넌트
// ---------------------------------------------------------------------------

export function FormField({
  label,
  name,
  type,
  validation,
  maxLength,
  error: externalError,
  value,
  onChange,
  onBlur,
  placeholder,
  required,
}: FormFieldProps) {
  const uid = useId();
  const inputId = `${uid}-${name}`;
  const errorId = `${uid}-${name}-error`;

  // 내부 에러 상태: onBlur 검증에서 설정, 부모 error prop이 있으면 우선
  const [internalError, setInternalError] = useState<string | undefined>(undefined);

  // 부모가 전달한 error가 있으면 우선 사용
  const activeError = externalError ?? internalError;
  const hasError = Boolean(activeError);

  // ----- onBlur 핸들러 -----
  function handleBlur() {
    if (type === 'url') {
      const strValue = typeof value === 'string' ? value : '';
      if (strValue && !validateUrl(strValue)) {
        setInternalError('http:// 또는 https://를 포함한 유효한 URL을 입력해주세요.');
      } else {
        setInternalError(undefined);
      }
    } else if (type === 'email') {
      const strValue = typeof value === 'string' ? value : '';
      if (strValue && !validateEmail(strValue)) {
        setInternalError('유효한 이메일 주소를 입력해주세요. (예: name@example.com)');
      } else {
        setInternalError(undefined);
      }
    } else if (validation && typeof value === 'string') {
      const result = validation.safeParse(value);
      if (!result.success) {
        const msg = result.error.errors[0]?.message ?? '입력값을 확인해주세요.';
        setInternalError(msg);
      } else {
        setInternalError(undefined);
      }
    }

    onBlur?.();
  }

  // ----- onChange 핸들러: 에러 즉시 해제 (Requirement 10.5) -----
  function handleChange(val: string | string[]) {
    // 값이 변경되면 내부 에러 초기화
    setInternalError(undefined);
    onChange?.(val);
  }

  // ----- 렌더 분기 -----

  if (type === 'tags') {
    const tagsValue = Array.isArray(value) ? value : [];
    return (
      <div className="flex flex-col gap-1">
        <label htmlFor={inputId} className="text-sm font-medium text-gray-700">
          {label}
          {required && <span className="ml-0.5 text-red-500">*</span>}
        </label>

        <TagsField
          id={inputId}
          name={name}
          tags={tagsValue}
          maxLength={maxLength}
          error={activeError}
          errorId={errorId}
          placeholder={placeholder}
          required={required}
          onChange={(tags) => handleChange(tags)}
          onBlur={handleBlur}
        />

        {hasError && <ErrorMessage id={errorId} message={activeError!} />}
      </div>
    );
  }

  if (type === 'textarea') {
    const strValue = typeof value === 'string' ? value : '';
    return (
      <div className="flex flex-col gap-1">
        <label htmlFor={inputId} className="text-sm font-medium text-gray-700">
          {label}
          {required && <span className="ml-0.5 text-red-500">*</span>}
        </label>

        <textarea
          id={inputId}
          name={name}
          value={strValue}
          maxLength={maxLength}
          placeholder={placeholder}
          required={required}
          aria-invalid={hasError}
          aria-describedby={hasError ? errorId : undefined}
          className={inputClass(hasError, 'resize-y min-h-[100px]')}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={handleBlur}
          rows={4}
        />

        {hasError && <ErrorMessage id={errorId} message={activeError!} />}
      </div>
    );
  }

  // text | email | url
  const strValue = typeof value === 'string' ? value : '';
  const htmlType = type === 'url' ? 'url' : type === 'email' ? 'email' : 'text';

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={inputId} className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>

      <input
        id={inputId}
        name={name}
        type={htmlType}
        value={strValue}
        maxLength={maxLength}
        placeholder={placeholder}
        required={required}
        aria-invalid={hasError}
        aria-describedby={hasError ? errorId : undefined}
        className={inputClass(hasError)}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={handleBlur}
      />

      {hasError && <ErrorMessage id={errorId} message={activeError!} />}
    </div>
  );
}

export default FormField;
