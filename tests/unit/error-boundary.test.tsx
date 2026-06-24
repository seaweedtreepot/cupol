/**
 * ErrorBoundary 컴포넌트 단위 테스트
 * Requirements: 4.7, 11.4, 11.5
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ErrorBoundary, withErrorBoundary } from '@/components/error-boundary';

// ---------------------------------------------------------------------------
// 에러를 던지는 테스트용 컴포넌트
// ---------------------------------------------------------------------------

function ThrowError({ message }: { message: string }): React.ReactElement {
  throw new Error(message);
}

function SafeChild(): React.ReactElement {
  return <div>안전한 자식 컴포넌트</div>;
}

// ---------------------------------------------------------------------------
// 에러 콘솔 억제 (ErrorBoundary가 콘솔에 에러 출력)
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// 정상 렌더링
// ---------------------------------------------------------------------------

describe('ErrorBoundary - 정상 렌더링', () => {
  it('에러가 없으면 자식을 정상 렌더링한다', () => {
    render(
      <ErrorBoundary>
        <SafeChild />
      </ErrorBoundary>
    );
    expect(screen.getByText('안전한 자식 컴포넌트')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// 네트워크 에러 (복구 가능)
// ---------------------------------------------------------------------------

describe('ErrorBoundary - 네트워크 에러', () => {
  it('network 에러 발생 시 커폴이 에러 메시지를 표시한다', () => {
    render(
      <ErrorBoundary>
        <ThrowError message="network request failed" />
      </ErrorBoundary>
    );
    expect(
      screen.getByText('앗, 마법이 잠깐 꼬였어요. 다시 시도해볼게요!')
    ).toBeInTheDocument();
  });

  it('fetch 에러 발생 시 커폴이 에러 메시지를 표시한다', () => {
    render(
      <ErrorBoundary>
        <ThrowError message="fetch failed" />
      </ErrorBoundary>
    );
    expect(
      screen.getByText('앗, 마법이 잠깐 꼬였어요. 다시 시도해볼게요!')
    ).toBeInTheDocument();
  });

  it('네트워크 에러 시 "다시 시도하기" 버튼이 표시된다', () => {
    render(
      <ErrorBoundary>
        <ThrowError message="network error" />
      </ErrorBoundary>
    );
    expect(screen.getByRole('button', { name: '다시 시도하기' })).toBeInTheDocument();
  });

  it('"다시 시도하기" 버튼 클릭 시 에러 상태가 리셋된다', () => {
    // 에러가 초기에만 발생하도록 플래그 사용
    let shouldThrow = true;

    function MaybeThrow(): React.ReactElement {
      if (shouldThrow) {
        throw new Error('network error');
      }
      return <div>복구됨</div>;
    }

    render(
      <ErrorBoundary>
        <MaybeThrow />
      </ErrorBoundary>
    );

    // 에러 상태 확인
    expect(screen.getByText('앗, 마법이 잠깐 꼬였어요. 다시 시도해볼게요!')).toBeInTheDocument();

    // 재시도 시 에러 없이 렌더링되도록 플래그 변경
    shouldThrow = false;
    fireEvent.click(screen.getByRole('button', { name: '다시 시도하기' }));

    expect(screen.getByText('복구됨')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// 스토리지 에러
// ---------------------------------------------------------------------------

describe('ErrorBoundary - 스토리지 에러', () => {
  it('localStorage 에러 발생 시 스토리지 안내 메시지를 표시한다', () => {
    render(
      <ErrorBoundary>
        <ThrowError message="localStorage is not available" />
      </ErrorBoundary>
    );
    expect(
      screen.getByText('앗, 저장 공간에 문제가 생겼어요. 오래된 데이터를 정리해봐!')
    ).toBeInTheDocument();
  });

  it('storage quota 에러 발생 시 스토리지 안내 메시지를 표시한다', () => {
    render(
      <ErrorBoundary>
        <ThrowError message="quota exceeded" />
      </ErrorBoundary>
    );
    expect(
      screen.getByText('앗, 저장 공간에 문제가 생겼어요. 오래된 데이터를 정리해봐!')
    ).toBeInTheDocument();
  });

  it('스토리지 에러 시 "새로고침" 버튼이 표시된다', () => {
    render(
      <ErrorBoundary>
        <ThrowError message="storage error" />
      </ErrorBoundary>
    );
    expect(screen.getByRole('button', { name: '페이지 새로고침' })).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// 치명적 에러 (복구 불가)
// ---------------------------------------------------------------------------

describe('ErrorBoundary - 치명적 에러', () => {
  it('예상치 못한 에러 발생 시 치명적 에러 메시지를 표시한다', () => {
    render(
      <ErrorBoundary>
        <ThrowError message="unexpected error occurred" />
      </ErrorBoundary>
    );
    expect(
      screen.getByText('앗, 예상치 못한 문제가 발생했어요. 새로고침으로 해결해봐!')
    ).toBeInTheDocument();
  });

  it('치명적 에러 시 "새로고침" 버튼이 표시된다', () => {
    render(
      <ErrorBoundary>
        <ThrowError message="fatal error" />
      </ErrorBoundary>
    );
    expect(screen.getByRole('button', { name: '페이지 새로고침' })).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// 커스텀 fallback
// ---------------------------------------------------------------------------

describe('ErrorBoundary - 커스텀 fallback', () => {
  it('fallback prop이 있으면 기본 UI 대신 fallback을 렌더링한다', () => {
    render(
      <ErrorBoundary fallback={<div>커스텀 에러 화면</div>}>
        <ThrowError message="any error" />
      </ErrorBoundary>
    );
    expect(screen.getByText('커스텀 에러 화면')).toBeInTheDocument();
    // 기본 커폴이 메시지는 없어야 함
    expect(screen.queryByText(/앗,/)).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// withErrorBoundary HOC
// ---------------------------------------------------------------------------

describe('withErrorBoundary HOC', () => {
  it('withErrorBoundary로 감싼 컴포넌트가 정상 렌더링된다', () => {
    const WrappedSafeChild = withErrorBoundary(SafeChild);
    render(<WrappedSafeChild />);
    expect(screen.getByText('안전한 자식 컴포넌트')).toBeInTheDocument();
  });

  it('withErrorBoundary로 감싼 컴포넌트에서 에러 발생 시 폴백 UI를 표시한다', () => {
    function Bomb(): React.ReactElement {
      throw new Error('fatal error from HOC');
    }

    const WrappedBomb = withErrorBoundary(Bomb);
    render(<WrappedBomb />);
    expect(
      screen.getByText('앗, 예상치 못한 문제가 발생했어요. 새로고침으로 해결해봐!')
    ).toBeInTheDocument();
  });

  it('withErrorBoundary displayName이 올바르게 설정된다', () => {
    function MyComponent(): React.ReactElement {
      return <div />;
    }
    const Wrapped = withErrorBoundary(MyComponent);
    expect(Wrapped.displayName).toBe('withErrorBoundary(MyComponent)');
  });
});

// ---------------------------------------------------------------------------
// 접근성
// ---------------------------------------------------------------------------

describe('ErrorBoundary - 접근성', () => {
  it('에러 UI에 role="alert"와 aria-live="assertive"가 있다', () => {
    render(
      <ErrorBoundary>
        <ThrowError message="error" />
      </ErrorBoundary>
    );
    const alert = screen.getByRole('alert');
    expect(alert).toHaveAttribute('aria-live', 'assertive');
  });
});
