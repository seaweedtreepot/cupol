import { NextRequest, NextResponse } from 'next/server';

/**
 * 보호 경로: 인증된 사용자만 접근 가능
 * Requirements 2.5: 비인증 사용자가 로그인이 필요한 페이지에 직접 접근하면 로그인 페이지로 리다이렉션
 */
const PROTECTED_PATHS = [
  '/main',
  '/portfolio',
  '/mypage',
  '/community',
];

/**
 * 공개 경로 예외: 보호 경로의 하위 경로 중에서도 비인증 접근을 허용하는 경로
 * - /portfolio/view/*: 공개 포트폴리오 열람 (외부 사용자 접근 허용)
 */
const PUBLIC_EXCEPTIONS = [
  /^\/portfolio\/view\//,
];

/**
 * next-auth 세션 쿠키 이름 목록
 * HTTP 환경: next-auth.session-token
 * HTTPS 환경: __Secure-next-auth.session-token
 */
const SESSION_COOKIE_NAMES = [
  'next-auth.session-token',
  '__Secure-next-auth.session-token',
];

function isProtectedPath(pathname: string): boolean {
  // 공개 예외 경로 먼저 확인
  for (const pattern of PUBLIC_EXCEPTIONS) {
    if (pattern.test(pathname)) {
      return false;
    }
  }

  // 보호 경로 매칭
  for (const protectedPath of PROTECTED_PATHS) {
    if (pathname === protectedPath || pathname.startsWith(protectedPath + '/')) {
      return true;
    }
  }

  return false;
}

function hasSessionCookie(request: NextRequest): boolean {
  for (const cookieName of SESSION_COOKIE_NAMES) {
    if (request.cookies.has(cookieName)) {
      return true;
    }
  }
  return false;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 보호 경로가 아니면 통과
  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  // 개발 환경에서는 인증 체크 생략 (로컬 테스트 편의)
  if (process.env.NODE_ENV === 'development') {
    return NextResponse.next();
  }

  // 세션 쿠키가 없으면 로그인 페이지로 리다이렉트
  if (!hasSessionCookie(request)) {
    const loginUrl = new URL('/', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  /*
   * 미들웨어 실행 경로 매처:
   * - API 라우트 제외 (/api/*)
   * - Next.js 내부 경로 제외 (/_next/*)
   * - 정적 파일 제외 (favicon.ico, 이미지 등)
   */
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
