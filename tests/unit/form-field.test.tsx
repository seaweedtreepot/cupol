/**
 * FormField 컴포넌트 단위 테스트
 * Requirements: 10.3, 10.4, 10.5, 3.6
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { FormField } from '@/components/form-field';
import { z } from 'zod';

// ---------------------------------------------------------------------------
// 헬퍼
// ---------------------------------------------------------------------------

function renderField(props: Parameters<typeof FormField>[0]) {
  return render(<FormField {...props} />);
}

// ---------------------------------------------------------------------------
// label 및 htmlFor 연결
// ---------------------------------------------------------------------------

describe('FormField - label 연결', () => {
  it('label의 htmlFor와 input의 id가 연결된다', () => {
    renderField({ label: '이름', name: 'name', type: 'text' });
    const input = screen.getByRole('textbox', { name: '이름' });
    expect(input).toBeInTheDocument();
  });

  it('required prop이 있으면 레이블에 * 표시가 된다', () => {
    renderField({ label: '이름', name: 'name', type: 'text', required: true });
    expect(screen.getByText('*')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// 타입별 렌더링
// ---------------------------------------------------------------------------

describe('FormField - 타입별 렌더링', () => {
  it('type="text" → <input type="text"> 렌더링', () => {
    renderField({ label: '이름', name: 'name', type: 'text', value: '' });
    const input = screen.getByRole('textbox');
    expect(input.tagName).toBe('INPUT');
    expect((input as HTMLInputElement).type).toBe('text');
  });

  it('type="email" → <input type="email"> 렌더링', () => {
    renderField({ label: '이메일', name: 'email', type: 'email', value: '' });
    // email input은 role=textbox 없이 검색
    const input = screen.getByLabelText('이메일');
    expect((input as HTMLInputElement).type).toBe('email');
  });

  it('type="url" → <input type="url"> 렌더링', () => {
    renderField({ label: 'URL', name: 'url', type: 'url', value: '' });
    const input = screen.getByLabelText('URL');
    expect((input as HTMLInputElement).type).toBe('url');
  });

  it('type="textarea" → <textarea> 렌더링', () => {
    renderField({ label: '소개', name: 'bio', type: 'textarea', value: '' });
    const textarea = screen.getByRole('textbox', { name: '소개' });
    expect(textarea.tagName).toBe('TEXTAREA');
  });

  it('type="tags" → tag pill UI 렌더링', () => {
    renderField({
      label: '기술 스택',
      name: 'skills',
      type: 'tags',
      value: ['React', 'TypeScript'],
    });
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// 에러 표시 (Requirement 10.3, 10.4)
// ---------------------------------------------------------------------------

describe('FormField - 에러 표시', () => {
  it('error prop이 있으면 붉은 테두리 클래스가 적용된다', () => {
    renderField({
      label: '이름',
      name: 'name',
      type: 'text',
      value: '',
      error: '이름을 입력해주세요.',
    });
    const input = screen.getByRole('textbox');
    expect(input.className).toContain('border-red-500');
  });

  it('error prop이 있으면 오류 메시지가 표시된다', () => {
    renderField({
      label: '이름',
      name: 'name',
      type: 'text',
      value: '',
      error: '이름을 입력해주세요.',
    });
    expect(screen.getByText('이름을 입력해주세요.')).toBeInTheDocument();
  });

  it('error가 없으면 붉은 테두리가 없다', () => {
    renderField({ label: '이름', name: 'name', type: 'text', value: '' });
    const input = screen.getByRole('textbox');
    expect(input.className).not.toContain('border-red-500');
  });

  it('에러 메시지는 aria-invalid 속성을 가진다', () => {
    renderField({
      label: '이름',
      name: 'name',
      type: 'text',
      value: '',
      error: '오류',
    });
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  it('에러 메시지는 aria-describedby로 input과 연결된다', () => {
    renderField({
      label: '이름',
      name: 'name',
      type: 'text',
      value: '',
      error: '오류',
    });
    const input = screen.getByRole('textbox');
    const describedBy = input.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();
    const errorEl = document.getElementById(describedBy!);
    expect(errorEl).toBeInTheDocument();
    expect(errorEl?.textContent).toBe('오류');
  });
});

// ---------------------------------------------------------------------------
// URL 실시간 검증 on blur (Requirement 10.1, 10.3)
// ---------------------------------------------------------------------------

describe('FormField - URL onBlur 검증', () => {
  it('잘못된 URL 입력 후 blur 시 에러 메시지가 표시된다', async () => {
    renderField({
      label: 'URL',
      name: 'url',
      type: 'url',
      value: 'not-a-url',
    });
    const input = screen.getByLabelText('URL');
    fireEvent.blur(input);
    await waitFor(() => {
      expect(
        screen.getByText(/http:\/\/ 또는 https:\/\/를 포함한 유효한 URL/)
      ).toBeInTheDocument();
    });
  });

  it('유효한 URL 입력 후 blur 시 에러가 없다', async () => {
    renderField({
      label: 'URL',
      name: 'url',
      type: 'url',
      value: 'https://example.com',
    });
    const input = screen.getByLabelText('URL');
    fireEvent.blur(input);
    await waitFor(() => {
      expect(
        screen.queryByText(/http:\/\/ 또는 https:\/\/를 포함한 유효한 URL/)
      ).not.toBeInTheDocument();
    });
  });

  it('빈 URL 입력 후 blur 시 에러가 없다 (선택 필드)', async () => {
    renderField({
      label: 'URL',
      name: 'url',
      type: 'url',
      value: '',
    });
    const input = screen.getByLabelText('URL');
    fireEvent.blur(input);
    await waitFor(() => {
      expect(
        screen.queryByText(/유효한 URL/)
      ).not.toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// 이메일 실시간 검증 on blur (Requirement 10.2, 10.4)
// ---------------------------------------------------------------------------

describe('FormField - Email onBlur 검증', () => {
  it('잘못된 이메일 입력 후 blur 시 에러 메시지가 표시된다', async () => {
    renderField({
      label: '이메일',
      name: 'email',
      type: 'email',
      value: 'invalid-email',
    });
    const input = screen.getByLabelText('이메일');
    fireEvent.blur(input);
    await waitFor(() => {
      expect(
        screen.getByText(/유효한 이메일 주소를 입력해주세요/)
      ).toBeInTheDocument();
    });
  });

  it('유효한 이메일 입력 후 blur 시 에러가 없다', async () => {
    renderField({
      label: '이메일',
      name: 'email',
      type: 'email',
      value: 'user@example.com',
    });
    const input = screen.getByLabelText('이메일');
    fireEvent.blur(input);
    await waitFor(() => {
      expect(
        screen.queryByText(/유효한 이메일/)
      ).not.toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// 에러 즉시 제거 (Requirement 10.5)
// ---------------------------------------------------------------------------

describe('FormField - 에러 즉시 제거', () => {
  it('잘못된 URL blur 후 onChange 호출 시 에러가 즉시 사라진다', async () => {
    const onChange = vi.fn();

    const { rerender } = render(
      <FormField
        label="URL"
        name="url"
        type="url"
        value="bad-url"
        onChange={onChange}
      />
    );

    const input = screen.getByLabelText('URL');
    fireEvent.blur(input);

    await waitFor(() => {
      expect(screen.queryByText(/유효한 URL/)).toBeInTheDocument();
    });

    // 값 변경 → 에러 즉시 제거
    fireEvent.change(input, { target: { value: 'https://example.com' } });

    await waitFor(() => {
      expect(screen.queryByText(/유효한 URL/)).not.toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// onChange 콜백
// ---------------------------------------------------------------------------

describe('FormField - onChange 콜백', () => {
  it('text 타입에서 onChange가 호출된다', () => {
    const onChange = vi.fn();
    renderField({
      label: '이름',
      name: 'name',
      type: 'text',
      value: '',
      onChange,
    });
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '홍길동' } });
    expect(onChange).toHaveBeenCalledWith('홍길동');
  });

  it('textarea 타입에서 onChange가 호출된다', () => {
    const onChange = vi.fn();
    renderField({
      label: '소개',
      name: 'bio',
      type: 'textarea',
      value: '',
      onChange,
    });
    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: '안녕하세요' } });
    expect(onChange).toHaveBeenCalledWith('안녕하세요');
  });
});

// ---------------------------------------------------------------------------
// Tags 기능
// ---------------------------------------------------------------------------

describe('FormField - Tags 기능', () => {
  it('Enter 키로 태그를 추가할 수 있다', async () => {
    const onChange = vi.fn();
    renderField({
      label: '기술 스택',
      name: 'skills',
      type: 'tags',
      value: [],
      onChange,
    });
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'React' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onChange).toHaveBeenCalledWith(['React']);
  });

  it('콤마 키로 태그를 추가할 수 있다', async () => {
    const onChange = vi.fn();
    renderField({
      label: '기술 스택',
      name: 'skills',
      type: 'tags',
      value: [],
      onChange,
    });
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'TypeScript' } });
    fireEvent.keyDown(input, { key: ',' });
    expect(onChange).toHaveBeenCalledWith(['TypeScript']);
  });

  it('기존 태그의 × 버튼으로 태그를 제거할 수 있다', () => {
    const onChange = vi.fn();
    renderField({
      label: '기술 스택',
      name: 'skills',
      type: 'tags',
      value: ['React', 'TypeScript'],
      onChange,
    });
    const removeBtn = screen.getByLabelText('React 태그 제거');
    fireEvent.click(removeBtn);
    expect(onChange).toHaveBeenCalledWith(['TypeScript']);
  });

  it('maxLength 도달 시 입력 필드가 숨겨진다', () => {
    renderField({
      label: '기술 스택',
      name: 'skills',
      type: 'tags',
      value: ['React', 'TypeScript'],
      maxLength: 2,
    });
    // 입력 필드가 없어야 함 (숨겨짐)
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    // 최대 개수 안내 텍스트가 1개 이상 존재해야 함
    expect(screen.getAllByText(/최대 2개/).length).toBeGreaterThanOrEqual(1);
  });

  it('중복 태그는 추가되지 않는다', () => {
    const onChange = vi.fn();
    renderField({
      label: '기술 스택',
      name: 'skills',
      type: 'tags',
      value: ['React'],
      onChange,
    });
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'React' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onChange).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// maxLength
// ---------------------------------------------------------------------------

describe('FormField - maxLength', () => {
  it('text 타입에 maxLength 속성이 적용된다', () => {
    renderField({
      label: '이름',
      name: 'name',
      type: 'text',
      value: '',
      maxLength: 50,
    });
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('maxlength', '50');
  });

  it('textarea 타입에 maxLength 속성이 적용된다', () => {
    renderField({
      label: '소개',
      name: 'bio',
      type: 'textarea',
      value: '',
      maxLength: 500,
    });
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveAttribute('maxlength', '500');
  });
});
