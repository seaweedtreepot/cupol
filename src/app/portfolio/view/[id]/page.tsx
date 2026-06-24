'use client';

/**
 * 공개 포트폴리오 열람 페이지
 * 외부 사용자 및 소유자가 포트폴리오를 열람하는 페이지.
 * Visibility Controller를 통해 접근 권한을 판단한다.
 *
 * Requirements: 7.3, 7.6
 */

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Navigation from '@/components/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { usePortfolioStore } from '@/stores/portfolio-store';
import { getDemoProfileData } from '@/lib/demo-data';
import { generateSite } from '@/lib/site-builder';
import { DEFAULT_TEMPLATES, DEFAULT_CUSTOMIZATION } from '@/stores/template-store';

// ---------------------------------------------------------------------------
// 상태 유형
// ---------------------------------------------------------------------------

type ViewState =
  | { status: 'loading' }
  | { status: 'not_found' }
  | { status: 'denied' }
  | { status: 'ready'; html: string };

// ---------------------------------------------------------------------------
// 컴포넌트
// ---------------------------------------------------------------------------

export default function PortfolioViewPage() {
  const params = useParams();
  const portfolioId = typeof params?.id === 'string' ? params.id : (params?.id?.[0] ?? '');

  const user = useAuthStore((state) => state.user);
  const getById = usePortfolioStore((state) => state.getById);

  const [viewState, setViewState] = useState<ViewState>({ status: 'loading' });

  useEffect(() => {
    if (!portfolioId) {
      setViewState({ status: 'not_found' });
      return;
    }

    // 데모 포트폴리오: demo-{userId}-{idx} 형식 → 즉석 생성 (항상 공개)
    if (portfolioId.startsWith('demo-')) {
      const match = portfolioId.match(/^(demo-\d+)/);
      const demoUserId = match ? match[1] : '';
      const demoProfile = demoUserId ? getDemoProfileData(demoUserId) : null;
      if (demoProfile) {
        const idxStr = portfolioId.split('-').pop() ?? '0';
        const idx = Number(idxStr) || 0;
        const template = DEFAULT_TEMPLATES[idx % DEFAULT_TEMPLATES.length];
        const site = generateSite(demoProfile, template, DEFAULT_CUSTOMIZATION, portfolioId);
        setViewState({ status: 'ready', html: site.html });
        return;
      }
      setViewState({ status: 'not_found' });
      return;
    }

    // 통합 Portfolio store에서 조회
    const pf = getById(portfolioId);
    if (!pf) {
      setViewState({ status: 'not_found' });
      return;
    }

    // 접근 제어: 소유자는 항상, 비소유자는 공개만
    const isOwner = user?.id && user.id === pf.userId;
    if (pf.visibility !== 'public' && !isOwner) {
      setViewState({ status: 'denied' });
      return;
    }

    setViewState({ status: 'ready', html: pf.html });
  }, [portfolioId, user, getById]);

  // ---------------------------------------------------------------------------
  // 렌더링
  // ---------------------------------------------------------------------------

  if (viewState.status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500 text-sm">불러오는 중...</p>
      </div>
    );
  }

  if (viewState.status === 'not_found') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
        <span className="text-5xl" aria-hidden="true">🔍</span>
        <h1 className="text-xl font-semibold text-gray-700">
          포트폴리오를 찾을 수 없어요
        </h1>
        <p className="text-sm text-gray-400">
          링크가 잘못되었거나 삭제된 포트폴리오일 수 있어요.
        </p>
      </div>
    );
  }

  if (viewState.status === 'denied') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
        <span className="text-5xl" aria-hidden="true">🔒</span>
        <h1 className="text-xl font-semibold text-gray-700">
          비공개 포트폴리오입니다. 소유자만 열람할 수 있어요.
        </h1>
        <p className="text-sm text-gray-400">
          포트폴리오 소유자가 공개로 전환하면 열람할 수 있어요.
        </p>
      </div>
    );
  }

  // status === 'ready'
  return (
    <div className="flex flex-col min-h-screen">
      {/* 로그인된 사용자에게만 네비게이션 바 표시 */}
      {user && <Navigation />}

      {/* 포트폴리오 HTML을 전체 화면 iframe으로 렌더링 */}
      <iframe
        srcDoc={viewState.html}
        title="포트폴리오 열람"
        className="flex-1 w-full border-0"
        style={{ minHeight: user ? 'calc(100vh - 64px)' : '100vh' }}
        sandbox="allow-scripts allow-same-origin"
      />
    </div>
  );
}
