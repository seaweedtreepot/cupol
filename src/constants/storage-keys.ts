/**
 * CustomPortfolio: 대신취업해줘 - LocalStorage 키 상수 정의
 */

export const STORAGE_KEYS = {
  /** 인증 세션 정보 */
  AUTH_SESSION: 'cupol_auth_session',
  /** 프로필 데이터 */
  PROFILE_DATA: 'cupol_profile_data',
  /** 포트폴리오 목록 (GeneratedSite[]) */
  PORTFOLIOS: 'cupol_portfolios',
  /** 통합 포트폴리오 엔티티 (Portfolio[]) */
  PORTFOLIO_ITEMS: 'cupol_portfolio_items',
  /** 포트폴리오 메타 정보 (PortfolioMeta[]) */
  PORTFOLIO_META: 'cupol_portfolio_meta',
  /** 템플릿 커스터마이징 설정 */
  TEMPLATES_CUSTOMIZATION: 'cupol_template_custom',
  /** 커피챗 요청 목록 */
  CHAT_REQUESTS: 'cupol_chat_requests',
  /** 커뮤니티 공개 프로필 목록 */
  COMMUNITY_PROFILES: 'cupol_community_profiles',
  /** 온보딩 표시 여부 */
  ONBOARDING_SHOWN: 'cupol_onboarding_shown',
} as const;

/** STORAGE_KEYS의 값 타입 */
export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];
