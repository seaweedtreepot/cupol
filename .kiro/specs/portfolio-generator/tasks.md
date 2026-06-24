# Implementation Plan: Portfolio Generator (CustomPortfolio: 대신취업해줘)

## Overview

Next.js 14 App Router 기반으로 포트폴리오 자동 생성 서비스를 구현한다. Zustand 상태 관리, React Hook Form + Zod 폼 검증, NextAuth.js 인증, LocalStorage 데이터 저장을 활용하며, 커폴이 마스코트 기반 UX를 전반에 적용한다. 각 태스크는 의존성 순서에 따라 기반 레이어부터 점진적으로 구현한다.

## Tasks

- [x] 1. 프로젝트 구조 및 핵심 타입/인터페이스 설정
  - [x] 1.1 프로젝트 디렉터리 구조 생성 및 공통 타입 정의
    - `/src/types/index.ts`에 모든 데이터 모델 인터페이스 정의 (UserSession, ProfileData, Project, Experience, Template, Customization, GeneratedSite, CompanyCriteria, FitReport, PortfolioMeta, ChatRequest, CommunityFilter, PublicProfileCard)
    - `/src/types/errors.ts`에 AppError 유니언 타입 정의
    - `/src/constants/storage-keys.ts`에 LocalStorage 키 상수 정의
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 6.1, 7.1, 8.11_

  - [x] 1.2 Zod 검증 스키마 및 유틸리티 함수 구현
    - `/src/lib/validators.ts`에 ProfileData, CompanyCriteria, ChatRequest 등의 Zod 스키마 정의
    - URL 검증 (http:// 또는 https:// 프로토콜 포함), 이메일 검증, HEX 색상코드 검증 함수 구현
    - 필드별 최대 길이 제한 적용 (이름 50자, 직함 50자, 자기소개 500자 등)
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 3.6, 5.7_

  - [x] 1.3 검증 유틸리티 프로퍼티 테스트 작성
    - **Property 12: URL 검증 정확성**
    - **Property 13: 이메일 검증 정확성**
    - **Property 14: 색상값 검증**
    - **Property 20: 이름 필수 필드 검증**
    - **Validates: Requirements 10.1, 10.2, 5.7, 3.6**

  - [x] 1.4 Vitest 및 fast-check 테스트 환경 설정
    - `vitest.config.ts` 설정
    - `/tests` 디렉터리 구조 생성 (unit, properties, integration)
    - fast-check 통합 설정
    - _Requirements: 전체 테스트 인프라_

- [x] 2. 상태 관리(Zustand Store) 구현
  - [x] 2.1 Auth Store 구현
    - `/src/stores/auth-store.ts`에 사용자 인증 상태 관리 (user, isAuthenticated, login, logout)
    - LocalStorage 연동 (persist 미들웨어)
    - _Requirements: 1.1, 1.3, 1.4, 1.7, 1.8_

  - [x] 2.2 Profile Store 구현
    - `/src/stores/profile-store.ts`에 프로필 데이터 및 포트폴리오 상태 관리
    - CRUD 기능 (saveProfile, updateProfile, deleteProfile)
    - JSON 내보내기/가져오기 (exportToJSON, importFromJSON) 로직 구현
    - 가져오기 시 Zod 검증 적용, 실패 시 기존 데이터 보존
    - LocalStorage persist
    - _Requirements: 3.7, 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

  - [x] 2.3 Profile Store JSON 직렬화 프로퍼티 테스트 작성
    - **Property 1: ProfileData JSON 직렬화 라운드트립**
    - **Property 2: 잘못된 JSON 가져오기 시 상태 보존**
    - **Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5, 9.6**

  - [x] 2.4 Template Store 구현
    - `/src/stores/template-store.ts`에 템플릿 목록, 선택된 템플릿, 커스터마이징 설정 관리
    - 기본 템플릿 3개 이상 데이터 정의
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [x] 2.5 Community Store 구현
    - `/src/stores/community-store.ts`에 공개 프로필 목록, 필터, 커피챗 요청 관리
    - 필터링 로직 (직무, 기업, 기술 스택)
    - 페이지네이션 로직 (페이지당 12개)
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.14, 8.15_

  - [x] 2.6 커뮤니티 필터/페이지네이션 프로퍼티 테스트 작성
    - **Property 15: 커뮤니티 필터 정확성**
    - **Property 16: 페이지네이션 크기 제한**
    - **Validates: Requirements 8.1, 8.2, 8.3, 8.4**

- [x] 3. Checkpoint - 기반 레이어 검증
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. 핵심 비즈니스 로직 모듈 구현
  - [x] 4.1 Fit Analyzer 모듈 구현
    - `/src/lib/fit-analyzer.ts`에 순수 함수로 구현
    - `calculateTechMatchRate`: (교집합 / 요구기술 수) × 100
    - `calculateOverallScore`: 기술일치율, 경력충족, 역할적합도 가중 합산 (0~100)
    - `generateSuggestions`: 분석 결과 기반 최소 1개 이상 개선 제안 생성
    - `analyze`: 전체 분석 수행하여 FitReport 반환
    - _Requirements: 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

  - [x] 4.2 Fit Analyzer 프로퍼티 테스트 작성
    - **Property 3: 기술 스택 일치율 계산 정확성**
    - **Property 4: 부족 기술 스택 = 집합 차이**
    - **Property 5: 경력 요구사항 충족 판정**
    - **Property 6: 전체 적합도 점수 범위**
    - **Property 7: 개선 제안 최소 1개 보장**
    - **Validates: Requirements 6.3, 6.4, 6.5, 6.6, 6.7**

  - [x] 4.3 Visibility Controller 모듈 구현
    - `/src/lib/visibility-controller.ts`에 공개/비공개 상태 관리 로직 구현
    - `setVisibility`, `getVisibility`, `generateShareURL`, `canAccess` 함수
    - 기본값 Private, 소유자 항상 접근 가능, Public만 외부 접근 허용
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

  - [x] 4.4 Visibility Controller 프로퍼티 테스트 작성
    - **Property 8: 포트폴리오 접근 제어 규칙**
    - **Validates: Requirements 7.3, 7.6, 7.7**

  - [x] 4.5 Site Builder 및 Template Engine 구현
    - `/src/lib/site-builder.ts`에 HTML/CSS 생성 로직 구현
    - `/src/lib/template-engine.ts`에 템플릿 적용 로직 구현
    - 빈 섹션 필터링 (비어있는 데이터 = 해당 섹션 생략)
    - 반응형 메타태그 (viewport) 삽입
    - 커스터마이징 (색상, 폰트) CSS 반영
    - 깃허브 URL 조건부 하이퍼링크 렌더링
    - HTML Blob 다운로드 기능
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 5.6_

  - [x] 4.6 Site Builder 프로퍼티 테스트 작성
    - **Property 9: 사이트 생성 시 빈 섹션 생략**
    - **Property 10: 생성된 사이트 반응형 메타태그 포함**
    - **Property 11: 커스터마이징 반영**
    - **Property 19: 깃허브 URL 조건부 렌더링**
    - **Validates: Requirements 4.2, 4.3, 5.6, 4.6**

- [x] 5. Checkpoint - 핵심 로직 검증
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. 인증 및 공통 UI 컴포넌트 구현
  - [x] 6.1 NextAuth.js 설정 및 Google OAuth 연동
    - `/src/app/api/auth/[...nextauth]/route.ts`에 NextAuth 설정
    - Google OAuth Provider 구성
    - 세션 콜백 설정 (UserSession 매핑)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [x] 6.2 마스코트 커폴이 메시지 컴포넌트 구현
    - `/src/components/mascot-message.tsx`에 MascotMessage 컴포넌트 구현
    - type별 일러스트/메시지 스타일 분기 (guide, loading, success, error, welcome)
    - 말풍선 형태 레이아웃 (일러스트 48x48px 이상 + 텍스트 영역)
    - 친근한 반말체 톤 유지
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.7, 11.8_

  - [x] 6.3 네비게이션 컴포넌트 구현
    - `/src/components/navigation.tsx`에 공통 네비게이션 구현
    - 메뉴 항목: 포트폴리오 생성, 마이페이지, 커뮤니티
    - 현재 활성 메뉴 시각적 구분
    - 로그아웃 버튼 포함
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.6, 1.7_

  - [x] 6.4 폼 필드 공통 컴포넌트 구현
    - `/src/components/form-field.tsx`에 재사용 가능한 폼 필드 구현
    - text, email, url, textarea, tags 타입 지원
    - 에러 표시 (붉은색 테두리 + 오류 메시지)
    - 실시간 검증 (포커스 이동 시 검증 트리거)
    - _Requirements: 10.3, 10.4, 10.5, 3.6_

  - [x] 6.5 인증 가드 미들웨어 구현
    - `/src/middleware.ts`에 비인증 사용자 리다이렉트 로직 구현
    - 보호 경로 목록 정의 (/main, /portfolio/*, /mypage/*, /community/*)
    - _Requirements: 2.5_

- [x] 7. 페이지 구현 - 로그인 및 메인
  - [x] 7.1 로그인 페이지 구현
    - `/src/app/page.tsx`에 로그인/랜딩 페이지 구현
    - 구글 로그인 버튼, 커폴이 환영 메시지
    - 인증 실패/네트워크 오류 메시지 표시
    - 로그인 성공 시 Main_Page로 리다이렉트
    - _Requirements: 1.1, 1.2, 1.5, 1.6, 1.9_

  - [x] 7.2 메인 페이지 구현
    - `/src/app/main/page.tsx`에 메인 페이지 구현
    - 네비게이션 허브 (포트폴리오 생성, 마이페이지, 커뮤니티 링크)
    - 첫 로그인 시 온보딩 커폴이 메시지 (1회)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 11.6_

- [x] 8. 페이지 구현 - 포트폴리오 생성 흐름
  - [x] 8.1 포트폴리오 입력 폼 페이지 구현
    - `/src/app/portfolio/create/page.tsx`에 스텝 위저드 형태의 입력 폼 구현
    - React Hook Form + Zod 통합
    - 이름, 직함, 자기소개, 연락처, 기술 스택(태그 입력, 최대 30개), 깃허브 URL, 프로젝트 목록(추가/삭제, 최대 20개), 경력 목록(추가/삭제, 최대 20개)
    - 필수 필드 미입력 시 제출 차단 + 시각적 오류 표시
    - 포커스 이동 시 URL/이메일 실시간 검증
    - 저장 완료 시 커폴이 성공 메시지
    - 단계별 커폴이 가이드 메시지
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 10.1, 10.2, 10.5, 10.6, 11.2, 11.4_

  - [x] 8.2 템플릿 선택 및 커스터마이징 페이지 구현
    - 입력 폼 위저드의 다음 단계로 템플릿 선택 UI 구현
    - 최소 3개 템플릿 썸네일 목록 표시
    - 색상 선택기 (Primary, Secondary Color - HEX 입력)
    - 폰트 스타일 선택 (Serif, Sans-serif, Monospace)
    - 변경 시 2초 이내 미리보기 반영
    - 잘못된 색상값 입력 시 오류 메시지
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

  - [x] 8.3 포트폴리오 생성 및 미리보기 페이지 구현
    - `/src/app/portfolio/preview/[id]/page.tsx`에 미리보기 페이지 구현
    - "생성" 버튼 클릭 시 Site Builder 호출 + 로딩 표시 (커폴이 마법 시전)
    - 생성 완료 시 미리보기 표시 + 커폴이 축하 메시지
    - HTML 다운로드 버튼 제공
    - 생성 실패 시 에러 핸들링 (데이터 보존 + 재시도)
    - _Requirements: 4.1, 4.4, 4.5, 4.7, 11.1, 11.3, 11.5_

  - [x] 8.4 공개 포트폴리오 열람 페이지 구현
    - `/src/app/portfolio/view/[id]/page.tsx`에 외부 열람 페이지 구현
    - Visibility Controller 연동 (Public만 접근 가능)
    - Private 접근 시 비공개 안내 메시지
    - _Requirements: 7.3, 7.6_

- [x] 9. 페이지 구현 - 마이페이지 및 적합도 분석
  - [x] 9.1 마이페이지 구현
    - `/src/app/mypage/page.tsx`에 마이페이지 구현
    - 내 포트폴리오 목록 표시 (수정, 삭제 가능)
    - 공개/비공개 토글 (기본값 Private)
    - 공유 URL 표시 (Public 상태 시)
    - JSON 내보내기/가져오기 버튼
    - 커피챗 대시보드 (받은 요청 목록, 수락/거절 기능)
    - _Requirements: 7.1, 7.2, 7.4, 7.5, 7.7, 9.1, 9.2, 8.14, 8.15, 8.16, 8.17_

  - [x] 9.2 적합도 분석 페이지 구현
    - `/src/app/mypage/fit-analysis/page.tsx`에 적합도 분석 페이지 구현
    - Company_Criteria 입력 폼 (요구 기술 스택 필수 1개 이상)
    - "분석" 버튼 → Fit Analyzer 호출
    - 결과 표시: 기술 일치율 (%), 부족 기술 목록, 경력 충족 여부, 전체 점수 게이지, 개선 제안
    - Profile_Data 미입력 시 안내 메시지
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9_

- [x] 10. 페이지 구현 - 커뮤니티 및 커피챗
  - [x] 10.1 커뮤니티 페이지 구현
    - `/src/app/community/page.tsx`에 커뮤니티 페이지 구현
    - 공개 프로필 카드 목록 (한 페이지 최대 12개)
    - 필터링 UI (직무, 기업, 기술 스택)
    - 페이지네이션
    - 카드 클릭 시 User_Profile_Page 이동
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [x] 10.2 유저 프로필 페이지 구현
    - `/src/app/community/user/[id]/page.tsx`에 유저 프로필 페이지 구현
    - 사용자 기본 정보 표시 (이름, 직함, 자기소개, 프로필 사진)
    - 공개 포트폴리오 목록 표시 + 클릭 시 열람
    - 커피챗 요청 버튼 (본인 프로필이면 숨김)
    - _Requirements: 8.6, 8.7, 8.8, 8.9, 8.10_

  - [x] 10.3 커피챗 요청 폼 구현
    - 커피챗 요청 모달/폼 구현 (요청자 이름, 이메일, 소속, 메시지)
    - 필수 필드 검증 (이름, 이메일, 메시지 - 빈 문자열/공백 차단)
    - 제출 시 대상 사용자의 커피챗 대시보드에 요청 추가
    - _Requirements: 8.11, 8.12, 8.13_

  - [x] 10.4 커피챗 UI 로직 프로퍼티 테스트 작성
    - **Property 17: 커피챗 버튼 표시 규칙**
    - **Property 18: 필수 필드 미입력 시 제출 차단**
    - **Validates: Requirements 8.9, 8.10, 8.12**

- [x] 11. Checkpoint - 전체 기능 통합 검증
  - Ensure all tests pass, ask the user if questions arise.

- [x] 12. 에러 바운더리 및 최종 통합
  - [x] 12.1 전역 에러 바운더리 구현
    - `/src/components/error-boundary.tsx`에 React Error Boundary 구현
    - 에러 타입별 커폴이 메시지 분기
    - 복구 가능 에러: 재시도 버튼 제공
    - 치명적 에러: 새로고침 안내
    - LocalStorage 불가 시 인메모리 폴백
    - _Requirements: 4.7, 11.4, 11.5_

  - [x] 12.2 레이아웃 및 라우팅 통합
    - `/src/app/layout.tsx`에 공통 레이아웃 적용 (네비게이션, 에러 바운더리)
    - 모든 라우트 연결 확인
    - 인증 상태에 따른 리다이렉트 동작 확인
    - _Requirements: 2.5, 2.6_

  - [x] 12.3 통합 테스트 작성
    - 포트폴리오 생성 흐름 (입력 → 템플릿 선택 → 생성 → 미리보기)
    - 커뮤니티 탐색 흐름 (필터 → 프로필 방문 → 커피챗 요청)
    - _Requirements: 전체 통합 흐름_

- [x] 13. Final Checkpoint - 전체 테스트 및 최종 확인
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- 각 태스크는 구체적인 요구사항을 참조하여 추적 가능성을 보장합니다
- Checkpoint에서 모든 테스트가 통과하는지 확인합니다
- 프로퍼티 테스트는 설계 문서의 Correctness Properties를 직접 검증합니다
- 단위 테스트와 프로퍼티 테스트는 상호 보완적으로 사용됩니다
- LocalStorage 기반 프론트엔드 프로토타입이므로, 향후 백엔드 연동 시 데이터 레이어만 교체 가능하도록 구현합니다

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.4"] },
    { "id": 1, "tasks": ["1.2"] },
    { "id": 2, "tasks": ["1.3", "2.1", "2.4"] },
    { "id": 3, "tasks": ["2.2", "2.5"] },
    { "id": 4, "tasks": ["2.3", "2.6"] },
    { "id": 5, "tasks": ["4.1", "4.3", "4.5"] },
    { "id": 6, "tasks": ["4.2", "4.4", "4.6"] },
    { "id": 7, "tasks": ["6.1", "6.2", "6.3", "6.4", "6.5"] },
    { "id": 8, "tasks": ["7.1", "7.2"] },
    { "id": 9, "tasks": ["8.1", "8.2"] },
    { "id": 10, "tasks": ["8.3", "8.4", "9.1", "9.2"] },
    { "id": 11, "tasks": ["10.1", "10.2", "10.3"] },
    { "id": 12, "tasks": ["10.4"] },
    { "id": 13, "tasks": ["12.1", "12.2"] },
    { "id": 14, "tasks": ["12.3"] }
  ]
}
```
