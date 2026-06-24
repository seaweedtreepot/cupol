'use client';

/**
 * CustomPortfolio: 대신취업해줘 - 공통 네비게이션 컴포넌트
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.6, 1.7
 */

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuthStore } from '@/stores/auth-store';
import type { UserSession } from '@/types';

/** 네비게이션 메뉴 항목 정의 */
const NAV_ITEMS = [
  { key: 'mypage', label: '마이페이지', href: '/mypage' },
  { key: 'community', label: '커뮤니티', href: '/community' },
] as const;

type ActiveMenu = 'create' | 'mypage' | 'community';

/** activeMenu prop을 받지 않아도 usePathname으로 자동 감지 */
interface NavigationProps {
  /** 현재 활성 메뉴 (선택적 - 미지정 시 pathname으로 자동 감지) */
  activeMenu?: ActiveMenu;
  /** 사용자 세션 정보 (미지정 시 auth store에서 자동 조회) */
  user?: UserSession;
}

/** pathname으로부터 활성 메뉴 키를 추론 */
function resolveActiveMenu(pathname: string): ActiveMenu | null {
  if (pathname.startsWith('/portfolio')) return 'create';
  if (pathname.startsWith('/mypage')) return 'mypage';
  if (pathname.startsWith('/community')) return 'community';
  return null;
}

/**
 * Navigation - 서비스 전체에서 공통으로 사용되는 상단 네비게이션 바
 *
 * - 메뉴: 포트폴리오 생성, 마이페이지, 커뮤니티
 * - 현재 활성 메뉴를 파란색 배경(primary color)으로 시각적 구분
 * - 사용자 이름 및 프로필 이미지 표시
 * - 로그아웃 버튼: useAuthStore().logout() 호출 후 '/'로 이동
 * - 반응형: 모바일에서도 동작
 */
export default function Navigation({ activeMenu: activeMenuProp, user: userProp }: NavigationProps) {
  const pathname = usePathname();
  const router = useRouter();
  const storeUser = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  // user prop이 없으면 store에서 조회
  const user = userProp ?? storeUser;

  // activeMenu prop이 없으면 pathname으로 자동 감지
  const activeMenu = activeMenuProp ?? resolveActiveMenu(pathname);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <header className="w-full bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* 로고 / 브랜드 */}
          <Link
            href="/main"
            className="flex items-center gap-1 text-xl font-bold text-blue-600 hover:text-blue-700 transition-colors shrink-0"
          >
            커폴이 ✨
          </Link>

          {/* 메뉴 항목 (데스크톱) */}
          <nav className="hidden sm:flex items-center gap-1" aria-label="주요 메뉴">
            {NAV_ITEMS.map(({ key, label, href }) => {
              const isActive = activeMenu === key;
              return (
                <Link
                  key={key}
                  href={href}
                  aria-current={isActive ? 'page' : undefined}
                  className={[
                    'px-4 py-2 rounded-md text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
                  ].join(' ')}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* 우측: 사용자 정보 + 로그아웃 */}
          <div className="flex items-center gap-3">
            {user && (
              <div className="hidden sm:flex items-center gap-2">
                {/* 프로필 이미지 */}
                {user.profileImage ? (
                  <Image
                    src={user.profileImage}
                    alt={`${user.name} 프로필`}
                    width={32}
                    height={32}
                    className="rounded-full object-cover border border-gray-200"
                    unoptimized
                  />
                ) : (
                  <div
                    className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-sm font-bold border border-gray-200"
                    aria-hidden="true"
                  >
                    {user.name.charAt(0)}
                  </div>
                )}
                {/* 사용자 이름 */}
                <span className="text-sm text-gray-700 font-medium max-w-[100px] truncate">
                  {user.name}
                </span>
              </div>
            )}

            {/* 로그아웃 버튼 */}
            <button
              type="button"
              onClick={handleLogout}
              className="px-3 py-1.5 text-sm text-gray-500 border border-gray-300 rounded-md hover:bg-gray-50 hover:text-gray-700 transition-colors"
            >
              로그아웃
            </button>
          </div>
        </div>

        {/* 모바일 메뉴 (하단 고정 네비게이션 바 형태) */}
        <nav
          className="sm:hidden flex items-center justify-around border-t border-gray-100 py-2"
          aria-label="모바일 메뉴"
        >
          {NAV_ITEMS.map(({ key, label, href }) => {
            const isActive = activeMenu === key;
            return (
              <Link
                key={key}
                href={href}
                aria-current={isActive ? 'page' : undefined}
                className={[
                  'flex-1 text-center px-2 py-1.5 rounded-md text-xs font-medium transition-colors mx-0.5',
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-500 hover:bg-gray-100',
                ].join(' ')}
              >
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
