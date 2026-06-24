/**
 * Auth Store 단위 테스트
 * Requirements: 1.1, 1.3, 1.4, 1.7, 1.8
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '@/stores/auth-store';
import type { UserSession } from '@/types';

const mockUser: UserSession = {
  id: 'user-001',
  name: '홍길동',
  email: 'hong@example.com',
  profileImage: 'https://example.com/profile.jpg',
  isFirstLogin: false,
};

const firstLoginUser: UserSession = {
  id: 'user-002',
  name: '김신입',
  email: 'newbie@example.com',
  profileImage: '',
  isFirstLogin: true,
};

describe('Auth Store', () => {
  beforeEach(() => {
    // 각 테스트 전 스토어 초기화
    useAuthStore.setState({ user: null, isAuthenticated: false });
  });

  describe('초기 상태', () => {
    it('user는 null이어야 한다', () => {
      const { user } = useAuthStore.getState();
      expect(user).toBeNull();
    });

    it('isAuthenticated는 false이어야 한다', () => {
      const { isAuthenticated } = useAuthStore.getState();
      expect(isAuthenticated).toBe(false);
    });
  });

  describe('login()', () => {
    it('user를 설정하고 isAuthenticated를 true로 변경해야 한다', () => {
      useAuthStore.getState().login(mockUser);

      const { user, isAuthenticated } = useAuthStore.getState();
      expect(user).toEqual(mockUser);
      expect(isAuthenticated).toBe(true);
    });

    it('첫 로그인 사용자(isFirstLogin=true) 세션을 올바르게 설정해야 한다', () => {
      useAuthStore.getState().login(firstLoginUser);

      const { user, isAuthenticated } = useAuthStore.getState();
      expect(user).toEqual(firstLoginUser);
      expect(user?.isFirstLogin).toBe(true);
      expect(isAuthenticated).toBe(true);
    });

    it('이미 로그인된 상태에서 다시 login 호출 시 사용자가 교체되어야 한다', () => {
      useAuthStore.getState().login(mockUser);
      useAuthStore.getState().login(firstLoginUser);

      const { user } = useAuthStore.getState();
      expect(user?.id).toBe('user-002');
    });
  });

  describe('logout()', () => {
    it('user를 null로, isAuthenticated를 false로 초기화해야 한다', () => {
      useAuthStore.getState().login(mockUser);
      useAuthStore.getState().logout();

      const { user, isAuthenticated } = useAuthStore.getState();
      expect(user).toBeNull();
      expect(isAuthenticated).toBe(false);
    });

    it('로그인하지 않은 상태에서 logout을 호출해도 오류가 발생하지 않아야 한다', () => {
      expect(() => useAuthStore.getState().logout()).not.toThrow();

      const { user, isAuthenticated } = useAuthStore.getState();
      expect(user).toBeNull();
      expect(isAuthenticated).toBe(false);
    });
  });

  describe('setUser()', () => {
    it('user를 업데이트하고 isAuthenticated를 true로 유지해야 한다', () => {
      useAuthStore.getState().login(mockUser);

      const updatedUser: UserSession = { ...mockUser, name: '홍길동(수정)' };
      useAuthStore.getState().setUser(updatedUser);

      const { user, isAuthenticated } = useAuthStore.getState();
      expect(user?.name).toBe('홍길동(수정)');
      expect(isAuthenticated).toBe(true);
    });

    it('비로그인 상태에서 setUser 호출 시 isAuthenticated가 true로 설정되어야 한다', () => {
      useAuthStore.getState().setUser(mockUser);

      const { user, isAuthenticated } = useAuthStore.getState();
      expect(user).toEqual(mockUser);
      expect(isAuthenticated).toBe(true);
    });
  });

  describe('UserSession 필드 보존', () => {
    it('login 후 모든 UserSession 필드가 정확히 보존되어야 한다', () => {
      useAuthStore.getState().login(mockUser);

      const { user } = useAuthStore.getState();
      expect(user?.id).toBe(mockUser.id);
      expect(user?.name).toBe(mockUser.name);
      expect(user?.email).toBe(mockUser.email);
      expect(user?.profileImage).toBe(mockUser.profileImage);
      expect(user?.isFirstLogin).toBe(mockUser.isFirstLogin);
    });
  });

  describe('persist 스토리지 키', () => {
    it('스토리지 키가 cupol_auth_session이어야 한다', () => {
      // persist 미들웨어의 name 설정 확인
      const storeName = useAuthStore.persist.getOptions().name;
      expect(storeName).toBe('cupol_auth_session');
    });
  });
});
