/**
 * NextAuth.js App Router Route Handler
 * Next.js 14 App Router + NextAuth v4 호환 방식
 *
 * GET  /api/auth/*  — NextAuth 처리 (콜백, 세션 조회 등)
 * POST /api/auth/*  — NextAuth 처리 (로그인, 로그아웃 등)
 */

import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
