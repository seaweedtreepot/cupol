/**
 * CustomPortfolio: 대신취업해줘 - Site Builder
 *
 * ProfileData, Template, Customization을 받아 GeneratedSite를 생성한다.
 * 클라이언트 사이드 전용 기능(Blob 다운로드)도 이 모듈에서 제공한다.
 *
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 5.6
 */
import type { ProfileData, Template, Customization, GeneratedSite } from '@/types';
import { applyTemplate } from './template-engine';

// ---------------------------------------------------------------------------
// 내부 유틸리티
// ---------------------------------------------------------------------------

/** 간단한 UUID v4 대용 ID 생성기 (crypto.randomUUID 없는 환경 대비) */
function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // fallback: Math.random 기반
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** ISO 8601 현재 시각 문자열 반환 */
function nowISO(): string {
  return new Date().toISOString();
}

// ---------------------------------------------------------------------------
// 공개 API
// ---------------------------------------------------------------------------

/**
 * GeneratedSite 객체를 생성한다.
 *
 * - viewport 메타태그를 포함한 완전한 HTML을 생성한다 (template-engine 내부에서 보장)
 * - 빈 섹션(skills=[], projects=[], experiences=[], bio='', githubUrl='' 등)은
 *   template-engine의 조건부 블록 처리를 통해 자동 생략된다
 * - Customization의 primaryColor, secondaryColor, fontFamily가 CSS에 반영된다
 * - githubUrl이 비어있지 않으면 클릭 가능한 하이퍼링크로 렌더링된다
 *
 * @param profile      포트폴리오 데이터
 * @param template     적용할 템플릿
 * @param customization 색상/폰트 커스터마이징 설정
 * @param portfolioId  포트폴리오 식별자 (미제공 시 자동 생성)
 */
export function generateSite(
  profile: ProfileData,
  template: Template,
  customization: Customization,
  portfolioId?: string
): GeneratedSite {
  const html = applyTemplate(template, profile, customization);

  // CSS는 GeneratedSite.css 필드에도 별도 보관 (미리보기, 재사용 용이)
  const css = template.cssTemplate
    .replace(/\{\{primaryColor\}\}/g, customization.primaryColor)
    .replace(/\{\{secondaryColor\}\}/g, customization.secondaryColor)
    .replace(/\{\{fontFamily\}\}/g, customization.fontFamily);

  return {
    id: generateId(),
    portfolioId: portfolioId ?? profile.id,
    html,
    css,
    generatedAt: nowISO(),
    templateId: template.id,
    customization,
  };
}

/**
 * iframe 미리보기용 HTML 문자열을 반환한다.
 * GeneratedSite.html을 그대로 반환하며, 향후 sandboxing 래핑이 필요하면 이 함수에서 처리한다.
 */
export function getPreviewHTML(site: GeneratedSite): string {
  return site.html;
}

/**
 * HTML 파일을 Blob으로 반환한다 (클라이언트 사이드 전용).
 *
 * 반환된 Blob으로 다운로드를 트리거하는 예시:
 * ```ts
 * const blob = downloadAsHTML(site);
 * const url = URL.createObjectURL(blob);
 * const a = document.createElement('a');
 * a.href = url;
 * a.download = filename ?? 'portfolio.html';
 * a.click();
 * URL.revokeObjectURL(url);
 * ```
 *
 * @param site     다운로드할 GeneratedSite
 * @param filename 파일명 (기본값: 'portfolio.html')
 * @returns        HTML 내용을 담은 Blob
 */
export function downloadAsHTML(site: GeneratedSite, filename?: string): Blob {
  void filename; // filename은 호출 측에서 앵커 태그의 download 속성에 사용한다
  return new Blob([site.html], { type: 'text/html;charset=utf-8' });
}
