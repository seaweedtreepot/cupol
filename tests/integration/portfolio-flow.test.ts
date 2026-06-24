/**
 * 포트폴리오 생성 흐름 통합 테스트
 *
 * 스토어/모듈 레이어를 사용하는 통합 테스트 (UI 렌더링 없음)
 *
 * 테스트 대상 흐름:
 *   1. 프로필 생성 (saveProfile)
 *   2. 템플릿 선택 및 커스터마이징 (selectTemplate + updateCustomization)
 *   3. 사이트 생성 (generateSite)
 *   4. 생성된 사이트 검증 (viewport, 커스터마이징, 프로필 데이터)
 *   5. 공개/비공개 설정 및 공유 URL (setVisibility + generateShareURL + canAccess)
 *   6. JSON 내보내기/가져오기 라운드트립 (exportToJSON + importFromJSON)
 *
 * Requirements: 전체 통합 흐름
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useProfileStore } from '@/stores/profile-store';
import { useTemplateStore, DEFAULT_TEMPLATES, DEFAULT_CUSTOMIZATION } from '@/stores/template-store';
import { generateSite } from '@/lib/site-builder';
import {
  setVisibility,
  generateShareURL,
  canAccess,
} from '@/lib/visibility-controller';
import type { PortfolioMeta, ProfileData } from '@/types';

// ---------------------------------------------------------------------------
// 테스트 픽스처
// ---------------------------------------------------------------------------

const makePortfolioMeta = (
  overrides: Partial<PortfolioMeta> = {}
): PortfolioMeta => ({
  id: 'portfolio-001',
  userId: 'user-001',
  profileDataId: 'profile-001',
  visibility: 'private',
  shareUrl: '',
  generatedSiteId: 'site-001',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  ...overrides,
});

const sampleProfileInput = {
  userId: 'user-001',
  name: '김포폴',
  title: '풀스택 개발자',
  bio: '포트폴리오를 자동 생성하는 개발자입니다.',
  email: 'kimfopol@example.com',
  skills: ['TypeScript', 'React', 'Next.js'],
  githubUrl: 'https://github.com/kimfopol',
  projects: [
    {
      id: 'proj-001',
      title: '커폴 프로젝트',
      description: '포트폴리오 자동 생성 서비스',
      url: 'https://cupol.example.com',
      technologies: ['Next.js', 'Tailwind'],
    },
  ],
  experiences: [
    {
      id: 'exp-001',
      company: '테크 스타트업',
      position: '프론트엔드 개발자',
      startDate: '2022-01',
      endDate: '2023-12',
      description: 'React 기반 서비스 개발',
    },
  ],
};

// ---------------------------------------------------------------------------
// 테스트
// ---------------------------------------------------------------------------

describe('포트폴리오 생성 통합 흐름', () => {
  // 각 테스트 전에 스토어 초기화
  beforeEach(() => {
    useProfileStore.setState({ profiles: [], activeProfileId: null });
    useTemplateStore.setState({
      templates: DEFAULT_TEMPLATES,
      selectedTemplate: DEFAULT_TEMPLATES[0],
      customization: DEFAULT_CUSTOMIZATION,
    });
  });

  // -------------------------------------------------------------------------
  // Step 1: 프로필 생성
  // -------------------------------------------------------------------------
  describe('1단계: 프로필 생성', () => {
    it('saveProfile()이 프로필을 스토어에 저장해야 한다', () => {
      const { saveProfile } = useProfileStore.getState();
      const profile = saveProfile(sampleProfileInput);

      const { profiles } = useProfileStore.getState();
      expect(profiles).toHaveLength(1);
      expect(profiles[0].id).toBe(profile.id);
      expect(profiles[0].name).toBe('김포폴');
    });

    it('저장된 프로필은 자동 생성된 id와 타임스탬프를 가져야 한다', () => {
      const { saveProfile } = useProfileStore.getState();
      const profile = saveProfile(sampleProfileInput);

      expect(profile.id).toBeTruthy();
      expect(profile.createdAt).toBeTruthy();
      expect(profile.updatedAt).toBeTruthy();
      expect(new Date(profile.createdAt).toISOString()).toBe(profile.createdAt);
    });
  });

  // -------------------------------------------------------------------------
  // Step 2: 템플릿 선택 및 커스터마이징
  // -------------------------------------------------------------------------
  describe('2단계: 템플릿 선택 및 커스터마이징', () => {
    it('selectTemplate()이 selectedTemplate을 업데이트해야 한다', () => {
      const { selectTemplate } = useTemplateStore.getState();
      selectTemplate('classic');

      const { selectedTemplate } = useTemplateStore.getState();
      expect(selectedTemplate.id).toBe('classic');
      expect(selectedTemplate.name).toBe('Classic');
    });

    it('updateCustomization()이 색상과 폰트를 업데이트해야 한다', () => {
      const { updateCustomization } = useTemplateStore.getState();
      updateCustomization({
        primaryColor: '#FF5733',
        secondaryColor: '#C70039',
        fontFamily: 'serif',
      });

      const { customization } = useTemplateStore.getState();
      expect(customization.primaryColor).toBe('#FF5733');
      expect(customization.secondaryColor).toBe('#C70039');
      expect(customization.fontFamily).toBe('serif');
    });

    it('updateCustomization()은 부분 업데이트를 지원해야 한다', () => {
      const { updateCustomization } = useTemplateStore.getState();
      updateCustomization({ primaryColor: '#AABBCC' });

      const { customization } = useTemplateStore.getState();
      expect(customization.primaryColor).toBe('#AABBCC');
      // 다른 필드는 기본값 유지
      expect(customization.secondaryColor).toBe(DEFAULT_CUSTOMIZATION.secondaryColor);
      expect(customization.fontFamily).toBe(DEFAULT_CUSTOMIZATION.fontFamily);
    });

    it('존재하지 않는 템플릿 ID 선택 시 selectedTemplate이 변경되지 않아야 한다', () => {
      const { selectTemplate, selectedTemplate: before } = useTemplateStore.getState();
      selectTemplate('nonexistent-template');

      const { selectedTemplate: after } = useTemplateStore.getState();
      expect(after.id).toBe(before.id);
    });
  });

  // -------------------------------------------------------------------------
  // Step 3 & 4: 사이트 생성 및 검증
  // -------------------------------------------------------------------------
  describe('3~4단계: 사이트 생성 및 결과 검증', () => {
    it('generateSite()가 GeneratedSite 객체를 반환해야 한다', () => {
      const { saveProfile } = useProfileStore.getState();
      const { selectedTemplate, customization } = useTemplateStore.getState();
      const profile = saveProfile(sampleProfileInput);

      const site = generateSite(profile, selectedTemplate, customization);

      expect(site).toBeDefined();
      expect(site.id).toBeTruthy();
      expect(site.html).toBeTruthy();
      expect(site.css).toBeTruthy();
      expect(site.generatedAt).toBeTruthy();
      expect(site.templateId).toBe(selectedTemplate.id);
    });

    it('생성된 HTML에 viewport 메타태그가 포함되어야 한다 (Requirements: 4.2)', () => {
      const { saveProfile } = useProfileStore.getState();
      const { selectedTemplate, customization } = useTemplateStore.getState();
      const profile = saveProfile(sampleProfileInput);

      const site = generateSite(profile, selectedTemplate, customization);

      expect(site.html).toContain('name="viewport"');
      expect(site.html).toContain('width=device-width');
    });

    it('생성된 HTML에 프로필 이름이 포함되어야 한다', () => {
      const { saveProfile } = useProfileStore.getState();
      const { selectedTemplate, customization } = useTemplateStore.getState();
      const profile = saveProfile(sampleProfileInput);

      const site = generateSite(profile, selectedTemplate, customization);

      expect(site.html).toContain('김포폴');
    });

    it('생성된 HTML에 기술 스택 정보가 포함되어야 한다', () => {
      const { saveProfile } = useProfileStore.getState();
      const { selectedTemplate, customization } = useTemplateStore.getState();
      const profile = saveProfile(sampleProfileInput);

      const site = generateSite(profile, selectedTemplate, customization);

      expect(site.html).toContain('TypeScript');
      expect(site.html).toContain('React');
    });

    it('생성된 사이트에 커스터마이징 색상이 반영되어야 한다 (Requirements: 5.6)', () => {
      const { saveProfile } = useProfileStore.getState();
      const { selectTemplate, updateCustomization } = useTemplateStore.getState();

      selectTemplate('modern');
      updateCustomization({
        primaryColor: '#123456',
        secondaryColor: '#654321',
        fontFamily: 'monospace',
      });

      const { selectedTemplate, customization } = useTemplateStore.getState();
      const profile = saveProfile(sampleProfileInput);
      const site = generateSite(profile, selectedTemplate, customization);

      expect(site.html).toContain('#123456');
      expect(site.html).toContain('#654321');
      expect(site.html).toContain('monospace');
      expect(site.customization.primaryColor).toBe('#123456');
      expect(site.customization.secondaryColor).toBe('#654321');
      expect(site.customization.fontFamily).toBe('monospace');
    });

    it('githubUrl이 있으면 생성된 HTML에 클릭 가능한 링크로 포함되어야 한다 (Requirements: 4.6)', () => {
      const { saveProfile } = useProfileStore.getState();
      const { selectedTemplate, customization } = useTemplateStore.getState();
      const profile = saveProfile(sampleProfileInput);

      const site = generateSite(profile, selectedTemplate, customization);

      expect(site.html).toContain('href="https://github.com/kimfopol"');
    });

    it('githubUrl이 비어있으면 생성된 HTML에 GitHub 링크가 없어야 한다', () => {
      const { saveProfile } = useProfileStore.getState();
      const { selectedTemplate, customization } = useTemplateStore.getState();
      const profile = saveProfile({ ...sampleProfileInput, githubUrl: '' });

      const site = generateSite(profile, selectedTemplate, customization);

      // GitHub 링크 href 속성이 빈 URL로 렌더링되지 않아야 한다
      expect(site.html).not.toContain('href="https://github.com');
    });

    it('빈 skills 배열이면 생성된 HTML에 Skills 섹션이 없어야 한다 (Requirements: 4.3)', () => {
      const { saveProfile } = useProfileStore.getState();
      const { selectedTemplate, customization } = useTemplateStore.getState();
      const profile = saveProfile({ ...sampleProfileInput, skills: [] });

      const site = generateSite(profile, selectedTemplate, customization);

      // Skills 섹션 헤더가 없어야 한다
      expect(site.html).not.toMatch(/<h2[^>]*>\s*Skills\s*<\/h2>/i);
    });

    it('모든 템플릿에 대해 사이트가 올바르게 생성되어야 한다', () => {
      const { saveProfile } = useProfileStore.getState();
      const profile = saveProfile(sampleProfileInput);

      for (const template of DEFAULT_TEMPLATES) {
        const site = generateSite(profile, template, DEFAULT_CUSTOMIZATION);
        expect(site.html).toContain('name="viewport"');
        expect(site.html).toContain('김포폴');
        expect(site.templateId).toBe(template.id);
      }
    });
  });

  // -------------------------------------------------------------------------
  // Step 5: 공개/비공개 설정 및 공유 URL
  // -------------------------------------------------------------------------
  describe('5단계: 공개/비공개 설정 및 공유 URL', () => {
    it('setVisibility("public")이 visibility를 public으로 변경하고 shareUrl을 생성해야 한다', () => {
      const meta = makePortfolioMeta({ visibility: 'private', shareUrl: '' });
      const publicMeta = setVisibility(meta, 'public');

      expect(publicMeta.visibility).toBe('public');
      expect(publicMeta.shareUrl).toBeTruthy();
      expect(publicMeta.shareUrl).toContain('portfolio-001');
    });

    it('setVisibility("private")이 visibility를 private으로 변경해야 한다', () => {
      const meta = makePortfolioMeta({ visibility: 'public', shareUrl: '/portfolio/view/portfolio-001' });
      const privateMeta = setVisibility(meta, 'private');

      expect(privateMeta.visibility).toBe('private');
    });

    it('generateShareURL()이 올바른 형식의 URL을 반환해야 한다', () => {
      const url = generateShareURL('portfolio-001');

      expect(url).toBe('/portfolio/view/portfolio-001');
    });

    it('public 포트폴리오에 비소유자가 접근할 수 있어야 한다 (Requirements: 7.3)', () => {
      const meta = makePortfolioMeta({ userId: 'user-001', visibility: 'public' });

      expect(canAccess(meta, 'user-002')).toBe(true);
      expect(canAccess(meta, null)).toBe(true); // 비인증 사용자도 접근 가능
    });

    it('private 포트폴리오에 소유자만 접근할 수 있어야 한다 (Requirements: 7.6, 7.7)', () => {
      const meta = makePortfolioMeta({ userId: 'user-001', visibility: 'private' });

      expect(canAccess(meta, 'user-001')).toBe(true);   // 소유자 접근 가능
      expect(canAccess(meta, 'user-002')).toBe(false);  // 비소유자 접근 불가
      expect(canAccess(meta, null)).toBe(false);         // 비인증 사용자 접근 불가
    });

    it('소유자는 visibility에 관계없이 항상 접근할 수 있어야 한다', () => {
      const publicMeta = makePortfolioMeta({ userId: 'user-001', visibility: 'public' });
      const privateMeta = makePortfolioMeta({ userId: 'user-001', visibility: 'private' });

      expect(canAccess(publicMeta, 'user-001')).toBe(true);
      expect(canAccess(privateMeta, 'user-001')).toBe(true);
    });

    it('public 전환 → canAccess 가능, private 전환 → 비소유자 접근 불가 전체 흐름', () => {
      let meta = makePortfolioMeta({ userId: 'user-001', visibility: 'private' });
      const visitorId = 'user-999';

      // 초기: private → 방문자 접근 불가
      expect(canAccess(meta, visitorId)).toBe(false);

      // public으로 변경 → 방문자 접근 가능
      meta = setVisibility(meta, 'public');
      expect(canAccess(meta, visitorId)).toBe(true);

      // 다시 private → 방문자 접근 불가
      meta = setVisibility(meta, 'private');
      expect(canAccess(meta, visitorId)).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // Step 6: JSON 내보내기/가져오기 라운드트립
  // -------------------------------------------------------------------------
  describe('6단계: JSON 내보내기/가져오기 라운드트립 (Requirements: 9.1, 9.2, 9.3)', () => {
    it('exportToJSON() + importFromJSON() 라운드트립이 원본 프로필을 복원해야 한다', () => {
      const { saveProfile, exportToJSON, importFromJSON } = useProfileStore.getState();
      const original = saveProfile(sampleProfileInput);

      // export
      const json = exportToJSON(original.id);

      // 스토어 초기화 후 import
      useProfileStore.setState({ profiles: [], activeProfileId: null });
      const result = importFromJSON(json);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.profile).toEqual(original);
      }
    });

    it('export된 JSON은 파싱 가능한 유효한 문자열이어야 한다', () => {
      const { saveProfile, exportToJSON } = useProfileStore.getState();
      const profile = saveProfile(sampleProfileInput);

      const json = exportToJSON(profile.id);
      expect(() => JSON.parse(json)).not.toThrow();

      const parsed = JSON.parse(json) as ProfileData;
      expect(parsed.name).toBe('김포폴');
      expect(parsed.skills).toEqual(['TypeScript', 'React', 'Next.js']);
    });

    it('잘못된 JSON 가져오기 시 기존 프로필 데이터가 보존되어야 한다 (Requirements: 9.4, 9.5)', () => {
      const { saveProfile, importFromJSON } = useProfileStore.getState();
      saveProfile(sampleProfileInput);

      const result = importFromJSON('{ invalid json }');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('invalid_json');
      }
      // 기존 프로필은 그대로 유지
      const { profiles } = useProfileStore.getState();
      expect(profiles).toHaveLength(1);
      expect(profiles[0].name).toBe('김포폴');
    });

    it('필수 필드가 누락된 JSON 가져오기 시 missing_fields 오류를 반환해야 한다 (Requirements: 9.6)', () => {
      const { importFromJSON } = useProfileStore.getState();
      const incompleteData = { id: 'x', userId: 'u', title: '개발자' }; // name 누락

      const result = importFromJSON(JSON.stringify(incompleteData));

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('missing_fields');
      }
    });

    it('같은 id를 가진 프로필을 import하면 기존 프로필이 교체되어야 한다', () => {
      const { saveProfile, exportToJSON, importFromJSON } = useProfileStore.getState();
      const original = saveProfile(sampleProfileInput);

      // 동일 id의 수정된 데이터
      const modifiedJson = JSON.stringify({ ...original, name: '수정된 이름' });
      const result = importFromJSON(modifiedJson);

      expect(result.success).toBe(true);
      const { profiles } = useProfileStore.getState();
      expect(profiles).toHaveLength(1);
      expect(profiles[0].name).toBe('수정된 이름');

      void exportToJSON; // suppress unused warning
    });
  });

  // -------------------------------------------------------------------------
  // 전체 흐름 통합 시나리오
  // -------------------------------------------------------------------------
  describe('전체 포트폴리오 생성 흐름 시나리오', () => {
    it('프로필 생성 → 템플릿 선택 → 사이트 생성 → 공개 설정 → JSON 내보내기 전체 흐름이 성공해야 한다', () => {
      // 1. 프로필 생성
      const { saveProfile, exportToJSON } = useProfileStore.getState();
      const profile = saveProfile(sampleProfileInput);
      expect(useProfileStore.getState().profiles).toHaveLength(1);

      // 2. 템플릿 선택 및 커스터마이징
      const { selectTemplate, updateCustomization } = useTemplateStore.getState();
      selectTemplate('minimal');
      updateCustomization({ primaryColor: '#0EA5E9', fontFamily: 'sans-serif' });

      const { selectedTemplate, customization } = useTemplateStore.getState();
      expect(selectedTemplate.id).toBe('minimal');
      expect(customization.primaryColor).toBe('#0EA5E9');

      // 3. 사이트 생성
      const site = generateSite(profile, selectedTemplate, customization);
      expect(site.html).toContain('name="viewport"');
      expect(site.html).toContain('김포폴');
      expect(site.templateId).toBe('minimal');

      // 4. 공개 설정
      let meta = makePortfolioMeta({
        id: site.portfolioId,
        userId: profile.userId,
        generatedSiteId: site.id,
        visibility: 'private',
      });
      meta = setVisibility(meta, 'public');
      expect(meta.visibility).toBe('public');
      expect(canAccess(meta, 'visitor-user')).toBe(true);

      // 5. JSON 내보내기
      const json = exportToJSON(profile.id);
      expect(() => JSON.parse(json)).not.toThrow();
      expect(JSON.parse(json).name).toBe('김포폴');
    });
  });
});
