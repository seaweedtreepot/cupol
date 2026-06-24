/**
 * NextAuth.js 설정 및 auth 헬퍼
 * Google OAuth Provider 구성 + UserSession 매핑
 */

import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import type { UserSession } from "@/types/index";

// next-auth 모듈 타입 확장 — Session에 UserSession 필드 추가
declare module "next-auth" {
  interface Session {
    user: UserSession;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],

  secret: process.env.NEXTAUTH_SECRET,

  callbacks: {
    /**
     * session 콜백: next-auth의 기본 Session을 UserSession 형태로 매핑한다.
     * 프로토타입 단계이므로 isFirstLogin은 false로 고정한다.
     * 향후 DB 연동 시 신규 사용자 여부를 여기서 판별하면 된다.
     *
     * 주의: Session.user는 이미 UserSession으로 확장 선언되어 있으므로
     * Google 원본 필드(image, name, email)는 token에서 읽는다.
     */
    async session({ session, token }) {
      const userSession: UserSession = {
        id: (token.sub ?? "") as string,
        name: (token.name ?? "") as string,
        email: (token.email ?? "") as string,
        profileImage: (token.picture ?? "") as string,
        isFirstLogin: (token.isFirstLogin as boolean) ?? false,
      };

      session.user = userSession;
      return session;
    },

    /**
     * jwt 콜백: 최초 로그인 여부를 토큰에 저장한다.
     * account가 존재한다는 것은 OAuth 로그인이 방금 완료된 것(최초 혹은 재로그인)을 의미한다.
     * 프로토타입에서는 isFirstLogin을 false로 유지한다.
     */
    async jwt({ token, account }) {
      if (account) {
        // account가 있으면 방금 로그인한 것.
        // 실제 DB가 없으므로 isFirstLogin은 false로 설정한다.
        token.isFirstLogin = false;
      }
      return token;
    },
  },

  pages: {
    signIn: "/",
    error: "/",
  },
};

/**
 * 서버 컴포넌트 / Route Handler에서 세션을 가져오는 헬퍼.
 * next-auth/next의 getServerSession을 래핑하여 authOptions를 자동으로 주입한다.
 */
export async function getAppServerSession() {
  const { getServerSession } = await import("next-auth/next");
  return getServerSession(authOptions);
}
