'use client';

/**
 * (구) 미리보기 라우트 - 현재 생성 흐름은 발행 단계에서 바로 포트폴리오를 만들고
 * 마이페이지로 이동한다. 이 경로로 직접 접근하면 열람 페이지로 리다이렉트한다.
 */

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function PortfolioPreviewRedirect() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params?.id === 'string' ? params.id : (params?.id?.[0] ?? '');

  useEffect(() => {
    if (id && id !== 'new') {
      router.replace(`/portfolio/view/${id}`);
    } else {
      router.replace('/mypage');
    }
  }, [id, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <p className="text-gray-400 text-sm">이동 중...</p>
    </div>
  );
}
