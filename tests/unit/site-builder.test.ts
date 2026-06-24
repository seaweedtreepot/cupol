/**
 * Unit Tests: Site Builder & Template Engine
 *
 * 다음 요구사항을 검증한다:
 * - Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 5.6
 *
 * 테스트 항목:
 * - 기본 HTML 생성 (이름, 직함, 이메일 치환)
 * - viewport 메타태그 포함 여부
 * - 빈 섹션 생략 (skills=[], projects=[], experiences=[], bio='', githubUrl='')
 * - 데이터가 있는 섹션 포함
 * - 깃허브 URL 조건부 하이퍼링크 렌더링
 * - 커스터마이징 CSS 반영 (primaryColor, secondaryColor, fontFamily)
 * - downloadAsHTML → Blob 반환
 * - getPreviewHTML → html 문자열 반환
 * - generateSite 결과 GeneratedSite 구조 검증
 */
import { describe, it, expect } from 'vitest';
import { generateSite, getPreviewHTML, downloadAsHTML } from '@/lib/site-builder';
import { applyTemplate, getPreview } from '@/lib/template-engine';
import type { ProfileData, Template, Customization, GeneratedSite } from '@/types';

// ---------------------------------------------------------------------------
// 테스트 픽스처
// ---------------------------------------------------------------------------

const BASE_PROFILE: ProfileData = {
  id: 'profile-1',
  userId: 'user-1',
  name: 'Alice',
  title: 'Frontend Developer',
  bio: 'Passionate about UI/UX.',
  email: 'alice@example.com',
  skills: ['TypeScript', 'React'],
  githubUrl: 'https://github.com/alice',
  projects: [
    {
      id: 'p1',
      title: 'My App',
      description: 'A cool app.',
      url: 'https://myapp.com',
      technologies: ['React', 'Node.js'],
    },
  ],
  experiences: [
    {
      id: 'e1',
      company: 'Acme Corp',
      position: 'Frontend Dev',
      startDate: '2021-01',
      endDate: 'present',
      description: 'Built awesome things.',
    },
  ],
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

const EMPTY_SECTIONS_PROFILE: ProfileData = {
  ...BASE_PROFILE,
  bio: '',
  skills: [],
  projects: [],
  experiences: [],
  githubUrl: '',
};

const CUSTOMIZATION: Customization = {
  primaryColor: '#FF5733',
  secondaryColor: '#C70039',
  fontFamily: 'monospace',
};

/** 최소한의 테스트용 템플릿 */
const TEST_TEMPLATE: Template = {
  id: 'test',
  name: 'Test Template',
  thumbnail: '/test.png',
  htmlTemplate: `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{{name}}</title>
  <style>{{css}}</style>
</head>
<body>
  <h1>{{name}}</h1>
  <p>{{title}}</p>
  {{#bio}}<p class="bio">{{bio}}</p>{{/bio}}
  {{#githubUrl}}<a href="{{githubUrl}}" target="_blank" rel="noopener noreferrer">GitHub</a>{{/githubUrl}}
  {{#skills}}<ul class="skills">{{#each skills}}<li>{{this}}</li>{{/each}}</ul>{{/skills}}
  {{#projects}}<section class="projects">{{#each projects}}<div class="project"><h3>{{title}}</h3><p>{{description}}</p></div>{{/each}}</section>{{/projects}}
  {{#experiences}}<section class="experiences">{{#each experiences}}<div class="exp"><h3>{{position}}</h3></div>{{/each}}</section>{{/experiences}}
  <footer>{{email}}</footer>
</body>
</html>`,
  cssTemplate: `:root { --primary: {{primaryColor}}; --secondary: {{secondaryColor}}; --font: {{fontFamily}}; }`,
};

/** viewport 메타태그가 없는 테스트용 템플릿 */
const NO_VIEWPORT_TEMPLATE: Template = {
  ...TEST_TEMPLATE,
  id: 'no-viewport',
  htmlTemplate: `<!DOCTYPE html>
<html><head><meta charset="UTF-8" /><style>{{css}}</style></head>
<body><h1>{{name}}</h1></body></html>`,
};

// ---------------------------------------------------------------------------
// applyTemplate / getPreview 테스트
// ---------------------------------------------------------------------------

describe('applyTemplate', () => {
  it('이름, 직함, 이메일을 HTML에 치환한다', () => {
    const html = applyTemplate(TEST_TEMPLATE, BASE_PROFILE, CUSTOMIZATION);
    expect(html).toContain('Alice');
    expect(html).toContain('Frontend Developer');
    expect(html).toContain('alice@example.com');
  });

  it('viewport 메타태그를 포함한다', () => {
    const html = applyTemplate(TEST_TEMPLATE, BASE_PROFILE, CUSTOMIZATION);
    expect(html).toContain('<meta name="viewport"');
    expect(html).toContain('width=device-width');
    expect(html).toContain('initial-scale=1.0');
  });

  it('viewport 메타태그가 없는 템플릿에 자동으로 삽입한다', () => {
    const html = applyTemplate(NO_VIEWPORT_TEMPLATE, BASE_PROFILE, CUSTOMIZATION);
    expect(html).toContain('name="viewport"');
  });

  it('빈 skills 배열이면 skills 섹션을 생략한다', () => {
    const html = applyTemplate(TEST_TEMPLATE, EMPTY_SECTIONS_PROFILE, CUSTOMIZATION);
    expect(html).not.toContain('class="skills"');
  });

  it('skills가 있으면 skills 섹션을 포함한다', () => {
    const html = applyTemplate(TEST_TEMPLATE, BASE_PROFILE, CUSTOMIZATION);
    expect(html).toContain('class="skills"');
    expect(html).toContain('TypeScript');
    expect(html).toContain('React');
  });

  it('빈 projects 배열이면 projects 섹션을 생략한다', () => {
    const html = applyTemplate(TEST_TEMPLATE, EMPTY_SECTIONS_PROFILE, CUSTOMIZATION);
    expect(html).not.toContain('class="projects"');
  });

  it('projects가 있으면 projects 섹션을 포함한다', () => {
    const html = applyTemplate(TEST_TEMPLATE, BASE_PROFILE, CUSTOMIZATION);
    expect(html).toContain('class="projects"');
    expect(html).toContain('My App');
    expect(html).toContain('A cool app.');
  });

  it('빈 experiences 배열이면 experiences 섹션을 생략한다', () => {
    const html = applyTemplate(TEST_TEMPLATE, EMPTY_SECTIONS_PROFILE, CUSTOMIZATION);
    expect(html).not.toContain('class="experiences"');
  });

  it('experiences가 있으면 experiences 섹션을 포함한다', () => {
    const html = applyTemplate(TEST_TEMPLATE, BASE_PROFILE, CUSTOMIZATION);
    expect(html).toContain('class="experiences"');
    expect(html).toContain('Frontend Dev');
  });

  it('빈 bio이면 bio 섹션을 생략한다', () => {
    const html = applyTemplate(TEST_TEMPLATE, EMPTY_SECTIONS_PROFILE, CUSTOMIZATION);
    expect(html).not.toContain('class="bio"');
  });

  it('bio가 있으면 bio 섹션을 포함한다', () => {
    const html = applyTemplate(TEST_TEMPLATE, BASE_PROFILE, CUSTOMIZATION);
    expect(html).toContain('class="bio"');
    expect(html).toContain('Passionate about UI/UX.');
  });

  it('githubUrl이 비어있으면 GitHub 링크를 생략한다', () => {
    const html = applyTemplate(TEST_TEMPLATE, EMPTY_SECTIONS_PROFILE, CUSTOMIZATION);
    expect(html).not.toContain('href="https://github.com');
    // GitHub 텍스트도 없어야 한다
    expect(html).not.toMatch(/href=".*github\.com/);
  });

  it('githubUrl이 있으면 클릭 가능한 하이퍼링크로 렌더링한다', () => {
    const html = applyTemplate(TEST_TEMPLATE, BASE_PROFILE, CUSTOMIZATION);
    expect(html).toContain('href="https://github.com/alice"');
    expect(html).toContain('<a ');
    expect(html).toContain('target="_blank"');
  });

  it('primaryColor, secondaryColor, fontFamily를 CSS에 반영한다', () => {
    const html = applyTemplate(TEST_TEMPLATE, BASE_PROFILE, CUSTOMIZATION);
    expect(html).toContain('#FF5733');
    expect(html).toContain('#C70039');
    expect(html).toContain('monospace');
  });

  it('HTML 특수문자를 이스케이프한다', () => {
    const profile: ProfileData = {
      ...BASE_PROFILE,
      name: '<script>alert("xss")</script>',
      bio: '',
      skills: [],
      projects: [],
      experiences: [],
      githubUrl: '',
    };
    const html = applyTemplate(TEST_TEMPLATE, profile, CUSTOMIZATION);
    expect(html).not.toContain('<script>alert');
    expect(html).toContain('&lt;script&gt;');
  });
});

describe('getPreview', () => {
  it('applyTemplate과 동일한 결과를 반환한다', () => {
    const preview = getPreview(TEST_TEMPLATE, BASE_PROFILE, CUSTOMIZATION);
    const applied = applyTemplate(TEST_TEMPLATE, BASE_PROFILE, CUSTOMIZATION);
    expect(preview).toBe(applied);
  });
});

// ---------------------------------------------------------------------------
// generateSite 테스트
// ---------------------------------------------------------------------------

describe('generateSite', () => {
  it('GeneratedSite 객체를 반환한다', () => {
    const site = generateSite(BASE_PROFILE, TEST_TEMPLATE, CUSTOMIZATION);
    expect(site).toBeDefined();
    expect(typeof site.id).toBe('string');
    expect(typeof site.html).toBe('string');
    expect(typeof site.css).toBe('string');
    expect(typeof site.generatedAt).toBe('string');
    expect(site.templateId).toBe('test');
    expect(site.customization).toEqual(CUSTOMIZATION);
  });

  it('portfolioId는 제공된 값을 사용한다', () => {
    const site = generateSite(BASE_PROFILE, TEST_TEMPLATE, CUSTOMIZATION, 'custom-portfolio-id');
    expect(site.portfolioId).toBe('custom-portfolio-id');
  });

  it('portfolioId 미제공 시 profile.id를 사용한다', () => {
    const site = generateSite(BASE_PROFILE, TEST_TEMPLATE, CUSTOMIZATION);
    expect(site.portfolioId).toBe('profile-1');
  });

  it('생성된 html에 viewport 메타태그가 포함된다', () => {
    const site = generateSite(BASE_PROFILE, TEST_TEMPLATE, CUSTOMIZATION);
    expect(site.html).toContain('name="viewport"');
  });

  it('css 필드에 커스터마이징 값이 반영된다', () => {
    const site = generateSite(BASE_PROFILE, TEST_TEMPLATE, CUSTOMIZATION);
    expect(site.css).toContain('#FF5733');
    expect(site.css).toContain('#C70039');
    expect(site.css).toContain('monospace');
  });

  it('빈 섹션이 html에 포함되지 않는다', () => {
    const site = generateSite(EMPTY_SECTIONS_PROFILE, TEST_TEMPLATE, CUSTOMIZATION);
    expect(site.html).not.toContain('class="skills"');
    expect(site.html).not.toContain('class="projects"');
    expect(site.html).not.toContain('class="experiences"');
  });

  it('generatedAt은 유효한 ISO 8601 형식이다', () => {
    const site = generateSite(BASE_PROFILE, TEST_TEMPLATE, CUSTOMIZATION);
    expect(() => new Date(site.generatedAt)).not.toThrow();
    expect(new Date(site.generatedAt).toISOString()).toBe(site.generatedAt);
  });

  it('각 호출마다 고유한 id를 생성한다', () => {
    const site1 = generateSite(BASE_PROFILE, TEST_TEMPLATE, CUSTOMIZATION);
    const site2 = generateSite(BASE_PROFILE, TEST_TEMPLATE, CUSTOMIZATION);
    expect(site1.id).not.toBe(site2.id);
  });
});

// ---------------------------------------------------------------------------
// getPreviewHTML 테스트
// ---------------------------------------------------------------------------

describe('getPreviewHTML', () => {
  it('GeneratedSite의 html 문자열을 그대로 반환한다', () => {
    const site: GeneratedSite = {
      id: 'site-1',
      portfolioId: 'portfolio-1',
      html: '<html><body>Hello</body></html>',
      css: ':root {}',
      generatedAt: new Date().toISOString(),
      templateId: 'test',
      customization: CUSTOMIZATION,
    };
    expect(getPreviewHTML(site)).toBe(site.html);
  });
});

// ---------------------------------------------------------------------------
// downloadAsHTML 테스트
// ---------------------------------------------------------------------------

describe('downloadAsHTML', () => {
  it('Blob 객체를 반환한다', () => {
    const site = generateSite(BASE_PROFILE, TEST_TEMPLATE, CUSTOMIZATION);
    const blob = downloadAsHTML(site);
    expect(blob).toBeInstanceOf(Blob);
  });

  it('Blob의 type은 text/html이다', () => {
    const site = generateSite(BASE_PROFILE, TEST_TEMPLATE, CUSTOMIZATION);
    const blob = downloadAsHTML(site);
    expect(blob.type).toContain('text/html');
  });

  it('Blob의 크기가 0보다 크다', () => {
    const site = generateSite(BASE_PROFILE, TEST_TEMPLATE, CUSTOMIZATION);
    const blob = downloadAsHTML(site);
    expect(blob.size).toBeGreaterThan(0);
  });

  it('Blob 내용이 GeneratedSite.html과 동일하다', async () => {
    const site = generateSite(BASE_PROFILE, TEST_TEMPLATE, CUSTOMIZATION);
    const blob = downloadAsHTML(site);
    // jsdom의 Blob은 .text()를 지원하지 않으므로 FileReader를 사용한다
    const text = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsText(blob);
    });
    expect(text).toBe(site.html);
  });

  it('파일명 파라미터를 전달해도 Blob을 정상 반환한다', () => {
    const site = generateSite(BASE_PROFILE, TEST_TEMPLATE, CUSTOMIZATION);
    const blob = downloadAsHTML(site, 'my-portfolio.html');
    expect(blob).toBeInstanceOf(Blob);
  });
});
