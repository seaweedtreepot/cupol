/**
 * Unit tests for Template Store
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { useTemplateStore, DEFAULT_TEMPLATES, DEFAULT_CUSTOMIZATION } from '@/stores/template-store';

// Reset store state before each test
beforeEach(() => {
  useTemplateStore.setState({
    templates: DEFAULT_TEMPLATES,
    selectedTemplate: DEFAULT_TEMPLATES[0],
    customization: { ...DEFAULT_CUSTOMIZATION },
  });
});

describe('Template Store - 초기 상태', () => {
  it('기본 템플릿이 3개 이상 존재한다', () => {
    const { templates } = useTemplateStore.getState();
    expect(templates.length).toBeGreaterThanOrEqual(3);
  });

  it('Modern, Classic, Minimal 템플릿이 포함된다', () => {
    const { templates } = useTemplateStore.getState();
    const ids = templates.map((t) => t.id);
    expect(ids).toContain('modern');
    expect(ids).toContain('classic');
    expect(ids).toContain('minimal');
  });

  it('기본 선택 템플릿은 첫 번째 템플릿(Modern)이다', () => {
    const { selectedTemplate } = useTemplateStore.getState();
    expect(selectedTemplate.id).toBe('modern');
  });

  it('기본 커스터마이징 색상과 폰트가 올바르게 설정된다', () => {
    const { customization } = useTemplateStore.getState();
    expect(customization.primaryColor).toBe('#3B82F6');
    expect(customization.secondaryColor).toBe('#1E40AF');
    expect(customization.fontFamily).toBe('sans-serif');
  });

  it('각 템플릿은 id, name, thumbnail, htmlTemplate, cssTemplate 필드를 갖는다', () => {
    const { templates } = useTemplateStore.getState();
    for (const t of templates) {
      expect(t.id).toBeTruthy();
      expect(t.name).toBeTruthy();
      expect(t.thumbnail).toBeTruthy();
      expect(t.htmlTemplate).toBeTruthy();
      expect(t.cssTemplate).toBeTruthy();
    }
  });
});

describe('Template Store - selectTemplate', () => {
  it('유효한 ID로 템플릿을 선택할 수 있다', () => {
    const { selectTemplate } = useTemplateStore.getState();
    selectTemplate('classic');
    expect(useTemplateStore.getState().selectedTemplate.id).toBe('classic');
  });

  it('minimal 템플릿을 선택할 수 있다', () => {
    const { selectTemplate } = useTemplateStore.getState();
    selectTemplate('minimal');
    expect(useTemplateStore.getState().selectedTemplate.id).toBe('minimal');
  });

  it('존재하지 않는 ID로 선택해도 기존 선택이 유지된다', () => {
    const { selectTemplate } = useTemplateStore.getState();
    const before = useTemplateStore.getState().selectedTemplate.id;
    selectTemplate('does-not-exist');
    expect(useTemplateStore.getState().selectedTemplate.id).toBe(before);
  });

  it('같은 템플릿을 다시 선택해도 올바르게 동작한다', () => {
    const { selectTemplate } = useTemplateStore.getState();
    selectTemplate('modern');
    selectTemplate('modern');
    expect(useTemplateStore.getState().selectedTemplate.id).toBe('modern');
  });
});

describe('Template Store - updateCustomization', () => {
  it('primaryColor를 업데이트할 수 있다', () => {
    const { updateCustomization } = useTemplateStore.getState();
    updateCustomization({ primaryColor: '#FF0000' });
    expect(useTemplateStore.getState().customization.primaryColor).toBe('#FF0000');
  });

  it('secondaryColor를 업데이트할 수 있다', () => {
    const { updateCustomization } = useTemplateStore.getState();
    updateCustomization({ secondaryColor: '#00FF00' });
    expect(useTemplateStore.getState().customization.secondaryColor).toBe('#00FF00');
  });

  it('fontFamily를 serif로 변경할 수 있다', () => {
    const { updateCustomization } = useTemplateStore.getState();
    updateCustomization({ fontFamily: 'serif' });
    expect(useTemplateStore.getState().customization.fontFamily).toBe('serif');
  });

  it('fontFamily를 monospace로 변경할 수 있다', () => {
    const { updateCustomization } = useTemplateStore.getState();
    updateCustomization({ fontFamily: 'monospace' });
    expect(useTemplateStore.getState().customization.fontFamily).toBe('monospace');
  });

  it('부분 업데이트 시 나머지 커스터마이징 값이 유지된다', () => {
    const { updateCustomization } = useTemplateStore.getState();
    updateCustomization({ primaryColor: '#AABBCC' });
    const { customization } = useTemplateStore.getState();
    // 변경되지 않은 필드는 기본값 유지
    expect(customization.secondaryColor).toBe(DEFAULT_CUSTOMIZATION.secondaryColor);
    expect(customization.fontFamily).toBe(DEFAULT_CUSTOMIZATION.fontFamily);
  });

  it('여러 필드를 한 번에 업데이트할 수 있다', () => {
    const { updateCustomization } = useTemplateStore.getState();
    updateCustomization({ primaryColor: '#112233', fontFamily: 'monospace' });
    const { customization } = useTemplateStore.getState();
    expect(customization.primaryColor).toBe('#112233');
    expect(customization.fontFamily).toBe('monospace');
  });
});

describe('Template Store - 템플릿 데이터 무결성', () => {
  it('모든 템플릿의 thumbnail은 슬래시로 시작하는 경로이다', () => {
    const { templates } = useTemplateStore.getState();
    for (const t of templates) {
      expect(t.thumbnail).toMatch(/^\//);
    }
  });

  it('모든 템플릿의 htmlTemplate은 DOCTYPE을 포함한다', () => {
    const { templates } = useTemplateStore.getState();
    for (const t of templates) {
      expect(t.htmlTemplate.toLowerCase()).toContain('<!doctype html>');
    }
  });

  it('모든 템플릿의 htmlTemplate은 viewport 메타태그를 포함한다', () => {
    const { templates } = useTemplateStore.getState();
    for (const t of templates) {
      expect(t.htmlTemplate).toContain('viewport');
    }
  });

  it('모든 템플릿의 cssTemplate은 primaryColor 플레이스홀더를 포함한다', () => {
    const { templates } = useTemplateStore.getState();
    for (const t of templates) {
      expect(t.cssTemplate).toContain('{{primaryColor}}');
    }
  });

  it('모든 템플릿의 cssTemplate은 fontFamily 플레이스홀더를 포함한다', () => {
    const { templates } = useTemplateStore.getState();
    for (const t of templates) {
      expect(t.cssTemplate).toContain('{{fontFamily}}');
    }
  });
});
