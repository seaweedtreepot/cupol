/**
 * Site Builder 프로퍼티 기반 테스트
 *
 * Feature: portfolio-generator
 * Properties: 9, 10, 11, 19
 *
 * Validates: Requirements 4.2, 4.3, 5.6, 4.6
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { generateSite } from '@/lib/site-builder';
import { DEFAULT_TEMPLATES } from '@/stores/template-store';
import type { ProfileData, Customization, Project, Experience, Template } from '@/types';

// ---------------------------------------------------------------------------
// 공통 Arbitrary 정의
// ---------------------------------------------------------------------------

/** 유효한 ISO 8601 날짜 문자열 */
const isoDate = fc.constant('2024-01-01T00:00:00.000Z');

/** 유효한 YYYY-MM 날짜 문자열 */
const yearMonth = fc.constant('2024-01');

/** 비어있지 않은 문자열 (max 50자) */
const nonEmptyStr = (maxLen = 50) =>
  fc.string({ minLength: 1, maxLength: maxLen }).filter((s) => s.trim().length > 0);

/** 기술 스택 태그 (비어있지 않은 짧은 문자열) */
const skillArb: fc.Arbitrary<string> = nonEmptyStr(20);

/** Project Arbitrary */
const projectArb: fc.Arbitrary<Project> = fc.record({
  id: fc.uuid(),
  title: nonEmptyStr(50),
  description: nonEmptyStr(100),
  url: fc.constant('https://example.com'),
  technologies: fc.array(skillArb, { minLength: 1, maxLength: 5 }),
});

/** Experience Arbitrary */
const experienceArb: fc.Arbitrary<Experience> = fc.record({
  id: fc.uuid(),
  company: nonEmptyStr(30),
  position: nonEmptyStr(30),
  startDate: yearMonth,
  endDate: yearMonth,
  description: nonEmptyStr(100),
});

/**
 * 완전히 채워진 ProfileData (모든 배열/문자열이 비어있지 않음)
 */
const fullProfileArb: fc.Arbitrary<ProfileData> = fc.record({
  id: fc.uuid(),
  userId: fc.uuid(),
  name: nonEmptyStr(30),
  title: nonEmptyStr(30),
  bio: nonEmptyStr(100),
  email: fc.emailAddress(),
  skills: fc.array(skillArb, { minLength: 1, maxLength: 5 }),
  githubUrl: fc
    .webUrl({ validSchemes: ['https'] })
    .filter((u) => u.length < 200),
  projects: fc.array(projectArb, { minLength: 1, maxLength: 3 }),
  experiences: fc.array(experienceArb, { minLength: 1, maxLength: 3 }),
  createdAt: isoDate,
  updatedAt: isoDate,
});

/**
 * 유효한 HEX 색상코드 (#RRGGBB)
 */
const hexColorArb: fc.Arbitrary<string> = fc
  .tuple(
    fc.integer({ min: 0, max: 255 }),
    fc.integer({ min: 0, max: 255 }),
    fc.integer({ min: 0, max: 255 })
  )
  .map(([r, g, b]) => `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`);

/**
 * 유효한 Customization
 */
const customizationArb: fc.Arbitrary<Customization> = fc.record({
  primaryColor: hexColorArb,
  secondaryColor: hexColorArb,
  fontFamily: fc.constantFrom('serif', 'sans-serif', 'monospace') as fc.Arbitrary<
    'serif' | 'sans-serif' | 'monospace'
  >,
});

/**
 * DEFAULT_TEMPLATES 중 하나를 무작위 선택
 */
const templateArb: fc.Arbitrary<Template> = fc.constantFrom(...DEFAULT_TEMPLATES);

/**
 * 예측 가능한 섹션 마커를 포함한 인라인 테스트용 템플릿
 *
 * Property 9 테스트에서 "어떤 섹션이 포함/생략되는지"를 
 * 확정적으로 검증하기 위해 사용한다.
 */
const SECTION_TEST_TEMPLATE: Template = {
  id: 'section-test',
  name: 'Section Test',
  thumbnail: '',
  htmlTemplate: `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <title>{{name}}</title>
  <style>{{css}}</style>
</head>
<body>
  <h1>{{name}}</h1>
  {{#skills}}<section class="skills-section"><h2>Skills</h2>{{#each skills}}<span>{{this}}</span>{{/each}}</section>{{/skills}}
  {{#projects}}<section class="projects-section"><h2>Projects</h2>{{#each projects}}<div>{{title}}</div>{{/each}}</section>{{/projects}}
  {{#experiences}}<section class="experiences-section"><h2>Experience</h2>{{#each experiences}}<div>{{position}}</div>{{/each}}</section>{{/experiences}}
  {{#bio}}<section class="bio-section"><p>{{bio}}</p></section>{{/bio}}
  {{#githubUrl}}<a class="github-link" href="{{githubUrl}}" target="_blank" rel="noopener noreferrer">GitHub</a>{{/githubUrl}}
</body>
</html>`,
  cssTemplate: `body { font-family: {{fontFamily}}; color: {{primaryColor}}; background: {{secondaryColor}}; }`,
};

// ---------------------------------------------------------------------------
// Property 9: 사이트 생성 시 빈 섹션 생략
// ---------------------------------------------------------------------------

describe('Property 9: 사이트 생성 시 빈 섹션 생략', () => {
  /**
   * **Validates: Requirements 4.3**
   *
   * For any ProfileData, empty fields (empty arrays, empty strings) →
   * corresponding sections NOT in generated HTML;
   * non-empty fields → corresponding sections IN generated HTML.
   */

  it('비어있는 skills 배열이면 skills 섹션이 HTML에 없어야 한다', () => {
    fc.assert(
      fc.property(
        fullProfileArb.map((p) => ({ ...p, skills: [] })),
        customizationArb,
        (profile, customization) => {
          const site = generateSite(profile, SECTION_TEST_TEMPLATE, customization);
          expect(site.html).not.toContain('class="skills-section"');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('비어있지 않은 skills 배열이면 skills 섹션이 HTML에 포함되어야 한다', () => {
    fc.assert(
      fc.property(
        fc.record({
          profile: fullProfileArb,
          customization: customizationArb,
        }),
        ({ profile, customization }) => {
          // fullProfileArb already guarantees skills.length >= 1
          const site = generateSite(profile, SECTION_TEST_TEMPLATE, customization);
          expect(site.html).toContain('class="skills-section"');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('비어있는 projects 배열이면 projects 섹션이 HTML에 없어야 한다', () => {
    fc.assert(
      fc.property(
        fullProfileArb.map((p) => ({ ...p, projects: [] })),
        customizationArb,
        (profile, customization) => {
          const site = generateSite(profile, SECTION_TEST_TEMPLATE, customization);
          expect(site.html).not.toContain('class="projects-section"');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('비어있지 않은 projects 배열이면 projects 섹션이 HTML에 포함되어야 한다', () => {
    fc.assert(
      fc.property(
        fc.record({
          profile: fullProfileArb,
          customization: customizationArb,
        }),
        ({ profile, customization }) => {
          const site = generateSite(profile, SECTION_TEST_TEMPLATE, customization);
          expect(site.html).toContain('class="projects-section"');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('비어있는 experiences 배열이면 experiences 섹션이 HTML에 없어야 한다', () => {
    fc.assert(
      fc.property(
        fullProfileArb.map((p) => ({ ...p, experiences: [] })),
        customizationArb,
        (profile, customization) => {
          const site = generateSite(profile, SECTION_TEST_TEMPLATE, customization);
          expect(site.html).not.toContain('class="experiences-section"');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('빈 bio 문자열이면 bio 섹션이 HTML에 없어야 한다', () => {
    fc.assert(
      fc.property(
        fullProfileArb.map((p) => ({ ...p, bio: '' })),
        customizationArb,
        (profile, customization) => {
          const site = generateSite(profile, SECTION_TEST_TEMPLATE, customization);
          expect(site.html).not.toContain('class="bio-section"');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('비어있지 않은 bio 문자열이면 bio 섹션이 HTML에 포함되어야 한다', () => {
    fc.assert(
      fc.property(
        fc.record({
          profile: fullProfileArb,
          customization: customizationArb,
        }),
        ({ profile, customization }) => {
          const site = generateSite(profile, SECTION_TEST_TEMPLATE, customization);
          expect(site.html).toContain('class="bio-section"');
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 10: 생성된 사이트 반응형 메타태그 포함
// ---------------------------------------------------------------------------

describe('Property 10: 생성된 사이트 반응형 메타태그 포함', () => {
  /**
   * **Validates: Requirements 4.2**
   *
   * For any valid ProfileData + template, generateSite HTML always contains
   * viewport meta tag.
   */
  it('모든 ProfileData와 템플릿 조합에서 viewport 메타태그가 포함되어야 한다', () => {
    fc.assert(
      fc.property(
        fullProfileArb,
        templateArb,
        customizationArb,
        (profile, template, customization) => {
          const site = generateSite(profile, template, customization);
          expect(site.html).toContain('name="viewport"');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('인라인 테스트 템플릿에서도 viewport 메타태그가 삽입되어야 한다', () => {
    fc.assert(
      fc.property(
        fullProfileArb,
        customizationArb,
        (profile, customization) => {
          const site = generateSite(profile, SECTION_TEST_TEMPLATE, customization);
          expect(site.html).toContain('name="viewport"');
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 11: 커스터마이징 반영
// ---------------------------------------------------------------------------

describe('Property 11: 커스터마이징 반영', () => {
  /**
   * **Validates: Requirements 5.6**
   *
   * For any valid Customization, generated site CSS contains the
   * primaryColor, secondaryColor, fontFamily values.
   */
  it('생성된 사이트 CSS에 primaryColor가 포함되어야 한다', () => {
    fc.assert(
      fc.property(
        fullProfileArb,
        templateArb,
        customizationArb,
        (profile, template, customization) => {
          const site = generateSite(profile, template, customization);
          expect(site.css).toContain(customization.primaryColor);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('생성된 사이트 CSS에 secondaryColor가 포함되어야 한다', () => {
    fc.assert(
      fc.property(
        fullProfileArb,
        templateArb,
        customizationArb,
        (profile, template, customization) => {
          const site = generateSite(profile, template, customization);
          expect(site.css).toContain(customization.secondaryColor);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('생성된 사이트 CSS에 fontFamily가 포함되어야 한다', () => {
    fc.assert(
      fc.property(
        fullProfileArb,
        templateArb,
        customizationArb,
        (profile, template, customization) => {
          const site = generateSite(profile, template, customization);
          expect(site.css).toContain(customization.fontFamily);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('생성된 HTML 인라인 스타일에도 primaryColor가 반영되어야 한다', () => {
    fc.assert(
      fc.property(
        fullProfileArb,
        templateArb,
        customizationArb,
        (profile, template, customization) => {
          const site = generateSite(profile, template, customization);
          // CSS는 <style> 태그 안에 인라인으로 삽입된다
          expect(site.html).toContain(customization.primaryColor);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// 내부 헬퍼: HTML 이스케이프 (template-engine의 escapeHtml과 동일 로직)
// ---------------------------------------------------------------------------

/**
 * template-engine의 escapeHtml과 동일한 변환을 적용한다.
 * URL은 replacePlaceholders를 통해 HTML 이스케이프되므로,
 * HTML 출력에서 URL을 검색할 때는 이스케이프된 형태를 사용해야 한다.
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ---------------------------------------------------------------------------
// Property 19: 깃허브 URL 조건부 렌더링
// ---------------------------------------------------------------------------

describe('Property 19: 깃허브 URL 조건부 렌더링', () => {
  /**
   * **Validates: Requirements 4.6**
   *
   * For any ProfileData where githubUrl is non-empty valid URL,
   * generated HTML contains the URL as a hyperlink (<a href=...>).
   *
   * Note: The template engine HTML-escapes values (e.g. & → &amp;), so the
   * assertion compares the escaped URL against the HTML output.
   */
  it('비어있지 않은 githubUrl이면 HTML에 해당 URL의 <a href> 태그가 포함되어야 한다', () => {
    fc.assert(
      fc.property(
        fullProfileArb,
        templateArb,
        customizationArb,
        (profile, template, customization) => {
          // fullProfileArb guarantees githubUrl is a non-empty https URL.
          // The template engine HTML-escapes URL values, so we compare the
          // escaped form against the generated HTML.
          const site = generateSite(profile, template, customization);
          const escapedUrl = escapeHtml(profile.githubUrl);
          expect(site.html).toContain(`href="${escapedUrl}"`);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('빈 githubUrl이면 HTML에 github 하이퍼링크가 없어야 한다', () => {
    fc.assert(
      fc.property(
        fullProfileArb.map((p) => ({ ...p, githubUrl: '' })),
        templateArb,
        customizationArb,
        (profile, template, customization) => {
          const site = generateSite(profile, template, customization);
          // No anchor with github-related href when githubUrl is empty
          expect(site.html).not.toContain('class="hero__github"');
          expect(site.html).not.toContain('class="sidebar__github"');
          expect(site.html).not.toContain('class="header__github"');
          expect(site.html).not.toContain('class="github-link"');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('섹션 테스트 템플릿에서도 비어있지 않은 githubUrl이 <a href>로 렌더링되어야 한다', () => {
    fc.assert(
      fc.property(
        fullProfileArb,
        customizationArb,
        (profile, customization) => {
          const site = generateSite(profile, SECTION_TEST_TEMPLATE, customization);
          const escapedUrl = escapeHtml(profile.githubUrl);
          expect(site.html).toContain(`href="${escapedUrl}"`);
        }
      ),
      { numRuns: 100 }
    );
  });
});
