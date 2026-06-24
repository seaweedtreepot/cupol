'use client';

/**
 * ErrorBoundary 컴포넌트
 * React Error Boundary - 에러 타입별 커폴이 메시지 분기
 * Requirements: 4.7, 11.4, 11.5
 */

import React from 'react';
import { MascotMessage } from './mascot-message';

export interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/** 에러 유형 분류 */
type ErrorCategory = 'network' | 'storage' | 'fatal';

function categorizeError(error: Error): ErrorCategory {
  const msg = error.message.toLowerCase();
  if (msg.includes('network') || msg.includes('fetch')) {
    return 'network';
  }
  if (msg.includes('localstorage') || msg.includes('storage') || msg.includes('quota')) {
    return 'storage';
  }
  return 'fatal';
}

/** 에러 유형별 커폴이 메시지 */
const ERROR_MESSAGES: Record<ErrorCategory, string> = {
  network: '앗, 마법이 잠깐 꼬였어요. 다시 시도해볼게요!',
  storage: '앗, 저장 공간에 문제가 생겼어요. 오래된 데이터를 정리해봐!',
  fatal: '앗, 예상치 못한 문제가 발생했어요. 새로고침으로 해결해봐!',
};

/** 복구 가능 에러 여부 */
function isRecoverable(category: ErrorCategory): boolean {
  return category === 'network';
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('[ErrorBoundary] Caught error:', error, info.componentStack);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    const { hasError, error } = this.state;
    const { children, fallback } = this.props;

    if (!hasError) {
      return children;
    }

    // 커스텀 fallback이 제공된 경우 그대로 사용
    if (fallback) {
      return fallback;
    }

    const category = error ? categorizeError(error) : 'fatal';
    const recoverable = isRecoverable(category);
    const message = ERROR_MESSAGES[category];

    return (
      <div
        className="flex flex-col items-center justify-center min-h-[200px] p-6 gap-4"
        role="alert"
        aria-live="assertive"
      >
        <MascotMessage type="error" message={message} />

        <div className="flex gap-3 mt-2">
          {recoverable ? (
            <button
              onClick={this.handleRetry}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
              aria-label="다시 시도하기"
            >
              다시 시도하기
            </button>
          ) : (
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2"
              aria-label="페이지 새로고침"
            >
              새로고침
            </button>
          )}
        </div>
      </div>
    );
  }
}

/**
 * withErrorBoundary HOC
 * 컴포넌트를 ErrorBoundary로 감싸는 고차 컴포넌트
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ReactNode,
): React.FC<P> {
  const WrappedComponent: React.FC<P> = (props) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName ?? Component.name ?? 'Component'})`;

  return WrappedComponent;
}

export default ErrorBoundary;
