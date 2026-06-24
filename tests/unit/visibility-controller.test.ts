/**
 * Visibility Controller 단위 테스트
 *
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7
 */

import { describe, it, expect } from 'vitest';
import {
  setVisibility,
  getVisibility,
  generateShareURL,
  canAccess,
} from '@/lib/visibility-controller';
import type { PortfolioMeta } from '@/types';

// ─── 헬퍼 ────────────────────────────────────────────────────────────────────

function makeMeta(overrides: Partial<PortfolioMeta> = {}): PortfolioMeta {
  return {
    id: 'portfolio-1',
    userId: 'user-owner',
    profileDataId: 'profile-1',
    visibility: 'private',
    shareUrl: '',
    generatedSiteId: 'site-1',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  };
}

// ─── generateShareURL ─────────────────────────────────────────────────────────

describe('generateShareURL', () => {
  it('올바른 상대 경로 형식을 반환한다', () => {
    expect(generateShareURL('abc-123')).toBe('/portfolio/view/abc-123');
  });

  it('포트폴리오 ID가 URL 경로에 포함된다', () => {
    const id = 'my-unique-portfolio-id';
    expect(generateShareURL(id)).toContain(id);
  });

  it('/portfolio/view/ 접두사로 시작한다', () => {
    expect(generateShareURL('anything')).toMatch(/^\/portfolio\/view\//);
  });
});

// ─── getVisibility ────────────────────────────────────────────────────────────

describe('getVisibility', () => {
  it('private 상태를 반환한다', () => {
    const meta = makeMeta({ visibility: 'private' });
    expect(getVisibility(meta)).toBe('private');
  });

  it('public 상태를 반환한다', () => {
    const meta = makeMeta({ visibility: 'public' });
    expect(getVisibility(meta)).toBe('public');
  });
});

// ─── setVisibility ────────────────────────────────────────────────────────────

describe('setVisibility', () => {
  describe('private → public 전환', () => {
    it('visibility가 public으로 변경된다 (Req 7.1)', () => {
      const meta = makeMeta({ visibility: 'private', shareUrl: '' });
      const result = setVisibility(meta, 'public');
      expect(result.visibility).toBe('public');
    });

    it('shareUrl이 없을 때 자동으로 생성된다 (Req 7.2)', () => {
      const meta = makeMeta({ visibility: 'private', shareUrl: '' });
      const result = setVisibility(meta, 'public');
      expect(result.shareUrl).toBe(`/portfolio/view/${meta.id}`);
    });

    it('이미 shareUrl이 있으면 기존 값을 유지한다', () => {
      const existingUrl = '/portfolio/view/portfolio-1';
      const meta = makeMeta({ visibility: 'private', shareUrl: existingUrl });
      const result = setVisibility(meta, 'public');
      expect(result.shareUrl).toBe(existingUrl);
    });

    it('updatedAt이 갱신된다', () => {
      const meta = makeMeta({ updatedAt: '2020-01-01T00:00:00.000Z' });
      const result = setVisibility(meta, 'public');
      expect(result.updatedAt).not.toBe(meta.updatedAt);
    });

    it('원본 meta 객체를 변경하지 않는다 (불변성)', () => {
      const meta = makeMeta({ visibility: 'private' });
      setVisibility(meta, 'public');
      expect(meta.visibility).toBe('private');
    });
  });

  describe('public → private 전환', () => {
    it('visibility가 private으로 변경된다 (Req 7.7)', () => {
      const meta = makeMeta({
        visibility: 'public',
        shareUrl: '/portfolio/view/portfolio-1',
      });
      const result = setVisibility(meta, 'private');
      expect(result.visibility).toBe('private');
    });

    it('기존 shareUrl은 보존된다 (접근 차단은 canAccess에서 처리)', () => {
      const existingUrl = '/portfolio/view/portfolio-1';
      const meta = makeMeta({
        visibility: 'public',
        shareUrl: existingUrl,
      });
      const result = setVisibility(meta, 'private');
      expect(result.shareUrl).toBe(existingUrl);
    });

    it('updatedAt이 갱신된다', () => {
      const meta = makeMeta({
        visibility: 'public',
        updatedAt: '2020-01-01T00:00:00.000Z',
      });
      const result = setVisibility(meta, 'private');
      expect(result.updatedAt).not.toBe(meta.updatedAt);
    });

    it('원본 meta 객체를 변경하지 않는다 (불변성)', () => {
      const meta = makeMeta({ visibility: 'public' });
      setVisibility(meta, 'private');
      expect(meta.visibility).toBe('public');
    });
  });
});

// ─── canAccess ────────────────────────────────────────────────────────────────

describe('canAccess', () => {
  describe('소유자 접근 (Req 7.6)', () => {
    it('소유자는 private 포트폴리오에 접근 가능하다', () => {
      const meta = makeMeta({ userId: 'owner-id', visibility: 'private' });
      expect(canAccess(meta, 'owner-id')).toBe(true);
    });

    it('소유자는 public 포트폴리오에 접근 가능하다', () => {
      const meta = makeMeta({ userId: 'owner-id', visibility: 'public' });
      expect(canAccess(meta, 'owner-id')).toBe(true);
    });
  });

  describe('비소유자 인증 사용자 (Req 7.3, 7.7)', () => {
    it('비소유자는 public 포트폴리오에 접근 가능하다', () => {
      const meta = makeMeta({ userId: 'owner-id', visibility: 'public' });
      expect(canAccess(meta, 'other-user')).toBe(true);
    });

    it('비소유자는 private 포트폴리오에 접근 불가하다', () => {
      const meta = makeMeta({ userId: 'owner-id', visibility: 'private' });
      expect(canAccess(meta, 'other-user')).toBe(false);
    });
  });

  describe('비인증 외부 방문자 (userId === null) (Req 7.3)', () => {
    it('비인증 방문자는 public 포트폴리오에 접근 가능하다', () => {
      const meta = makeMeta({ visibility: 'public' });
      expect(canAccess(meta, null)).toBe(true);
    });

    it('비인증 방문자는 private 포트폴리오에 접근 불가하다', () => {
      const meta = makeMeta({ visibility: 'private' });
      expect(canAccess(meta, null)).toBe(false);
    });
  });

  describe('private → public 전환 후 접근 가능 여부 (Req 7.7 통합)', () => {
    it('private 전환 후 기존 shareUrl로 비소유자 접근이 차단된다', () => {
      const publicMeta = makeMeta({
        userId: 'owner-id',
        visibility: 'public',
        shareUrl: '/portfolio/view/portfolio-1',
      });
      const privateMeta = setVisibility(publicMeta, 'private');
      // shareUrl은 남아있지만 접근은 차단되어야 한다
      expect(privateMeta.shareUrl).not.toBe('');
      expect(canAccess(privateMeta, null)).toBe(false);
      expect(canAccess(privateMeta, 'other-user')).toBe(false);
    });

    it('private 전환 후에도 소유자는 접근 가능하다', () => {
      const publicMeta = makeMeta({
        userId: 'owner-id',
        visibility: 'public',
      });
      const privateMeta = setVisibility(publicMeta, 'private');
      expect(canAccess(privateMeta, 'owner-id')).toBe(true);
    });
  });

  describe('기본값 Private (Req 7.4)', () => {
    it('visibility 기본값 private인 포트폴리오는 외부 접근 불가하다', () => {
      // 기본 생성 시 visibility: 'private' 이어야 함
      const meta = makeMeta(); // visibility: 'private' (기본값)
      expect(meta.visibility).toBe('private');
      expect(canAccess(meta, null)).toBe(false);
      expect(canAccess(meta, 'any-user')).toBe(false);
    });
  });
});
