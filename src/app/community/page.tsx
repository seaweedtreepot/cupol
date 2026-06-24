'use client';

/**
 * 커뮤니티 - 공개 포트폴리오 피드
 * - public 포트폴리오 HTML 미리보기 카드가 피드로 표시됨 (인스타 게시물처럼)
 * - 각 카드에 작성자 프로필로 가는 작은 정보 칩/버튼 포함
 * - 직무/기업/기술 스택 필터링
 */

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/navigation';
import { usePortfolioStore } from '@/stores/portfolio-store';
import { DEMO_PROFILE_SEEDS, demoProfileToProfileData } from '@/lib/demo-data';
import { generateSite } from '@/lib/site-builder';
import { DEFAULT_TEMPLATES, DEFAULT_CUSTOMIZATION } from '@/stores/template-store';

// ---------------------------------------------------------------------------
// 피드 아이템 타입
// ---------------------------------------------------------------------------

interface FeedItem {
  portfolioId: string;
  title: string;
  html: string;
  authorId: string;
  authorName: string;
  authorTitle: string;
  authorCompany: string;
  skills: string[];
}

// 데모 포트폴리오 피드 (각 데모 유저당 1개)
function buildDemoFeed(): FeedItem[] {
  return DEMO_PROFILE_SEEDS.map((seed, i) => {
    const profile = demoProfileToProfileData(seed);
    const template = DEFAULT_TEMPLATES[i % DEFAULT_TEMPLATES.length];
    const site = generateSite(profile, template, DEFAULT_CUSTOMIZATION, `${seed.userId}-0`);
    return {
      portfolioId: `${seed.userId}-0`,
      title: `${seed.name}의 포트폴리오`,
      html: site.html,
      authorId: seed.userId,
      authorName: seed.name,
      authorTitle: seed.title,
      authorCompany: seed.company,
      skills: seed.skills,
    };
  });
}

// ---------------------------------------------------------------------------
// 작성자 칩
// ---------------------------------------------------------------------------

function AuthorChip({ item, onClick }: { item: FeedItem; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className="flex items-center gap-2 group/author hover:bg-gray-50 rounded-lg p-1 -m-1 transition-colors"
      aria-label={`${item.authorName} 프로필 보기`}
    >
      <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-sm font-bold border border-blue-200 shrink-0">
        {item.authorName.charAt(0)}
      </div>
      <div className="text-left min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate group-hover/author:text-blue-600 transition-colors">{item.authorName}</p>
        <p className="text-xs text-gray-400 truncate">{item.authorTitle} · {item.authorCompany}</p>
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// 피드 카드 (인스타 게시물 스타일)
// ---------------------------------------------------------------------------

function FeedCard({ item, onOpenPortfolio, onOpenAuthor }: { item: FeedItem; onOpenPortfolio: () => void; onOpenAuthor: () => void }) {
  return (
    <article className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
      {/* 상단: 작성자 칩 */}
      <div className="px-4 py-3 border-b border-gray-100">
        <AuthorChip item={item} onClick={onOpenAuthor} />
      </div>

      {/* 본문: HTML 미리보기 (클릭 시 포트폴리오 열람) */}
      <button type="button" onClick={onOpenPortfolio} className="relative h-64 bg-gray-50 overflow-hidden block w-full group" aria-label={`${item.title} 열람`}>
        <iframe
          srcDoc={item.html}
          title={`${item.title} 미리보기`}
          className="w-[200%] h-[512px] origin-top-left pointer-events-none"
          style={{ transform: 'scale(0.5)' }}
          sandbox=""
        />
        <span className="absolute inset-0 bg-transparent group-hover:bg-blue-500/5 transition-colors flex items-end justify-end p-3">
          <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900/80 text-white text-xs px-3 py-1.5 rounded-full">열람하기 →</span>
        </span>
      </button>

      {/* 하단: 제목 + 기술 태그 */}
      <div className="px-4 py-3">
        <p className="text-sm font-semibold text-gray-900 mb-2">{item.title}</p>
        <div className="flex flex-wrap gap-1.5">
          {item.skills.slice(0, 4).map((s) => (
            <span key={s} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full font-medium">{s}</span>
          ))}
        </div>
      </div>
    </article>
  );
}

// ---------------------------------------------------------------------------
// 메인
// ---------------------------------------------------------------------------

const PAGE_SIZE = 9;

export default function CommunityPage() {
  const router = useRouter();
  const portfolios = usePortfolioStore((s) => s.portfolios);

  const [roleFilter, setRoleFilter] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');
  const [skillFilter, setSkillFilter] = useState('');
  const [page, setPage] = useState(1);

  // 전체 피드 = 사용자 공개 포트폴리오 + 데모 포트폴리오
  const allFeed: FeedItem[] = useMemo(() => {
    const userFeed: FeedItem[] = portfolios
      .filter((p) => p.visibility === 'public')
      .map((p) => ({
        portfolioId: p.id,
        title: p.title,
        html: p.html,
        authorId: p.userId,
        authorName: p.ownerName,
        authorTitle: p.profileData.title || '개발자',
        authorCompany: p.profileData.experiences[0]?.company ?? '',
        skills: p.profileData.skills,
      }));
    return [...userFeed, ...buildDemoFeed()];
  }, [portfolios]);

  // 필터 적용
  const filtered = useMemo(() => {
    return allFeed.filter((item) => {
      if (roleFilter && !item.authorTitle.toLowerCase().includes(roleFilter.toLowerCase())) return false;
      if (companyFilter && !item.authorCompany.toLowerCase().includes(companyFilter.toLowerCase())) return false;
      if (skillFilter && !item.skills.some((s) => s.toLowerCase().includes(skillFilter.toLowerCase()))) return false;
      return true;
    });
  }, [allFeed, roleFilter, companyFilter, skillFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const resetPage = () => setPage(1);

  return (
    <>
      <Navigation />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">커뮤니티 피드</h1>
          <p className="text-sm text-gray-500">공개된 포트폴리오를 둘러보고, 마음에 드는 작성자에게 커피챗을 요청해봐 ✨</p>
        </div>

        {/* 필터 */}
        <section className="bg-white rounded-xl border border-gray-200 p-4 mb-6 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label htmlFor="f-role" className="block text-xs font-medium text-gray-600 mb-1">직무</label>
              <input id="f-role" type="text" value={roleFilter} placeholder="예) 프론트엔드, 백엔드…" onChange={(e) => { setRoleFilter(e.target.value); resetPage(); }} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
            <div>
              <label htmlFor="f-company" className="block text-xs font-medium text-gray-600 mb-1">기업</label>
              <input id="f-company" type="text" value={companyFilter} placeholder="예) 네이버, 카카오…" onChange={(e) => { setCompanyFilter(e.target.value); resetPage(); }} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
            <div>
              <label htmlFor="f-skill" className="block text-xs font-medium text-gray-600 mb-1">기술 스택</label>
              <input id="f-skill" type="text" value={skillFilter} placeholder="예) React, Python…" onChange={(e) => { setSkillFilter(e.target.value); resetPage(); }} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
          </div>
        </section>

        <p className="text-sm text-gray-500 mb-4">총 <span className="font-medium text-gray-900">{filtered.length}</span>개의 공개 포트폴리오{totalPages > 1 && <span className="ml-1">· {currentPage}/{totalPages} 페이지</span>}</p>

        {/* 피드 그리드 */}
        {paged.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {paged.map((item) => (
              <FeedCard
                key={item.portfolioId}
                item={item}
                onOpenPortfolio={() => router.push(`/portfolio/view/${item.portfolioId}`)}
                onOpenAuthor={() => router.push(`/community/user/${item.authorId}`)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="text-5xl mb-4">🧙‍♂️</div>
            <p className="text-lg font-medium text-gray-700 mb-1">조건에 맞는 포트폴리오가 없어요</p>
            <p className="text-sm text-gray-400">필터를 바꿔서 다시 찾아봐!</p>
          </div>
        )}

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <nav className="flex items-center justify-center gap-1 mt-8" aria-label="페이지">
            <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-2 rounded-md text-sm text-gray-500 hover:bg-gray-100 disabled:opacity-40">‹</button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button key={i} type="button" onClick={() => setPage(i + 1)} aria-current={currentPage === i + 1 ? 'page' : undefined} className={['px-3 py-2 rounded-md text-sm font-medium', currentPage === i + 1 ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'].join(' ')}>{i + 1}</button>
            ))}
            <button type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-2 rounded-md text-sm text-gray-500 hover:bg-gray-100 disabled:opacity-40">›</button>
          </nav>
        )}
      </main>
    </>
  );
}
