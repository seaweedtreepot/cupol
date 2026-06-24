'use client';

/**
 * NextAuth SessionProvider 클라이언트 래퍼
 * 서버 컴포넌트인 RootLayout에서 SessionProvider를 사용하기 위한 브릿지 컴포넌트
 */

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';
import type { Session } from 'next-auth';
import { SessionSync } from '@/components/session-sync';

interface SessionProviderProps {
  children: React.ReactNode;
  session?: Session | null;
}

export function SessionProvider({ children, session }: SessionProviderProps) {
  return (
    <NextAuthSessionProvider session={session}>
      <SessionSync>{children}</SessionSync>
    </NextAuthSessionProvider>
  );
}

export default SessionProvider;
