/**
 * CustomPortfolio: 대신취업해줘 - Template Engine
 *
 * 템플릿에 ProfileData와 Customization을 적용하여 HTML 문자열을 생성한다.
 * 단순 문자열 치환 방식으로 외부 라이브러리 없이 구현한다.
 *
 * Requirements: 4.1, 4.2, 4.3, 4.6, 5.6
 */
import type { Template, ProfileData, Customization, Project, Experience } from '@/types';

// ---------------------------------------------------------------------------
// 내부 헬퍼: 조건부 블록 처리
// ---------------------------------------------------------------------------

/**
 * {{#fieldName}}...{{/fieldName}} 블록을 처리한다.
 * - fieldName이 null / undefined / '' / [] 이면 블록 전체 제거
 * - 그 외에는 블록 내부 콘텐츠를 유지 (fieldName 자체는 {{fieldName}} 치환으로 별도 처리)
 */
function processConditionalBlocks(template: string, data: Record<string, unknown>): string {
  // 모든 {{#key}}...{{/key}} 패턴을 처리 (중첩은 지원하지 않음)
  return template.replace(
    /\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g,
    (_match: string, key: string, content: string) => {
      const value = data[key];
      if (isTruthy(value)) {
        return content;
      }
      return '';
    }
  );
}

/** 값이 "있다"고 간주되는지 여부를 판단한다. */
function isTruthy(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

// ---------------------------------------------------------------------------
// 내부 헬퍼: each 블록 처리 (배열 순회)
// ---------------------------------------------------------------------------

/**
 * {{#each items}}...{{/each}} 블록을 처리한다.
 * 배열의 각 요소를 렌더링하고, 요소의 필드를 {{fieldName}}으로 치환한다.
 * {{this}}는 기본형(string) 요소 자체를 표현한다.
 */
function processEachBlocks(template: string, data: Record<string, unknown>): string {
  return template.replace(
    /\{\{#each (\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g,
    (_match: string, key: string, itemTemplate: string) => {
      const arr = data[key];
      if (!Array.isArray(arr)) return '';
      return arr
        .map((item: unknown) => {
          if (typeof item === 'string') {
            // 기본형 배열 (e.g., skills) → {{this}} 치환
            return itemTemplate.replace(/\{\{this\}\}/g, escapeHtml(item));
          }
          if (typeof item === 'object' && item !== null) {
            const obj = item as Record<string, unknown>;
            // 내부 조건부 블록 처리 (e.g., {{#url}}...{{/url}})
            let rendered = processConditionalBlocks(itemTemplate, obj);
            // 필드 치환
            rendered = replacePlaceholders(rendered, obj);
            return rendered;
          }
          return '';
        })
        .join('');
    }
  );
}

// ---------------------------------------------------------------------------
// 내부 헬퍼: 단순 {{placeholder}} 치환
// ---------------------------------------------------------------------------

/**
 * {{fieldName}} 플레이스홀더를 data 객체의 값으로 치환한다.
 * 값이 없으면 빈 문자열로 치환한다.
 */
function replacePlaceholders(template: string, data: Record<string, unknown>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_match: string, key: string) => {
    const value = data[key];
    if (value === null || value === undefined) return '';
    if (Array.isArray(value)) return value.map((v) => escapeHtml(String(v))).join(', ');
    return escapeHtml(String(value));
  });
}

/** HTML 특수문자를 이스케이프한다. */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ---------------------------------------------------------------------------
// 내부 헬퍼: CSS 커스터마이징 치환
// ---------------------------------------------------------------------------

/**
 * CSS 템플릿의 커스터마이징 플레이스홀더({{primaryColor}} 등)를 치환한다.
 * CSS 내부이므로 HTML 이스케이프를 적용하지 않는다.
 */
function applyCustomizationToCSS(cssTemplate: string, customization: Customization): string {
  return cssTemplate
    .replace(/\{\{primaryColor\}\}/g, customization.primaryColor)
    .replace(/\{\{secondaryColor\}\}/g, customization.secondaryColor)
    .replace(/\{\{fontFamily\}\}/g, customization.fontFamily);
}

// ---------------------------------------------------------------------------
// 내부 헬퍼: viewport 메타태그 보장
// ---------------------------------------------------------------------------

/**
 * 생성된 HTML에 viewport 메타태그가 없는 경우 <head> 내에 삽입한다.
 */
function ensureViewportMeta(html: string): string {
  if (html.includes('name="viewport"')) return html;
  return html.replace(
    /<head([^>]*)>/i,
    '<head$1>\n  <meta name="viewport" content="width=device-width, initial-scale=1.0" />'
  );
}

// ---------------------------------------------------------------------------
// 공개 API
// ---------------------------------------------------------------------------

/**
 * 템플릿에 ProfileData와 Customization을 적용하여 완성된 HTML 문자열을 반환한다.
 *
 * 처리 순서:
 * 1. CSS 커스터마이징 치환
 * 2. CSS를 HTML 템플릿의 {{css}} 자리에 삽입
 * 3. 조건부 블록 처리 ({{#field}}...{{/field}})
 * 4. each 블록 처리 ({{#each array}}...{{/each}})
 * 5. 단순 플레이스홀더 치환 ({{field}})
 * 6. viewport 메타태그 보장
 */
export function applyTemplate(
  template: Template,
  data: ProfileData,
  customization: Customization
): string {
  // 1. CSS 커스터마이징 적용
  const css = applyCustomizationToCSS(template.cssTemplate, customization);

  // 2. data 맵 구성 (CSS 포함)
  const dataMap: Record<string, unknown> = {
    name: data.name,
    title: data.title,
    bio: data.bio,
    email: data.email,
    skills: data.skills,
    githubUrl: data.githubUrl,
    projects: data.projects.map((p: Project) => ({
      ...p,
      technologies: p.technologies.join(', '),
    })),
    experiences: data.experiences.map((e: Experience) => ({
      ...e,
    })),
    css, // {{css}} 치환용
  };

  let html = template.htmlTemplate;

  // 3. 조건부 블록 처리
  html = processConditionalBlocks(html, dataMap);

  // 4. each 블록 처리
  html = processEachBlocks(html, dataMap);

  // 5. 단순 플레이스홀더 치환 (CSS는 이스케이프 없이 삽입해야 하므로 별도 처리)
  // CSS는 이미 {{css}} 위치에 실제 CSS 문자열이 들어가야 한다.
  // replacePlaceholders는 HTML 이스케이프를 적용하므로 CSS를 먼저 별도 삽입한다.
  html = html.replace(/\{\{css\}\}/g, css);
  html = replacePlaceholders(html, dataMap);

  // 6. viewport 메타태그 보장
  html = ensureViewportMeta(html);

  return html;
}

/**
 * 미리보기용 HTML 문자열을 반환한다.
 * applyTemplate과 동일한 결과를 반환하며, 향후 미리보기 전용 래핑 로직 추가 시 확장한다.
 */
export function getPreview(
  template: Template,
  data: ProfileData,
  customization: Customization
): string {
  return applyTemplate(template, data, customization);
}
