/**
 * Visibility Controller
 * 포트폴리오 공개/비공개 상태 관리 모듈
 *
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7
 *
 * 설계 원칙:
 * - 순수 함수(pure functions)로 구현: PortfolioMeta 객체를 직접 조작, 스토어 의존 없음
 * - 기본값: Private (신규 생성 시 비공개)
 * - 소유자(userId === ownerId)는 항상 접근 가능
 * - Public 상태에서만 외부 사용자 접근 허용
 */

import type { PortfolioMeta } from '@/types';

/**
 * 포트폴리오의 visibility를 변경한 새 PortfolioMeta 객체를 반환한다.
 *
 * - 'public'으로 설정 시: shareUrl이 비어있으면 자동 생성
 * - 'private'으로 설정 시: shareUrl은 유지되나 canAccess에서 접근이 차단됨 (Req 7.7)
 *
 * Requirements: 7.1, 7.2, 7.5, 7.7
 */
export function setVisibility(
  meta: PortfolioMeta,
  visibility: 'public' | 'private'
): PortfolioMeta {
  const now = new Date().toISOString();

  if (visibility === 'public') {
    // Public 전환 시 shareUrl이 없으면 생성 (Req 7.2)
    const shareUrl = meta.shareUrl || generateShareURL(meta.id);
    return {
      ...meta,
      visibility: 'public',
      shareUrl,
      updatedAt: now,
    };
  }

  // Private 전환: shareUrl은 보존하되 외부 접근은 canAccess에서 차단 (Req 7.7)
  return {
    ...meta,
    visibility: 'private',
    updatedAt: now,
  };
}

/**
 * 포트폴리오의 현재 visibility를 반환한다.
 *
 * Requirements: 7.1, 7.4
 */
export function getVisibility(meta: PortfolioMeta): 'public' | 'private' {
  return meta.visibility;
}

/**
 * 포트폴리오 공유 URL을 생성한다.
 *
 * 형식: `/portfolio/view/${portfolioId}` (상대 경로; base URL은 UI 레이어에서 추가)
 *
 * Requirements: 7.2
 */
export function generateShareURL(portfolioId: string): string {
  return `/portfolio/view/${portfolioId}`;
}

/**
 * 특정 사용자가 해당 포트폴리오에 접근 가능한지 판단한다.
 *
 * 접근 규칙:
 * - 소유자(userId === meta.userId)는 visibility에 관계없이 항상 접근 가능 (Req 7.6)
 * - null userId(비인증 외부 방문자)는 Public 상태일 때만 접근 가능 (Req 7.3)
 * - 인증된 비소유자도 Public 상태일 때만 접근 가능 (Req 7.3, 7.7)
 *
 * Requirements: 7.3, 7.6, 7.7
 */
export function canAccess(
  meta: PortfolioMeta,
  userId: string | null
): boolean {
  // 소유자는 항상 접근 가능
  if (userId !== null && userId === meta.userId) {
    return true;
  }

  // 비소유자 또는 비인증 사용자: Public일 때만 접근 가능
  return meta.visibility === 'public';
}
