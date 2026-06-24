'use client';

/**
 * CustomPortfolio: 대신취업해줘 - 유저 프로필 페이지
 * 특정 사용자의 공개 프로필, 공개 포트폴리오 목록, 커피챗 요청 기능을 제공한다.
 * Requirements: 8.6, 8.7, 8.8, 8.9, 8.10, 8.11, 8.12, 8.13
 */

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navigation from '@/components/navigation';
import { MascotMessage } from '@/components/mascot-message';
import { useAuthStore } from '@/stores/auth-store';
import { useCommunityStore } from '@/stores/community-store';
import { usePortfolioStore } from '@/stores/portfolio-store';
import { getDemoProfileData } from '@/lib/demo-data';
import type { ChatRequest } from '@/types';

// ---------------------------------------------------------------------------
// 데모 유저 목 bio 데이터
// ---------------------------------------------------------------------------

const DEMO_BIOS: Record<string, string> = {
  'demo-1':
    '안녕하세요! 5년차 프론트엔드 개발자로 React와 TypeScript를 주로 사용합니다. 사용자 경험에 관심이 많고, 오픈소스 기여를 즐깁니다.',
  'demo-2':
    '풀스택 개발자로 Node.js와 React를 중심으로 개발하고 있습니다. 스타트업에서 다양한 서비스를 경험했습니다.',
  'demo-3':
    'UI/UX 디자인과 프론트엔드 개발을 함께 하는 디자이너-개발자입니다. Figma부터 배포까지 혼자 다 합니다!',
};

function getDemoBio(userId: string): string {
  return DEMO_BIOS[userId] ?? '안녕하세요! 커폴이 서비스를 이용하는 개발자입니다.';
}

// ---------------------------------------------------------------------------
// 이메일 유효성 검사
// ---------------------------------------------------------------------------

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ---------------------------------------------------------------------------
// 타입 정의
// ---------------------------------------------------------------------------

interface ChatFormData {
  requesterName: string;
  requesterEmail: string;
  requesterOrganization: string;
  message: string;
}

interface ChatFormErrors {
  requesterName?: string;
  requesterEmail?: string;
  message?: string;
}

// ---------------------------------------------------------------------------
// Toast 컴포넌트
// ---------------------------------------------------------------------------

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div
      role="alert"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-5 py-3 rounded-xl shadow-lg text-sm z-50 max-w-sm w-full text-center"
    >
      {message}
    </div>
  );
}

// ---------------------------------------------------------------------------
// CoffeeChatModal (Requirements: 8.11, 8.12, 8.13)
// ---------------------------------------------------------------------------

interface CoffeeChatModalProps {
  targetUserName: string;
  toUserId: string;
  fromUserId: string;
  onClose: () => void;
  onSubmit: (data: ChatFormData) => void;
}

function CoffeeChatModal({
  targetUserName,
  onClose,
  onSubmit,
}: CoffeeChatModalProps) {
  const [form, setForm] = useState<ChatFormData>({
    requesterName: '',
    requesterEmail: '',
    requesterOrganization: '',
    message: '',
  });
  const [errors, setErrors] = useState<ChatFormErrors>({});
  const [submitted, setSubmitted] = useState(false);

  const validate = (): ChatFormErrors => {
    const errs: ChatFormErrors = {};
    if (!form.requesterName.trim()) errs.requesterName = '이름은 필수 항목이야!';
    if (!form.requesterEmail.trim()) {
      errs.requesterEmail = '이메일은 필수 항목이야!';
    } else if (!isValidEmail(form.requesterEmail)) {
      errs.requesterEmail = '유효한 이메일 형식으로 입력해줘!';
    }
    if (!form.message.trim()) errs.message = '메시지는 필수 항목이야!';
    return errs;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    onSubmit(form);
    setSubmitted(true);
  };

  const handleChange = (field: keyof ChatFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof ChatFormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="coffee-chat-modal-title"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        {submitted ? (
          <div className="flex flex-col items-center gap-4 py-4">
            <MascotMessage
              type="success"
              message={`커피챗 요청을 보냈어! ☕\n${targetUserName}님이 곧 답변해줄 거야~`}
            />
            <button
              type="button"
              onClick={onClose}
              className="mt-4 px-6 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors"
            >
              닫기
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-5">
              <h2
                id="coffee-chat-modal-title"
                className="text-lg font-bold text-gray-900"
              >
                ☕ {targetUserName}님께 커피챗 요청
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="모달 닫기"
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
              {/* 이름 (필수) */}
              <div>
                <label
                  htmlFor="chat-requester-name"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  이름 <span className="text-red-500">*</span>
                </label>
                <input
                  id="chat-requester-name"
                  type="text"
                  value={form.requesterName}
                  onChange={(e) => handleChange('requesterName', e.target.value)}
                  placeholder="홍길동"
                  aria-invalid={!!errors.requesterName}
                  aria-describedby={errors.requesterName ? 'chat-name-error' : undefined}
                  className={[
                    'w-full px-3 py-2 text-sm border rounded-lg outline-none transition-colors',
                    errors.requesterName
                      ? 'border-red-400 focus:border-red-500 bg-red-50'
                      : 'border-gray-300 focus:border-blue-400',
                  ].join(' ')}
                />
                {errors.requesterName && (
                  <p id="chat-name-error" className="mt-1 text-xs text-red-500">
                    {errors.requesterName}
                  </p>
                )}
              </div>

              {/* 이메일 (필수) */}
              <div>
                <label
                  htmlFor="chat-requester-email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  이메일 <span className="text-red-500">*</span>
                </label>
                <input
                  id="chat-requester-email"
                  type="email"
                  value={form.requesterEmail}
                  onChange={(e) => handleChange('requesterEmail', e.target.value)}
                  placeholder="example@email.com"
                  aria-invalid={!!errors.requesterEmail}
                  aria-describedby={errors.requesterEmail ? 'chat-email-error' : undefined}
                  className={[
                    'w-full px-3 py-2 text-sm border rounded-lg outline-none transition-colors',
                    errors.requesterEmail
                      ? 'border-red-400 focus:border-red-500 bg-red-50'
                      : 'border-gray-300 focus:border-blue-400',
                  ].join(' ')}
                />
                {errors.requesterEmail && (
                  <p id="chat-email-error" className="mt-1 text-xs text-red-500">
                    {errors.requesterEmail}
                  </p>
                )}
              </div>

              {/* 소속 (선택) */}
              <div>
                <label
                  htmlFor="chat-requester-org"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  소속{' '}
                  <span className="text-gray-400 text-xs font-normal">(선택)</span>
                </label>
                <input
                  id="chat-requester-org"
                  type="text"
                  value={form.requesterOrganization}
                  onChange={(e) =>
                    handleChange('requesterOrganization', e.target.value)
                  }
                  placeholder="회사명 또는 학교명"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-blue-400 outline-none transition-colors"
                />
              </div>

              {/* 메시지 (필수, 최대 500자) */}
              <div>
                <label
                  htmlFor="chat-message"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  메시지 <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="chat-message"
                  value={form.message}
                  onChange={(e) => handleChange('message', e.target.value)}
                  maxLength={500}
                  rows={4}
                  placeholder={`${targetUserName}님께 전달할 메시지를 입력해줘!`}
                  aria-invalid={!!errors.message}
                  aria-describedby={
                    errors.message ? 'chat-message-error' : 'chat-message-count'
                  }
                  className={[
                    'w-full px-3 py-2 text-sm border rounded-lg outline-none transition-colors resize-none',
                    errors.message
                      ? 'border-red-400 focus:border-red-500 bg-red-50'
                      : 'border-gray-300 focus:border-blue-400',
                  ].join(' ')}
                />
                <div className="flex items-start justify-between mt-1">
                  {errors.message ? (
                    <p id="chat-message-error" className="text-xs text-red-500">
                      {errors.message}
                    </p>
                  ) : (
                    <span />
                  )}
                  <p
                    id="chat-message-count"
                    className="text-xs text-gray-400 shrink-0"
                  >
                    {form.message.length}/500
                  </p>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-500 text-white text-sm font-semibold rounded-lg hover:bg-blue-600 active:bg-blue-700 transition-colors"
              >
                ☕ 커피챗 요청 보내기
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 메인 유저 프로필 페이지
// ---------------------------------------------------------------------------

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const userId = typeof params.id === 'string' ? params.id : '';

  const currentUser = useAuthStore((state) => state.user);
  const addChatRequest = useCommunityStore((state) => state.addChatRequest);
  const allPortfolios = usePortfolioStore((state) => state.portfolios);

  const [showCoffeeChatModal, setShowCoffeeChatModal] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // 데모 유저 여부
  const isDemoUser = userId.startsWith('demo-');

  // 데모 유저의 ProfileData 폴백
  const demoProfile = isDemoUser ? getDemoProfileData(userId) : null;

  // 해당 사용자의 공개 포트폴리오 (실제 사용자) — store 기반
  const userPublicPortfolios = allPortfolios.filter((p) => p.userId === userId && p.visibility === 'public');

  // 작성자 프로필 카드 정보: 데모면 데모 데이터, 실제면 본인 포트폴리오의 profileData에서 추론
  const firstPf = userPublicPortfolios[0];
  const profileCard = demoProfile
    ? { userId, name: demoProfile.name, title: demoProfile.title, profileImage: '', skills: demoProfile.skills, portfolioCount: 2 }
    : firstPf
    ? { userId, name: firstPf.ownerName, title: firstPf.profileData.title, profileImage: '', skills: firstPf.profileData.skills, portfolioCount: userPublicPortfolios.length }
    : undefined;

  // bio
  const bio = demoProfile?.bio ?? (isDemoUser ? getDemoBio(userId) : firstPf?.profileData.bio);

  // 본인 프로필 여부
  const isOwnProfile = currentUser?.id === userId;

  // 커피챗 버튼 표시: 로그인 + 타인 프로필
  const showCoffeeChatButton = !!currentUser && !isOwnProfile;

  // 데모 유저의 포트폴리오 개수
  const demoPortfolioCount = isDemoUser ? 2 : 0;

  // 포트폴리오 클릭 → 열람 페이지 이동 (Requirements: 8.8)
  const handlePortfolioClick = useCallback(
    (metaId: string) => {
      router.push(`/portfolio/view/${metaId}`);
    },
    [router]
  );

  // 커피챗 제출 (Requirements: 8.11, 8.13)
  const handleChatSubmit = useCallback(
    (formData: ChatFormData) => {
      if (!currentUser) return;

      const request: ChatRequest = {
        id: `chat_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        fromUserId: currentUser.id,
        toUserId: userId,
        requesterName: formData.requesterName.trim(),
        requesterEmail: formData.requesterEmail.trim(),
        requesterOrganization: formData.requesterOrganization.trim(),
        message: formData.message.trim(),
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      addChatRequest(request);
      setToast('☕ 커피챗 요청을 보냈어!');
    },
    [currentUser, userId, addChatRequest]
  );

  // 프로필 없음 + 데모 유저도 아님
  if (!profileCard && !isDemoUser) {
    return (
      <>
        <Navigation />
        <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="flex flex-col items-center gap-6 text-center">
            <MascotMessage
              type="error"
              message={`앗, 프로필을 찾을 수 없어!\nURL을 다시 확인해줘 😅`}
            />
            <p className="text-sm text-gray-500">존재하지 않거나 비공개 상태의 프로필이에요.</p>
            <button
              type="button"
              onClick={() => router.push('/community')}
              className="px-5 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors"
            >
              커뮤니티로 돌아가기
            </button>
          </div>
        </main>
      </>
    );
  }

  // 표시 데이터: 실제 프로필 우선, 없으면 데모 데이터
  const displayName =
    profileCard?.name ?? demoProfile?.name ??
    (isDemoUser ? `데모 유저 ${userId.replace('demo-', '')}` : userId);
  const displayTitle = profileCard?.title ?? demoProfile?.title ?? (isDemoUser ? '개발자' : '');
  const displayProfileImage = profileCard?.profileImage ?? '';
  const displaySkills = profileCard?.skills ?? demoProfile?.skills ?? [];

  return (
    <>
      <Navigation />

      <main className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">

          {/* ── 프로필 헤더 (Requirements: 8.6) ── */}
          <section
            aria-labelledby="user-profile-heading"
            className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6"
          >
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
              {/* 프로필 사진 (이모지 폴백) */}
              <div
                className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-4xl border-2 border-blue-200 shrink-0 overflow-hidden"
                aria-hidden={!displayProfileImage}
              >
                {displayProfileImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={displayProfileImage}
                    alt={`${displayName} 프로필 사진`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span
                    className="text-blue-600 font-bold"
                    role="img"
                    aria-label={`${displayName} 이니셜`}
                  >
                    {displayName.charAt(0)}
                  </span>
                )}
              </div>

              {/* 이름, 직함, 자기소개 */}
              <div className="flex-1 text-center sm:text-left">
                <h1
                  id="user-profile-heading"
                  className="text-2xl font-bold text-gray-900"
                >
                  {displayName}
                </h1>
                {displayTitle && (
                  <p className="text-base text-blue-600 font-medium mt-0.5">
                    {displayTitle}
                  </p>
                )}
                {bio && (
                  <p className="mt-2 text-sm text-gray-600 leading-relaxed max-w-lg">
                    {bio}
                  </p>
                )}

                {/* 기술 스택 태그 */}
                {displaySkills.length > 0 && (
                  <div
                    className="flex flex-wrap gap-1.5 mt-3 justify-center sm:justify-start"
                    aria-label="기술 스택"
                  >
                    {displaySkills.map((skill) => (
                      <span
                        key={skill}
                        className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 커피챗 요청 버튼 (Requirements: 8.9, 8.10) */}
            {showCoffeeChatButton && (
              <div className="mt-5 flex justify-center sm:justify-end">
                <button
                  type="button"
                  onClick={() => setShowCoffeeChatModal(true)}
                  className="px-5 py-2.5 bg-orange-500 text-white text-sm font-semibold rounded-xl hover:bg-orange-600 active:bg-orange-700 transition-colors shadow-sm"
                >
                  ☕ 커피챗 요청하기
                </button>
              </div>
            )}

            {/* 본인 프로필 안내 */}
            {isOwnProfile && (
              <p className="mt-4 text-sm text-gray-400 text-center sm:text-right">
                👤 내 프로필이에요
              </p>
            )}
          </section>

          {/* ── 공개 포트폴리오 목록 (Requirements: 8.7, 8.8) ── */}
          <section aria-labelledby="portfolio-list-heading">
            <h2
              id="portfolio-list-heading"
              className="text-lg font-bold text-gray-900 mb-4"
            >
              📁 공개 포트폴리오
            </h2>

            {userPublicPortfolios.length === 0 && demoPortfolioCount === 0 ? (
              <div className="py-10">
                <MascotMessage
                  type="guide"
                  message={`${displayName}님이 아직 공개한 포트폴리오가 없어!\n나중에 다시 확인해봐~ ✨`}
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 실제 저장된 공개 포트폴리오 */}
                {userPublicPortfolios.map((pf) => (
                  <button
                    key={pf.id}
                    type="button"
                    onClick={() => handlePortfolioClick(pf.id)}
                    className="group text-left bg-white rounded-xl border border-gray-200 shadow-sm p-4 hover:border-blue-300 hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1"
                    aria-label="포트폴리오 열람하기"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-xl shrink-0 group-hover:bg-blue-100 transition-colors">
                        📄
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {pf.title}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          공개됨 ·{' '}
                          {new Date(pf.updatedAt).toLocaleDateString('ko-KR', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                      <span
                        className="text-gray-300 group-hover:text-blue-400 transition-colors text-sm"
                        aria-hidden="true"
                      >
                        →
                      </span>
                    </div>
                  </button>
                ))}

                {/* 데모 유저의 데모 포트폴리오 */}
                {Array.from({ length: demoPortfolioCount }).map((_, i) => (
                  <button
                    key={`demo-pf-${i}`}
                    type="button"
                    onClick={() => handlePortfolioClick(`${userId}-${i}`)}
                    className="group text-left bg-white rounded-xl border border-gray-200 shadow-sm p-4 hover:border-blue-300 hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1"
                    aria-label="포트폴리오 열람하기"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-xl shrink-0 group-hover:bg-blue-100 transition-colors">
                        📄
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900">
                          {displayName}의 포트폴리오 #{i + 1}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">공개됨 · 클릭해서 열람하기</p>
                      </div>
                      <span
                        className="text-gray-300 group-hover:text-blue-400 transition-colors text-sm"
                        aria-hidden="true"
                      >
                        →
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      {/* 커피챗 요청 모달 (Requirements: 8.11, 8.12, 8.13) */}
      {showCoffeeChatModal && currentUser && (
        <CoffeeChatModal
          targetUserName={displayName}
          toUserId={userId}
          fromUserId={currentUser.id}
          onClose={() => setShowCoffeeChatModal(false)}
          onSubmit={handleChatSubmit}
        />
      )}

      {/* 토스트 알림 */}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </>
  );
}
