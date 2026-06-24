'use client';

/**
 * 로그인/랜딩 페이지
 * Requirements: 1.1, 1.2, 1.5, 1.6, 1.9
 *
 * - 구글 로그인 버튼 → signIn('google', { callbackUrl: '/main' })
 * - 이미 인증된 경우 /main으로 리다이렉트
 * - ?error= 파라미터로 인증 실패/네트워크 오류 메시지 표시
 * - 커폴이 환영 메시지 (MascotMessage type='welcome')
 */

import { useEffect, useState } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MascotMessage } from '@/components/mascot-message';

/** NextAuth 에러 코드 → 한국어 메시지 매핑 */
function getErrorMessage(error: string | null): string | null {
  if (!error) return null;

  switch (error) {
    case 'OAuthSignin':
    case 'OAuthCallback':
      return '구글 로그인 중 오류가 발생했어요. 다시 시도해볼게요!';
    case 'OAuthCreateAccount':
      return '계정 생성 중 문제가 발생했어요.';
    case 'Configuration':
      return '서버 설정 오류가 발생했어요.';
    default:
      return '로그인 중 문제가 발생했어요. 네트워크 연결을 확인해주세요.';
  }
}

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isSigningIn, setIsSigningIn] = useState(false);

  const errorParam = searchParams.get('error');
  const errorMessage = getErrorMessage(errorParam);

  // 이미 인증된 경우 /main으로 리다이렉트 (Req 1.5)
  useEffect(() => {
    if (status === 'authenticated' && session) {
      router.replace('/main');
    }
  }, [status, session, router]);

  // 로딩 중이거나 이미 인증된 경우 빈 화면 (리다이렉트 대기)
  if (status === 'loading' || status === 'authenticated') {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-50">
        <MascotMessage
          type="loading"
          message="커폴이가 준비하고 있어요..."
        />
      </main>
    );
  }

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    try {
      await signIn('google', { callbackUrl: '/main' });
    } catch {
      // signIn 자체에서 던지는 에러는 드물지만 안전 처리
      setIsSigningIn(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-50 px-4">
      {/* 서비스 타이틀 */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">커폴이: 대신취업해줘</h1>
        <p className="text-gray-500 text-sm">포트폴리오를 마법처럼 만들어주는 서비스</p>
      </div>

      {/* 커폴이 환영 메시지 (Req 1.1, 11.7) */}
      <div className="mb-8">
        <MascotMessage
          type="welcome"
          message={
            errorMessage
              ? errorMessage
              : '안녕! 난 커폴이야 🧙\n구글 계정으로 로그인하면 바로 멋진 포폴을 만들어줄게!'
          }
          illustration={errorMessage ? 'confused' : 'wave'}
        />
      </div>

      {/* 에러 메시지 (Req 1.6, 1.9) */}
      {errorMessage && (
        <div
          role="alert"
          aria-live="polite"
          className="mb-6 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm max-w-sm w-full text-center"
        >
          {errorMessage}
        </div>
      )}

      {/* 구글 로그인 카드 */}
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
        {/* 구글 로그인 버튼 (Req 1.1, 1.2) */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isSigningIn}
          aria-label="구글 계정으로 로그인"
          className="
            w-full flex items-center justify-center gap-3
            px-6 py-3 rounded-xl
            bg-white border-2 border-gray-200
            hover:border-purple-300 hover:bg-purple-50
            active:scale-95
            transition-all duration-150
            text-gray-700 font-medium text-sm
            shadow-sm hover:shadow-md
            disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100
          "
        >
          {isSigningIn ? (
            <>
              <span className="w-5 h-5 border-2 border-gray-400 border-t-purple-500 rounded-full animate-spin" aria-hidden="true" />
              <span>로그인 중...</span>
            </>
          ) : (
            <>
              {/* Google 아이콘 SVG */}
              <svg
                aria-hidden="true"
                className="w-5 h-5 flex-shrink-0"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              <span>구글로 로그인하기</span>
            </>
          )}
        </button>

        <p className="mt-4 text-center text-xs text-gray-400">
          로그인하면 커폴이와 함께 포트폴리오 마법을 시작할 수 있어요!
        </p>
      </div>
    </main>
  );
}
