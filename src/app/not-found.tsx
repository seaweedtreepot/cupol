/**
 * 전역 404 Not Found 페이지
 * Requirements: 2.5, 2.6
 */

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        {/* 커폴이 마스코트 일러스트 */}
        <div
          className="flex items-center justify-center w-20 h-20 rounded-full bg-yellow-100 text-4xl mx-auto mb-4"
          aria-hidden="true"
          style={{ minWidth: '48px', minHeight: '48px' }}
        >
          🧙
        </div>

        {/* 404 타이틀 */}
        <h1 className="text-5xl font-bold text-gray-800 mb-2">404</h1>

        {/* 커폴이 말풍선 메시지 */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl px-5 py-4 mb-6 text-left">
          <p className="text-sm leading-relaxed text-gray-800">
            앗, 커폴이가 이 페이지를 찾지 못했어요! 😅
            <br />
            주소가 잘못됐거나 삭제된 페이지일 수 있어요.
          </p>
        </div>

        <h2 className="text-lg font-semibold text-gray-700 mb-1">
          페이지를 찾을 수 없어요
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          요청하신 페이지가 존재하지 않아요.
        </p>

        {/* 돌아가기 버튼 */}
        <div className="flex gap-3 justify-center">
          <Link
            href="/"
            className="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
          >
            홈으로 돌아가기
          </Link>
          <Link
            href="/main"
            className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
          >
            메인 페이지
          </Link>
        </div>
      </div>
    </div>
  );
}
