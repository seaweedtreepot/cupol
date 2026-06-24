'use client';

/**
 * NextAuth 세션을 Zustand auth-store로 동기화하는 브릿지 컴포넌트.
 * 구글 로그인(NextAuth) 결과를 앱 전역 상태(useAuthStore)에 반영한다.
 */

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useAuthStore } from '@/stores/auth-store';
import type { UserSession } from '@/types';

export function SessionSync({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const login = useAuthStore((s) => s.login);
  const logout = useAuthStore((s) => s.logout);

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      const u = session.user as Partial<UserSession> & {
        name?: string | null;
        email?: string | null;
        image?: string | null;
        profileImage?: string | null;
        id?: string;
      };
      const userSession: UserSession = {
        id: u.id ?? u.email ?? 'unknown',
        name: u.name ?? '사용자',
        email: u.email ?? '',
        profileImage: u.profileImage ?? u.image ?? '',
        isFirstLogin: u.isFirstLogin ?? false,
      };
      login(userSession);
    } else if (status === 'unauthenticated') {
      logout();
    }
  }, [status, session, login, logout]);

  return <>{children}</>;
}

export default SessionSync;
