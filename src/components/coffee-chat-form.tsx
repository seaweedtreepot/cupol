'use client';

/**
 * 커피챗 요청 폼 모달 컴포넌트
 *
 * Requirements: 8.11, 8.12, 8.13
 */

import React, { useState, useEffect, useCallback } from 'react';
import type { UserSession } from '@/types';
import { useCommunityStore } from '@/stores/community-store';
import { validateEmail } from '@/lib/validators';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface CoffeeChatFormProps {
  /** 커피챗 요청을 받을 대상 사용자 ID */
  toUserId: string;
  /** 커피챗 요청을 받을 대상 사용자 이름 (폼 헤더에 표시) */
  toUserName: string;
  /** 현재 로그인 사용자 세션 (없으면 null) */
  fromUser: UserSession | null;
  /** 모달 닫기 콜백 */
  onClose: () => void;
  /** 제출 성공 후 콜백 */
  onSuccess: () => void;
}

// ---------------------------------------------------------------------------
// 폼 필드 상태 타입
// ---------------------------------------------------------------------------

interface FormValues {
  requesterName: string;
  requesterEmail: string;
  requesterOrganization: string;
  message: string;
}

interface FormErrors {
  requesterName?: string;
  requesterEmail?: string;
  message?: string;
}

// ---------------------------------------------------------------------------
// 헬퍼: 필수 필드 검증
// ---------------------------------------------------------------------------

function validateForm(values: FormValues): FormErrors {
  const errors: FormErrors = {};

  if (!values.requesterName || values.requesterName.trim() === '') {
    errors.requesterName = '이름은 필수 입력 항목입니다.';
  }

  if (!values.requesterEmail || values.requesterEmail.trim() === '') {
    errors.requesterEmail = '이메일은 필수 입력 항목입니다.';
  } else if (!validateEmail(values.requesterEmail)) {
    errors.requesterEmail = '유효한 이메일 주소를 입력해주세요. (예: name@example.com)';
  }

  if (!values.message || values.message.trim() === '') {
    errors.message = '메시지는 필수 입력 항목입니다.';
  }

  return errors;
}

// ---------------------------------------------------------------------------
// 입력 필드 공통 스타일 헬퍼
// ---------------------------------------------------------------------------

function inputClass(hasError: boolean): string {
  const base =
    'w-full rounded-md border px-3 py-2 text-sm outline-none transition-colors focus:ring-2';
  return hasError
    ? `${base} border-red-500 focus:ring-red-300`
    : `${base} border-gray-300 focus:ring-blue-300`;
}

// ---------------------------------------------------------------------------
// CoffeeChatForm 컴포넌트
// ---------------------------------------------------------------------------

export function CoffeeChatForm({
  toUserId,
  toUserName,
  fromUser,
  onClose,
  onSuccess,
}: CoffeeChatFormProps) {
  const addChatRequest = useCommunityStore((s) => s.addChatRequest);

  // 폼 값 초기화: 로그인 사용자 정보가 있으면 미리 채움
  const [values, setValues] = useState<FormValues>({
    requesterName: fromUser?.name ?? '',
    requesterEmail: fromUser?.email ?? '',
    requesterOrganization: '',
    message: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // ESC 키로 모달 닫기
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // 필드 변경 핸들러: 값 변경 시 해당 필드 에러 즉시 해제 (Req 10.5와 일관성)
  function handleChange(field: keyof FormValues, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
    if (submitted) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }

  // 이메일 포커스 해제 시 형식 검증 (Req 10.2)
  function handleEmailBlur() {
    const email = values.requesterEmail.trim();
    if (email && !validateEmail(email)) {
      setErrors((prev) => ({
        ...prev,
        requesterEmail: '유효한 이메일 주소를 입력해주세요. (예: name@example.com)',
      }));
    } else if (errors.requesterEmail && email && validateEmail(email)) {
      setErrors((prev) => ({ ...prev, requesterEmail: undefined }));
    }
  }

  // 제출 핸들러
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);

    const validationErrors = validateForm(values);
    if (Object.keys(validationErrors).length > 0) {
      // Req 8.12: 필수 필드 누락 시 제출 차단 + 에러 표시
      setErrors(validationErrors);
      return;
    }

    // Req 8.13: 커뮤니티 스토어에 요청 추가
    const request = {
      id: `chat_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      fromUserId: fromUser?.id ?? 'anonymous',
      toUserId,
      requesterName: values.requesterName.trim(),
      requesterEmail: values.requesterEmail.trim(),
      requesterOrganization: values.requesterOrganization.trim(),
      message: values.message.trim(),
      status: 'pending' as const,
      createdAt: new Date().toISOString(),
    };

    addChatRequest(request);
    setIsSuccess(true);

    // 1.5초 뒤 onSuccess 콜백 호출
    setTimeout(() => {
      onSuccess();
    }, 1500);
  }

  // ---------------------------------------------------------------------------
  // 성공 화면
  // ---------------------------------------------------------------------------

  if (isSuccess) {
    return (
      <ModalOverlay onClose={onClose}>
        <div className="flex flex-col items-center gap-4 p-2 text-center">
          {/* 커폴이 성공 일러스트 (Req 11.3) */}
          <div
            className="flex items-center justify-center rounded-full bg-green-100"
            style={{ width: 64, height: 64 }}
            aria-hidden="true"
          >
            <span className="text-3xl">🧙</span>
          </div>
          <p className="text-lg font-semibold text-gray-800">
            커피챗 요청을 보냈어요!
          </p>
          <p className="text-sm text-gray-500">
            {toUserName}님에게 요청이 전달됐어. 답변을 기다려봐!
          </p>
        </div>
      </ModalOverlay>
    );
  }

  // ---------------------------------------------------------------------------
  // 폼 화면
  // ---------------------------------------------------------------------------

  return (
    <ModalOverlay onClose={onClose}>
      {/* 헤더 */}
      <div className="mb-5 flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            ☕ 커피챗 요청
          </h2>
          <p className="mt-0.5 text-sm text-gray-500">
            {toUserName}님에게 커피챗을 요청할게요
          </p>
        </div>
        <button
          type="button"
          aria-label="모달 닫기"
          onClick={onClose}
          className="ml-2 rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>

      {/* 폼 */}
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        {/* 이름 (필수) */}
        <div className="flex flex-col gap-1">
          <label
            htmlFor="cc-requesterName"
            className="text-sm font-medium text-gray-700"
          >
            이름 <span className="text-red-500">*</span>
          </label>
          <input
            id="cc-requesterName"
            type="text"
            value={values.requesterName}
            placeholder="홍길동"
            aria-required="true"
            aria-invalid={Boolean(errors.requesterName)}
            aria-describedby={
              errors.requesterName ? 'cc-requesterName-error' : undefined
            }
            className={inputClass(Boolean(errors.requesterName))}
            onChange={(e) => handleChange('requesterName', e.target.value)}
          />
          {errors.requesterName && (
            <p
              id="cc-requesterName-error"
              role="alert"
              className="text-sm text-red-600"
            >
              {errors.requesterName}
            </p>
          )}
        </div>

        {/* 이메일 (필수) */}
        <div className="flex flex-col gap-1">
          <label
            htmlFor="cc-requesterEmail"
            className="text-sm font-medium text-gray-700"
          >
            이메일 <span className="text-red-500">*</span>
          </label>
          <input
            id="cc-requesterEmail"
            type="email"
            value={values.requesterEmail}
            placeholder="name@example.com"
            aria-required="true"
            aria-invalid={Boolean(errors.requesterEmail)}
            aria-describedby={
              errors.requesterEmail ? 'cc-requesterEmail-error' : undefined
            }
            className={inputClass(Boolean(errors.requesterEmail))}
            onChange={(e) => handleChange('requesterEmail', e.target.value)}
            onBlur={handleEmailBlur}
          />
          {errors.requesterEmail && (
            <p
              id="cc-requesterEmail-error"
              role="alert"
              className="text-sm text-red-600"
            >
              {errors.requesterEmail}
            </p>
          )}
        </div>

        {/* 소속 (선택) */}
        <div className="flex flex-col gap-1">
          <label
            htmlFor="cc-requesterOrganization"
            className="text-sm font-medium text-gray-700"
          >
            소속{' '}
            <span className="text-xs font-normal text-gray-400">(선택)</span>
          </label>
          <input
            id="cc-requesterOrganization"
            type="text"
            value={values.requesterOrganization}
            placeholder="회사명 또는 학교명"
            className={inputClass(false)}
            onChange={(e) =>
              handleChange('requesterOrganization', e.target.value)
            }
          />
        </div>

        {/* 메시지 (필수, 최대 500자) */}
        <div className="flex flex-col gap-1">
          <label
            htmlFor="cc-message"
            className="flex items-center justify-between text-sm font-medium text-gray-700"
          >
            <span>
              메시지 <span className="text-red-500">*</span>
            </span>
            <span
              className={`text-xs font-normal ${
                values.message.length > 500 ? 'text-red-500' : 'text-gray-400'
              }`}
            >
              {values.message.length} / 500
            </span>
          </label>
          <textarea
            id="cc-message"
            value={values.message}
            placeholder="커피챗을 요청하는 이유나 궁금한 점을 자유롭게 적어봐!"
            maxLength={500}
            rows={4}
            aria-required="true"
            aria-invalid={Boolean(errors.message)}
            aria-describedby={errors.message ? 'cc-message-error' : undefined}
            className={inputClass(Boolean(errors.message)) + ' resize-y min-h-[100px]'}
            onChange={(e) => handleChange('message', e.target.value)}
          />
          {errors.message && (
            <p
              id="cc-message-error"
              role="alert"
              className="text-sm text-red-600"
            >
              {errors.message}
            </p>
          )}
        </div>

        {/* 버튼 영역 */}
        <div className="mt-1 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            취소
          </button>
          <button
            type="submit"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-50"
          >
            요청 보내기
          </button>
        </div>
      </form>
    </ModalOverlay>
  );
}

// ---------------------------------------------------------------------------
// ModalOverlay: 반투명 배경 + 중앙 카드
// ---------------------------------------------------------------------------

interface ModalOverlayProps {
  onClose: () => void;
  children: React.ReactNode;
}

function ModalOverlay({ onClose, children }: ModalOverlayProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* 반투명 배경 */}
      <div
        className="absolute inset-0 bg-black/50"
        aria-hidden="true"
        onClick={onClose}
      />

      {/* 중앙 카드 */}
      <div className="relative z-10 w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        {children}
      </div>
    </div>
  );
}

export default CoffeeChatForm;
