/**
 * CustomPortfolio: 대신취업해줘 - Template Store
 *
 * 템플릿 목록, 선택된 템플릿, 커스터마이징 설정을 관리한다.
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Template, Customization } from '@/types';
import { STORAGE_KEYS } from '@/constants/storage-keys';

// ---------------------------------------------------------------------------
// 기본 템플릿 데이터 (3개 이상)
// ---------------------------------------------------------------------------

/** Modern 템플릿 - 깔끔하고 현대적인 레이아웃 */
const MODERN_TEMPLATE: Template = {
  id: 'modern',
  name: 'Modern',
  thumbnail: '/templates/modern.png',
  htmlTemplate: `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{{name}} | Portfolio</title>
  <style>{{css}}</style>
</head>
<body>
  <header class="hero">
    <h1 class="hero__name">{{name}}</h1>
    <p class="hero__title">{{title}}</p>
    <p class="hero__bio">{{bio}}</p>
    {{#githubUrl}}<a class="hero__github" href="{{githubUrl}}" target="_blank" rel="noopener noreferrer">GitHub</a>{{/githubUrl}}
  </header>
  <main class="container">
    {{#skills}}<section class="section skills"><h2>Skills</h2><ul class="tag-list">{{#each skills}}<li class="tag">{{this}}</li>{{/each}}</ul></section>{{/skills}}
    {{#projects}}<section class="section projects"><h2>Projects</h2>{{#each projects}}<article class="card"><h3>{{title}}</h3><p>{{description}}</p>{{#url}}<a href="{{url}}" target="_blank" rel="noopener noreferrer">View Project</a>{{/url}}</article>{{/each}}</section>{{/projects}}
    {{#experiences}}<section class="section experiences"><h2>Experience</h2>{{#each experiences}}<article class="card"><h3>{{position}} @ {{company}}</h3><p class="date">{{startDate}} – {{endDate}}</p><p>{{description}}</p></article>{{/each}}</section>{{/experiences}}
  </main>
  <footer class="footer"><p>{{email}}</p></footer>
</body>
</html>`,
  cssTemplate: `
:root {
  --primary: {{primaryColor}};
  --secondary: {{secondaryColor}};
  --font: {{fontFamily}}, system-ui, sans-serif;
}
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: var(--font); color: #1a1a1a; background: #fff; line-height: 1.6; }
.hero { background: var(--primary); color: #fff; padding: 4rem 2rem; text-align: center; }
.hero__name { font-size: 2.5rem; font-weight: 700; }
.hero__title { font-size: 1.25rem; margin-top: 0.5rem; opacity: 0.9; }
.hero__bio { max-width: 640px; margin: 1rem auto 0; opacity: 0.85; }
.hero__github { display: inline-block; margin-top: 1.5rem; padding: 0.5rem 1.25rem; background: #fff; color: var(--primary); border-radius: 999px; text-decoration: none; font-weight: 600; }
.container { max-width: 860px; margin: 0 auto; padding: 3rem 1.5rem; }
.section { margin-bottom: 3rem; }
.section h2 { font-size: 1.5rem; color: var(--secondary); border-bottom: 2px solid var(--primary); padding-bottom: 0.5rem; margin-bottom: 1.25rem; }
.tag-list { display: flex; flex-wrap: wrap; gap: 0.5rem; list-style: none; }
.tag { background: var(--primary); color: #fff; padding: 0.25rem 0.75rem; border-radius: 999px; font-size: 0.875rem; }
.card { background: #f9f9f9; border-left: 4px solid var(--primary); padding: 1rem 1.25rem; border-radius: 0 8px 8px 0; margin-bottom: 1rem; }
.card h3 { font-size: 1.1rem; color: var(--secondary); }
.card .date { font-size: 0.875rem; color: #666; margin: 0.25rem 0; }
.footer { text-align: center; padding: 2rem; background: #f0f0f0; color: #555; font-size: 0.875rem; }
@media (max-width: 600px) { .hero__name { font-size: 1.75rem; } .container { padding: 2rem 1rem; } }
`,
};

/** Classic 템플릿 - 전통적이고 격식 있는 레이아웃 */
const CLASSIC_TEMPLATE: Template = {
  id: 'classic',
  name: 'Classic',
  thumbnail: '/templates/classic.png',
  htmlTemplate: `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{{name}} | Portfolio</title>
  <style>{{css}}</style>
</head>
<body>
  <div class="page">
    <aside class="sidebar">
      <h1 class="sidebar__name">{{name}}</h1>
      <p class="sidebar__title">{{title}}</p>
      <p class="sidebar__email">{{email}}</p>
      {{#githubUrl}}<a class="sidebar__github" href="{{githubUrl}}" target="_blank" rel="noopener noreferrer">GitHub</a>{{/githubUrl}}
      {{#skills}}<div class="sidebar__skills"><h3>Skills</h3><ul>{{#each skills}}<li>{{this}}</li>{{/each}}</ul></div>{{/skills}}
    </aside>
    <main class="content">
      {{#bio}}<section class="section"><h2>About</h2><p>{{bio}}</p></section>{{/bio}}
      {{#projects}}<section class="section"><h2>Projects</h2>{{#each projects}}<div class="entry"><h3>{{title}}</h3><p>{{description}}</p>{{#url}}<a href="{{url}}" target="_blank" rel="noopener noreferrer">→ View</a>{{/url}}</div>{{/each}}</section>{{/projects}}
      {{#experiences}}<section class="section"><h2>Experience</h2>{{#each experiences}}<div class="entry"><h3>{{position}}</h3><p class="entry__sub">{{company}} | {{startDate}} – {{endDate}}</p><p>{{description}}</p></div>{{/each}}</section>{{/experiences}}
    </main>
  </div>
</body>
</html>`,
  cssTemplate: `
:root {
  --primary: {{primaryColor}};
  --secondary: {{secondaryColor}};
  --font: {{fontFamily}}, Georgia, serif;
}
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: var(--font); color: #2c2c2c; background: #fafafa; }
.page { display: flex; min-height: 100vh; }
.sidebar { width: 260px; flex-shrink: 0; background: var(--primary); color: #fff; padding: 2.5rem 1.5rem; }
.sidebar__name { font-size: 1.5rem; font-weight: 700; }
.sidebar__title { font-size: 0.95rem; margin-top: 0.4rem; opacity: 0.85; }
.sidebar__email { font-size: 0.8rem; margin-top: 1rem; opacity: 0.75; word-break: break-all; }
.sidebar__github { display: inline-block; margin-top: 0.75rem; font-size: 0.85rem; color: #fff; text-decoration: underline; }
.sidebar__skills { margin-top: 2rem; }
.sidebar__skills h3 { font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.75rem; opacity: 0.75; }
.sidebar__skills ul { list-style: none; display: flex; flex-direction: column; gap: 0.4rem; }
.sidebar__skills li { background: rgba(255,255,255,0.15); padding: 0.25rem 0.6rem; border-radius: 4px; font-size: 0.85rem; }
.content { flex: 1; padding: 3rem 2.5rem; }
.section { margin-bottom: 2.5rem; }
.section h2 { font-size: 1.25rem; color: var(--secondary); border-bottom: 1px solid #ddd; padding-bottom: 0.4rem; margin-bottom: 1.2rem; }
.entry { margin-bottom: 1.5rem; }
.entry h3 { font-size: 1rem; font-weight: 600; color: var(--primary); }
.entry__sub { font-size: 0.85rem; color: #888; margin: 0.2rem 0 0.5rem; }
.entry a { font-size: 0.875rem; color: var(--primary); text-decoration: none; font-weight: 500; }
@media (max-width: 640px) { .page { flex-direction: column; } .sidebar { width: 100%; } }
`,
};

/** Minimal 템플릿 - 미니멀하고 집중된 레이아웃 */
const MINIMAL_TEMPLATE: Template = {
  id: 'minimal',
  name: 'Minimal',
  thumbnail: '/templates/minimal.png',
  htmlTemplate: `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{{name}}</title>
  <style>{{css}}</style>
</head>
<body>
  <div class="wrapper">
    <header class="header">
      <h1>{{name}}</h1>
      <span class="header__title">{{title}}</span>
      {{#githubUrl}}<a class="header__github" href="{{githubUrl}}" target="_blank" rel="noopener noreferrer">↗ GitHub</a>{{/githubUrl}}
    </header>
    {{#bio}}<p class="bio">{{bio}}</p>{{/bio}}
    {{#skills}}<section class="block"><h2>Skills</h2><div class="chips">{{#each skills}}<span class="chip">{{this}}</span>{{/each}}</div></section>{{/skills}}
    {{#projects}}<section class="block"><h2>Projects</h2>{{#each projects}}<div class="item"><h3>{{title}}<span class="item__tech">{{technologies}}</span></h3><p>{{description}}</p>{{#url}}<a href="{{url}}" target="_blank" rel="noopener noreferrer">Link ↗</a>{{/url}}</div>{{/each}}</section>{{/projects}}
    {{#experiences}}<section class="block"><h2>Experience</h2>{{#each experiences}}<div class="item"><h3>{{position}} — <em>{{company}}</em></h3><small>{{startDate}} – {{endDate}}</small><p>{{description}}</p></div>{{/each}}</section>{{/experiences}}
    <footer><small>{{email}}</small></footer>
  </div>
</body>
</html>`,
  cssTemplate: `
:root {
  --primary: {{primaryColor}};
  --secondary: {{secondaryColor}};
  --font: {{fontFamily}}, system-ui, sans-serif;
}
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: var(--font); color: #111; background: #fff; font-size: 16px; line-height: 1.7; }
.wrapper { max-width: 700px; margin: 0 auto; padding: 3rem 1.5rem; }
.header { display: flex; align-items: baseline; gap: 1rem; flex-wrap: wrap; border-bottom: 2px solid var(--primary); padding-bottom: 1rem; margin-bottom: 1.5rem; }
.header h1 { font-size: 2rem; font-weight: 700; }
.header__title { color: #555; font-size: 1rem; }
.header__github { margin-left: auto; color: var(--primary); text-decoration: none; font-size: 0.875rem; font-weight: 600; }
.bio { color: #444; margin-bottom: 2rem; }
.block { margin-bottom: 2.5rem; }
.block h2 { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--secondary); margin-bottom: 1rem; }
.chips { display: flex; flex-wrap: wrap; gap: 0.4rem; }
.chip { border: 1px solid var(--primary); color: var(--primary); padding: 0.15rem 0.6rem; border-radius: 4px; font-size: 0.8rem; }
.item { margin-bottom: 1.5rem; }
.item h3 { font-size: 1rem; }
.item__tech { font-size: 0.8rem; color: #777; margin-left: 0.5rem; font-weight: 400; }
.item small { display: block; color: #888; font-size: 0.8rem; margin: 0.2rem 0 0.5rem; }
.item a { color: var(--primary); font-size: 0.875rem; }
footer { border-top: 1px solid #eee; padding-top: 1.5rem; margin-top: 2rem; color: #888; font-size: 0.8rem; }
@media (max-width: 480px) { .header { flex-direction: column; gap: 0.4rem; } .header__github { margin-left: 0; } }
`,
};

/** 사전 정의된 기본 템플릿 목록 */
export const DEFAULT_TEMPLATES: Template[] = [
  MODERN_TEMPLATE,
  CLASSIC_TEMPLATE,
  MINIMAL_TEMPLATE,
];

// ---------------------------------------------------------------------------
// 기본 커스터마이징 설정
// ---------------------------------------------------------------------------

export const DEFAULT_CUSTOMIZATION: Customization = {
  primaryColor: '#3B82F6',
  secondaryColor: '#1E40AF',
  fontFamily: 'sans-serif',
};

// ---------------------------------------------------------------------------
// Store 타입 정의
// ---------------------------------------------------------------------------

interface TemplateState {
  /** 사용 가능한 템플릿 목록 */
  templates: Template[];
  /** 현재 선택된 템플릿 */
  selectedTemplate: Template;
  /** 커스터마이징 설정 */
  customization: Customization;
}

interface TemplateActions {
  /**
   * 템플릿을 ID로 선택한다.
   * 존재하지 않는 ID를 전달하면 아무 변화도 없다.
   */
  selectTemplate: (templateId: string) => void;
  /**
   * 커스터마이징 설정을 부분 업데이트한다.
   */
  updateCustomization: (customization: Partial<Customization>) => void;
}

export type TemplateStore = TemplateState & TemplateActions;

// ---------------------------------------------------------------------------
// Store 구현
// ---------------------------------------------------------------------------

export const useTemplateStore = create<TemplateStore>()(
  persist(
    (set, get) => ({
      // --- 초기 상태 ---
      templates: DEFAULT_TEMPLATES,
      selectedTemplate: DEFAULT_TEMPLATES[0],
      customization: DEFAULT_CUSTOMIZATION,

      // --- 액션 ---
      selectTemplate: (templateId: string) => {
        const found = get().templates.find((t) => t.id === templateId);
        if (found) {
          set({ selectedTemplate: found });
        }
      },

      updateCustomization: (partial: Partial<Customization>) => {
        set((state) => ({
          customization: { ...state.customization, ...partial },
        }));
      },
    }),
    {
      name: STORAGE_KEYS.TEMPLATES_CUSTOMIZATION,
      // 템플릿 목록 자체는 앱 코드에서 관리하므로 persist 대상에서 제외하고
      // selectedTemplate ID와 customization만 저장한다.
      partialize: (state) => ({
        selectedTemplateId: state.selectedTemplate.id,
        customization: state.customization,
      }),
      // 스토리지에서 복원할 때 ID로 실제 Template 객체를 재조회한다.
      merge: (persisted: unknown, current) => {
        const saved = persisted as
          | { selectedTemplateId?: string; customization?: Customization }
          | null;

        if (!saved) return current;

        const restoredTemplate =
          DEFAULT_TEMPLATES.find((t) => t.id === saved.selectedTemplateId) ??
          DEFAULT_TEMPLATES[0];

        return {
          ...current,
          selectedTemplate: restoredTemplate,
          customization: saved.customization
            ? { ...DEFAULT_CUSTOMIZATION, ...saved.customization }
            : current.customization,
        };
      },
    }
  )
);
