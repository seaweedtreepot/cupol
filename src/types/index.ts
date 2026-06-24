/**
 * CustomPortfolio: 대신취업해줘 - 데이터 모델 인터페이스 정의
 */

/** 사용자 세션 */
export interface UserSession {
  id: string;
  name: string;
  email: string;
  profileImage: string;
  isFirstLogin: boolean;
}

/** 프로필 데이터 */
export interface ProfileData {
  id: string;
  userId: string;
  name: string; // 필수, 최대 50자
  title: string; // 직함, 최대 50자
  bio: string; // 자기소개, 최대 500자
  email: string; // 연락처 이메일
  skills: string[]; // 기술 스택 태그, 최대 30개
  githubUrl: string; // 깃허브 프로필 URL
  projects: Project[]; // 프로젝트 목록, 최대 20개
  experiences: Experience[]; // 경력 목록, 최대 20개
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

/** 프로젝트 */
export interface Project {
  id: string;
  title: string; // 최대 100자
  description: string; // 최대 1000자
  url: string;
  technologies: string[];
}

/** 경력 */
export interface Experience {
  id: string;
  company: string; // 최대 50자
  position: string; // 최대 50자
  startDate: string; // YYYY-MM
  endDate: string; // YYYY-MM 또는 'present'
  description: string; // 최대 1000자
}

/** 템플릿 */
export interface Template {
  id: string;
  name: string;
  thumbnail: string;
  htmlTemplate: string;
  cssTemplate: string;
}

/** 커스터마이징 설정 */
export interface Customization {
  primaryColor: string; // HEX 색상코드
  secondaryColor: string; // HEX 색상코드
  fontFamily: 'serif' | 'sans-serif' | 'monospace';
}

/** 생성된 사이트 */
export interface GeneratedSite {
  id: string;
  portfolioId: string;
  html: string;
  css: string;
  generatedAt: string;
  templateId: string;
  customization: Customization;
}

/** 기업 인재상 기준 */
export interface CompanyCriteria {
  requiredSkills: string[]; // 필수: 1개 이상
  minExperienceYears: number;
  preferredRole: string;
  additionalRequirements: string;
}

/** 적합도 분석 결과 */
export interface FitReport {
  techMatchRate: number; // 0~100
  missingSkills: string[];
  experienceMet: boolean;
  overallScore: number; // 0~100
  suggestions: string[];
}

/** 포트폴리오 메타 정보 */
export interface PortfolioMeta {
  id: string;
  userId: string;
  profileDataId: string;
  visibility: 'public' | 'private';
  shareUrl: string;
  generatedSiteId: string;
  createdAt: string;
  updatedAt: string;
}

/** 커피챗 요청 */
export interface ChatRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  requesterName: string; // 필수
  requesterEmail: string; // 필수
  requesterOrganization: string;
  message: string; // 필수, 최대 500자
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  respondedAt?: string;
}

/** 커뮤니티 필터 */
export interface CommunityFilter {
  role?: string; // 직함 필터
  company?: string; // 소속 기업 필터
  skill?: string; // 기술 스택 필터
  page: number;
  pageSize: 12;
}

/** 공개 프로필 카드 */
export interface PublicProfileCard {
  userId: string;
  name: string;
  title: string;
  profileImage: string;
  skills: string[];
  portfolioCount: number;
}
