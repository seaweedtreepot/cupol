'use client';

/**
 * 마이페이지
 * - 상단 세그먼트 토글: [내 포트폴리오] ↔ [커피챗 대시보드]
 * - 포트폴리오: HTML 미리보기, 공개/비공개 토글, 수정/삭제/HTML 내보내기, 일괄 삭제
 * - 커피챗: 받은 요청 목록, 수락/거절
 */

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/navigation';
import { MascotMessage } from '@/components/mascot-message';
import { useAuthStore } from '@/stores/auth-store';
import { usePortfolioStore, type Portfolio } from '@/stores/portfolio-store';
import { useCommunityStore } from '@/stores/community-store';
import type { ChatRequest } from '@/types';

// ---------------------------------------------------------------------------
// Toast
// ---------------------------------------------------------------------------

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div role="alert" className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-5 py-3 rounded-xl shadow-lg text-sm z-50 max-w-sm w-full text-center">
      {message}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 포트폴리오 카드 (HTML 미리보기)
// ---------------------------------------------------------------------------

interface PortfolioCardProps {
  portfolio: Portfolio;
  selected: boolean;
  selectMode: boolean;
  onToggleSelect: (id: string) => void;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleVisibility: (id: string, current: 'public' | 'private') => void;
  onCopyShareUrl: (id: string) => void;
  onExportHtml: (pf: Portfolio) => void;
}

function PortfolioCard({
  portfolio, selected, selectMode, onToggleSelect, onView, onEdit, onDelete,
  onToggleVisibility, onCopyShareUrl, onExportHtml,
}: PortfolioCardProps) {
  const isPublic = portfolio.visibility === 'public';
  const updated = new Date(portfolio.updatedAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <article className={['bg-white rounded-2xl border shadow-sm overflow-hidden flex flex-col transition-all', selected ? 'border-blue-500 ring-2 ring-blue-300' : 'border-gray-200'].join(' ')}>
      {/* HTML 썸네일 미리보기 */}
      <div className="relative h-48 bg-gray-50 border-b border-gray-100 overflow-hidden">
        {selectMode && (
          <label className="absolute top-2 left-2 z-10 bg-white/90 rounded-md p-1 shadow cursor-pointer">
            <input type="checkbox" checked={selected} onChange={() => onToggleSelect(portfolio.id)} aria-label="선택" className="w-4 h-4 accent-blue-600" />
          </label>
        )}
        <iframe
          srcDoc={portfolio.html}
          title={`${portfolio.title} 미리보기`}
          className="w-[200%] h-[384px] origin-top-left pointer-events-none"
          style={{ transform: 'scale(0.5)' }}
          sandbox=""
        />
        <button type="button" onClick={() => onView(portfolio.id)} className="absolute inset-0 bg-transparent hover:bg-blue-500/5 transition-colors" aria-label="포트폴리오 열람" />
      </div>

      <div className="p-4 flex flex-col gap-3 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-base font-bold text-gray-900 truncate">{portfolio.title}</h3>
            <p className="text-xs text-gray-400 mt-0.5">수정: {updated}</p>
          </div>
          {/* 공개/비공개 토글 */}
          <div className="flex flex-col items-end gap-1 shrink-0">
            <button
              type="button"
              onClick={() => onToggleVisibility(portfolio.id, portfolio.visibility)}
              aria-pressed={isPublic}
              aria-label={isPublic ? '공개 → 비공개' : '비공개 → 공개'}
              className={['relative inline-flex h-6 w-11 items-center rounded-full transition-colors', isPublic ? 'bg-blue-500' : 'bg-gray-300'].join(' ')}
            >
              <span className={['inline-block h-4 w-4 rounded-full bg-white shadow transition-transform', isPublic ? 'translate-x-6' : 'translate-x-1'].join(' ')} />
            </button>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${isPublic ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
              {isPublic ? '🌐 공개' : '🔒 비공개'}
            </span>
          </div>
        </div>

        {/* 공유 URL (공개 시) */}
        {isPublic && (
          <button type="button" onClick={() => onCopyShareUrl(portfolio.id)} className="text-xs text-blue-600 hover:text-blue-800 text-left truncate">
            🔗 공유 URL 복사
          </button>
        )}

        {/* 액션 */}
        <div className="flex flex-wrap gap-2 mt-auto">
          <button type="button" onClick={() => onView(portfolio.id)} className="flex-1 min-w-[56px] px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">👁 보기</button>
          <button type="button" onClick={() => onEdit(portfolio.id)} className="flex-1 min-w-[56px] px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">✏️ 수정</button>
          <button type="button" onClick={() => onExportHtml(portfolio)} className="flex-1 min-w-[56px] px-3 py-1.5 text-sm font-medium text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">📥 HTML</button>
          <button type="button" onClick={() => onDelete(portfolio.id)} className="flex-1 min-w-[56px] px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">🗑️ 삭제</button>
        </div>
      </div>
    </article>
  );
}

// ---------------------------------------------------------------------------
// 커피챗 요청 카드
// ---------------------------------------------------------------------------

function ChatRequestCard({ request, ownerEmail, direction, onAccept, onReject }: { request: ChatRequest; ownerEmail: string; direction: 'received' | 'sent'; onAccept: (id: string) => void; onReject: (id: string) => void }) {
  const created = new Date(request.createdAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  const statusLabel: Record<ChatRequest['status'], { text: string; className: string }> = {
    pending: { text: '대기 중', className: 'bg-yellow-100 text-yellow-700' },
    accepted: { text: '수락됨', className: 'bg-green-100 text-green-700' },
    rejected: { text: '거절됨', className: 'bg-red-100 text-red-700' },
  };
  const { text, className } = statusLabel[request.status];
  const isReceived = direction === 'received';
  return (
    <article className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-gray-900 text-sm">
            {isReceived ? request.requesterName : `→ 받는 사람: ${request.toUserId}`}
          </p>
          {request.requesterOrganization && <p className="text-xs text-gray-500">{request.requesterOrganization}</p>}
          <p className="text-xs text-gray-400 mt-0.5">{created}</p>
        </div>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${className}`}>{text}</span>
      </div>
      <p className="text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">{request.message}</p>
      {/* 받은 요청 + 대기 중일 때만 수락/거절 */}
      {isReceived && request.status === 'pending' && (
        <div className="flex gap-2">
          <button type="button" onClick={() => onAccept(request.id)} className="flex-1 px-3 py-1.5 text-sm font-medium text-white bg-green-500 hover:bg-green-600 rounded-lg transition-colors">✅ 수락</button>
          <button type="button" onClick={() => onReject(request.id)} className="flex-1 px-3 py-1.5 text-sm font-medium text-white bg-gray-400 hover:bg-gray-500 rounded-lg transition-colors">❌ 거절</button>
        </div>
      )}
      {/* 받은 요청 수락됨 → 내 이메일 전달 안내 */}
      {isReceived && request.status === 'accepted' && (
        <div className="bg-green-50 border border-green-100 rounded-lg px-3 py-2">
          <span className="text-xs text-green-700">📧 연락처 전달됨: <strong>{ownerEmail}</strong></span>
        </div>
      )}
      {/* 보낸 요청 상태 안내 */}
      {!isReceived && (
        <div className={`rounded-lg px-3 py-2 ${request.status === 'pending' ? 'bg-yellow-50 border border-yellow-100' : request.status === 'accepted' ? 'bg-green-50 border border-green-100' : 'bg-red-50 border border-red-100'}`}>
          <span className="text-xs text-gray-600">
            {request.status === 'pending' && '상대방의 응답을 기다리는 중이에요 ⏳'}
            {request.status === 'accepted' && '🎉 수락됐어요! 상대방이 연락처를 공유했어요.'}
            {request.status === 'rejected' && '아쉽지만 거절됐어요 😢'}
          </span>
        </div>
      )}
    </article>
  );
}

// ---------------------------------------------------------------------------
// 메인
// ---------------------------------------------------------------------------

type Tab = 'portfolios' | 'coffeechat';
type ChatFilter = 'all' | 'pending' | 'accepted' | 'rejected';

export default function MyPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const allPortfolios = usePortfolioStore((s) => s.portfolios);
  const deletePortfolio = usePortfolioStore((s) => s.deletePortfolio);
  const deleteMany = usePortfolioStore((s) => s.deleteMany);
  const setVisibility = usePortfolioStore((s) => s.setVisibility);

  const getChatRequestsForUser = useCommunityStore((s) => s.getChatRequestsForUser);
  const updateChatRequestStatus = useCommunityStore((s) => s.updateChatRequestStatus);
  const allChatRequests = useCommunityStore((s) => s.chatRequests);

  const [tab, setTab] = useState<Tab>('portfolios');
  const [chatFilter, setChatFilter] = useState<ChatFilter>('all');
  const [chatDirection, setChatDirection] = useState<'received' | 'sent'>('received');
  const [toast, setToast] = useState<string | null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) router.push('/');
  }, [user, router]);

  // 내 포트폴리오
  const myPortfolios = user ? allPortfolios.filter((p) => p.userId === user.id) : [];

  // 받은/보낸 커피챗
  const receivedRequests = user ? getChatRequestsForUser(user.id) : [];
  const sentRequests = user ? allChatRequests.filter((r) => r.fromUserId === user.id) : [];
  const baseRequests = chatDirection === 'received' ? receivedRequests : sentRequests;
  const filteredRequests = chatFilter === 'all' ? baseRequests : baseRequests.filter((r) => r.status === chatFilter);

  const handleView = useCallback((id: string) => router.push(`/portfolio/view/${id}`), [router]);
  const handleEdit = useCallback((id: string) => router.push(`/portfolio/create?edit=${id}`), [router]);

  const handleDelete = useCallback((id: string) => {
    if (!confirm('이 포트폴리오를 삭제할까요?')) return;
    deletePortfolio(id);
    setToast('포트폴리오가 삭제됐어!');
  }, [deletePortfolio]);

  const handleToggleVisibility = useCallback((id: string, current: 'public' | 'private') => {
    const next = current === 'public' ? 'private' : 'public';
    setVisibility(id, next);
    setToast(next === 'public' ? '🌐 공개로 변경됐어!' : '🔒 비공개로 변경됐어!');
  }, [setVisibility]);

  const handleCopyShareUrl = useCallback((id: string) => {
    const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/portfolio/view/${id}`;
    navigator.clipboard.writeText(url).then(() => setToast('🔗 공유 URL이 복사됐어!')).catch(() => setToast('복사 실패. 직접 복사해줘!'));
  }, []);

  const handleExportHtml = useCallback((pf: Portfolio) => {
    const blob = new Blob([pf.html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${pf.title.replace(/\s+/g, '-')}.html`;
    a.click();
    URL.revokeObjectURL(url);
    setToast('📥 HTML 파일이 다운로드됐어!');
  }, []);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const handleBulkDelete = useCallback(() => {
    if (selectedIds.size === 0) return;
    if (!confirm(`선택한 ${selectedIds.size}개의 포트폴리오를 삭제할까요?`)) return;
    deleteMany(Array.from(selectedIds));
    setSelectedIds(new Set());
    setSelectMode(false);
    setToast('선택한 포트폴리오를 삭제했어!');
  }, [selectedIds, deleteMany]);

  const handleAccept = useCallback((id: string) => {
    updateChatRequestStatus(id, 'accepted');
    setToast(`✅ 수락했어! 요청자에게 이메일(${user?.email ?? ''})이 전달됐어.`);
  }, [updateChatRequestStatus, user]);

  const handleReject = useCallback((id: string) => {
    updateChatRequestStatus(id, 'rejected');
    setToast('❌ 거절 처리됐어!');
  }, [updateChatRequestStatus]);

  if (!user) return null;

  const pendingCount = receivedRequests.filter((r) => r.status === 'pending').length;

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">마이페이지</h1>
            <p className="mt-1 text-sm text-gray-500">포트폴리오를 관리하고 커피챗 요청을 확인해봐!</p>
          </div>

          {/* 세그먼트 토글 */}
          <div className="inline-flex p-1 bg-gray-100 rounded-xl mb-8">
            <button
              type="button"
              onClick={() => setTab('portfolios')}
              className={['px-5 py-2 text-sm font-semibold rounded-lg transition-all', tab === 'portfolios' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'].join(' ')}
            >
              📁 내 포트폴리오 {myPortfolios.length > 0 && <span className="ml-1 text-xs">({myPortfolios.length})</span>}
            </button>
            <button
              type="button"
              onClick={() => setTab('coffeechat')}
              className={['px-5 py-2 text-sm font-semibold rounded-lg transition-all relative', tab === 'coffeechat' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'].join(' ')}
            >
              ☕ 커피챗 대시보드
              {pendingCount > 0 && <span className="ml-1.5 text-xs bg-orange-500 text-white px-1.5 py-0.5 rounded-full">{pendingCount}</span>}
            </button>
          </div>

          {/* ── 포트폴리오 탭 ── */}
          {tab === 'portfolios' && (
            <section>
              {myPortfolios.length === 0 ? (
                <div className="py-12 flex flex-col items-center gap-5">
                  <MascotMessage type="guide" message="아직 만든 포트폴리오가 없어! 새로 하나 만들어볼래? ✨" />
                  <button type="button" onClick={() => router.push('/portfolio/create')} className="px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors">+ 새 포트폴리오 만들기</button>
                </div>
              ) : (
                <>
                  {/* 툴바 */}
                  <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
                    <button type="button" onClick={() => router.push('/portfolio/create')} className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors">+ 새 포트폴리오</button>
                    <div className="flex items-center gap-2">
                      {selectMode && selectedIds.size > 0 && (
                        <button type="button" onClick={handleBulkDelete} className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors">선택 {selectedIds.size}개 삭제</button>
                      )}
                      <button
                        type="button"
                        onClick={() => { setSelectMode((v) => !v); setSelectedIds(new Set()); }}
                        className={['px-4 py-2 text-sm font-medium rounded-lg border transition-colors', selectMode ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'].join(' ')}
                      >
                        {selectMode ? '선택 취소' : '여러 개 선택'}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {myPortfolios.map((pf) => (
                      <PortfolioCard
                        key={pf.id}
                        portfolio={pf}
                        selected={selectedIds.has(pf.id)}
                        selectMode={selectMode}
                        onToggleSelect={toggleSelect}
                        onView={handleView}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onToggleVisibility={handleToggleVisibility}
                        onCopyShareUrl={handleCopyShareUrl}
                        onExportHtml={handleExportHtml}
                      />
                    ))}
                  </div>
                </>
              )}
            </section>
          )}

          {/* ── 커피챗 탭 ── */}
          {tab === 'coffeechat' && (
            <section>
              {/* 받은 / 보낸 토글 */}
              <div className="inline-flex p-1 bg-gray-100 rounded-xl mb-4">
                <button type="button" onClick={() => setChatDirection('received')} className={['px-4 py-1.5 text-sm font-semibold rounded-lg transition-all', chatDirection === 'received' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'].join(' ')}>
                  📥 받은 요청 {receivedRequests.length > 0 && <span className="ml-1 text-xs text-gray-400">{receivedRequests.length}</span>}
                </button>
                <button type="button" onClick={() => setChatDirection('sent')} className={['px-4 py-1.5 text-sm font-semibold rounded-lg transition-all', chatDirection === 'sent' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'].join(' ')}>
                  📤 보낸 요청 {sentRequests.length > 0 && <span className="ml-1 text-xs text-gray-400">{sentRequests.length}</span>}
                </button>
              </div>

              {/* 상태 필터 */}
              <div role="tablist" className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-4 w-fit">
                {(['all', 'pending', 'accepted', 'rejected'] as ChatFilter[]).map((f) => {
                  const labels: Record<ChatFilter, string> = { all: '전체', pending: '대기 중', accepted: '수락됨', rejected: '거절됨' };
                  const count = f === 'all' ? baseRequests.length : baseRequests.filter((r) => r.status === f).length;
                  return (
                    <button key={f} type="button" onClick={() => setChatFilter(f)} className={['px-3 py-1.5 text-sm font-medium rounded-lg transition-colors', chatFilter === f ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'].join(' ')}>
                      {labels[f]}{count > 0 && <span className="ml-1.5 text-xs text-gray-400">{count}</span>}
                    </button>
                  );
                })}
              </div>
              {filteredRequests.length === 0 ? (
                <div className="py-10 text-center text-gray-400 text-sm">
                  {chatDirection === 'received' ? '아직 받은 커피챗 요청이 없어요 ☕' : '아직 보낸 커피챗 요청이 없어요 ☕'}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredRequests.map((r) => (
                    <ChatRequestCard
                      key={r.id}
                      request={r}
                      ownerEmail={user.email}
                      direction={chatDirection}
                      onAccept={handleAccept}
                      onReject={handleReject}
                    />
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      </main>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </>
  );
}
