'use client';

/**
 * CustomPortfolio: 대신취업해줘 - 메인 페이지
 * 로그인 후 표시되는 네비게이션 허브 페이지
 * Requirements: 2.1, 2.2, 2.3, 2.4, 11.6
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navigation from '@/components/navigation';
import { MascotMessage } from '@/components/mascot-message';
import { useAuthStore } from '@/stores/auth-store';
import { STORAGE_KEYS } from '@/constants/storage-keys';

/** 주요 기능 카드 데이터 */
const FEATURE_CARDS = [
  {
    key: 'create',
    icon: '✨',
    title: '포트폴리오 생성',
    description: '내 정보를 입력하면 커폴이가 멋진 포트폴리오를 뚝딱 만들어줘!',
    href: '/portfolio/create',
    buttonLabel: '만들러 가기',
    colorClass: 'border-blue-200 bg-blue-50 hover:border-blue-400',
    buttonClass: 'bg-blue-600 hover:bg-blue-700 text-white',
  },
  {
    key: 'mypage',
    icon: '🗂️',
    title: '마이페이지',
    description: '내 포트폴리오를 관리하고, 공개/비공개 설정과 커피챗 요청을 확인해봐!',
    href: '/mypage',
    buttonLabel: '내 페이지로',
    colorClass: 'border-purple-200 bg-purple-50 hover:border-purple-400',
    buttonClass: 'bg-purple-600 hover:bg-purple-700 text-white',
  },
  {
    key: 'community',
    icon: '☕',
    title: '커뮤니티',
    description: '다른 개발자들의 포트폴리오를 구경하고 커피챗으로 네트워킹해봐!',
    href: '/community',
    buttonLabel: '구경하러 가기',
    colorClass: 'border-green-200 bg-green-50 hover:border-green-400',
    buttonClass: 'bg-green-600 hover:bg-green-700 text-white',
  },
] as const;

export default function MainPage() {
  const user = useAuthStore((state) => state.user);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    // 첫 로그인이고 온보딩을 아직 보지 않은 경우에만 표시 (Requirements: 11.6)
    if (user?.isFirstLogin) {
      const alreadyShown = localStorage.getItem(STORAGE_KEYS.ONBOARDING_SHOWN);
      if (alreadyShown === null) {
        setShowOnboarding(true);
        localStorage.setItem(STORAGE_KEYS.ONBOARDING_SHOWN, 'true');
      }
    }
  }, [user]);

  return (
    <>
      {/* 공통 네비게이션 */}
      <Navigation />

      <main className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

          {/* 온보딩 메시지 (첫 로그인 1회만 표시) */}
          {showOnboarding && (
            <div className="mb-8">
              <MascotMessage
                type="welcome"
                message={`안녕! 나는 커폴이야 👋\n포트폴리오 생성, 마이페이지, 커뮤니티까지 내가 다 도와줄게!\n아래에서 원하는 기능을 골라봐~`}
              />
            </div>
          )}

          {/* 유저 인사말 */}
          {user && (
            <div className="mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                안녕하세요, {user.name}님! 👋
              </h1>
              <p className="mt-1 text-gray-500 text-sm sm:text-base">
                오늘도 커폴이와 함께 멋진 포트폴리오를 만들어봐요.
              </p>
            </div>
          )}

          {/* 기능 카드 그리드 (Requirements: 2.2, 2.3, 2.4) */}
          <section aria-label="주요 기능">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {FEATURE_CARDS.map(({ key, icon, title, description, href, buttonLabel, colorClass, buttonClass }) => (
                <article
                  key={key}
                  className={`rounded-2xl border-2 p-6 flex flex-col gap-4 transition-colors shadow-sm ${colorClass}`}
                >
                  {/* 아이콘 */}
                  <div className="text-4xl" aria-hidden="true">{icon}</div>

                  {/* 제목 & 설명 */}
                  <div className="flex-1">
                    <h2 className="text-lg font-bold text-gray-900 mb-1">{title}</h2>
                    <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
                  </div>

                  {/* 링크 버튼 */}
                  <Link
                    href={href}
                    className={`inline-block text-center px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${buttonClass}`}
                  >
                    {buttonLabel}
                  </Link>
                </article>
              ))}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
