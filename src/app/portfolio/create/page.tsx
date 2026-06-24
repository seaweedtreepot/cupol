'use client';

/**
 * 포트폴리오 생성 페이지 - 스텝 위저드 (정보 입력 3단계 + 템플릿 선택)
 * Requirements: 3.1–3.8, 5.1–5.7, 10.1, 10.2, 10.5, 10.6, 11.2, 11.4
 */

import React, { useState, useCallback, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Navigation from '@/components/navigation';
import MascotMessage from '@/components/mascot-message';
import TemplateSelector from '@/components/template-selector';
import { useAuthStore } from '@/stores/auth-store';
import { usePortfolioStore } from '@/stores/portfolio-store';
import { useTemplateStore } from '@/stores/template-store';
import { generateSite } from '@/lib/site-builder';

// ---------------------------------------------------------------------------
// Zod 스키마
// ---------------------------------------------------------------------------

const portfolioFormSchema = z.object({
  name: z.string().min(1, '이름은 필수 항목입니다.').max(50, '이름은 최대 50자입니다.').refine(
    (v) => v.trim().length > 0, { message: '이름은 공백만으로 구성될 수 없습니다.' }
  ),
  title: z.string().max(50, '직함은 최대 50자입니다.'),
  bio: z.string().max(500, '자기소개는 최대 500자입니다.'),
  email: z.string().refine(
    (v) => v === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
    { message: '유효한 이메일 형식을 입력해주세요.' }
  ),
  githubUrl: z.string().refine(
    (v) => {
      if (!v) return true;
      try { const u = new URL(v); return u.protocol === 'http:' || u.protocol === 'https:'; }
      catch { return false; }
    },
    { message: 'http:// 또는 https://로 시작하는 URL을 입력해주세요.' }
  ),
  skills: z.array(z.string()).max(30, '기술 스택은 최대 30개입니다.'),
  projects: z.array(z.object({
    title: z.string().min(1, '프로젝트 제목은 필수입니다.').max(100),
    description: z.string().max(1000),
    url: z.string().refine(
      (v) => { if (!v) return true; try { const u = new URL(v); return u.protocol === 'http:' || u.protocol === 'https:'; } catch { return false; } },
      { message: '유효한 URL을 입력해주세요.' }
    ),
    technologies: z.array(z.string()),
  })).max(20),
  experiences: z.array(z.object({
    company: z.string().min(1, '회사명은 필수입니다.').max(50),
    position: z.string().min(1, '직위는 필수입니다.').max(50),
    startDate: z.string().min(1, '시작 연월은 필수입니다.'),
    endDate: z.string().min(1, '종료 연월은 필수입니다.'),
    description: z.string().max(1000),
  })).max(20),
});

type PortfolioFormValues = z.infer<typeof portfolioFormSchema>;

// ---------------------------------------------------------------------------
// 단계별 커폴이 가이드 메시지
// ---------------------------------------------------------------------------

const STEP_GUIDE_MESSAGES: Record<number, string> = {
  1: '이름, 직함, 이메일 정보를 입력해봐! 이름은 필수야 ✍️',
  2: '진행한 프로젝트가 있으면 추가해봐! 없어도 괜찮아 😊',
  3: '경력이 있으면 입력해봐! 다 작성했으면 저장하기를 눌러줘 💪',
};

// ---------------------------------------------------------------------------
// 스텝 인디케이터
// ---------------------------------------------------------------------------

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <nav aria-label="포트폴리오 생성 단계" className="w-full mb-6">
      <ol className="flex items-center">
        {Array.from({ length: total }).map((_, idx) => {
          const step = idx + 1;
          const isCompleted = step < current;
          const isActive = step === current;
          const isLast = step === total;
          return (
            <li key={step} className="flex items-center flex-1">
              <div className="flex flex-col items-center gap-1 flex-1">
                <div className={[
                  'flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors',
                  isCompleted ? 'bg-blue-500 text-white' :
                  isActive ? 'bg-blue-600 text-white ring-2 ring-blue-300' :
                  'bg-gray-200 text-gray-500',
                ].join(' ')} aria-current={isActive ? 'step' : undefined}>
                  {isCompleted ? '✓' : step}
                </div>
                <span className={['text-xs', isActive ? 'font-semibold text-blue-600' : 'text-gray-400'].join(' ')}>
                  {['기본 정보', '프로젝트', '경력'][idx]}
                </span>
              </div>
              {!isLast && (
                <div className={['h-0.5 flex-1 mx-1 mb-5 rounded', isCompleted ? 'bg-blue-400' : 'bg-gray-200'].join(' ')} aria-hidden="true" />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// ---------------------------------------------------------------------------
// 공통 필드 UI 헬퍼
// ---------------------------------------------------------------------------

interface FieldWrapperProps {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  hint?: string;
}

function FieldWrapper({ label, required, error, children, hint }: FieldWrapperProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="ml-0.5 text-red-500" aria-hidden="true">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

function inputClass(hasError: boolean) {
  return [
    'w-full rounded-md border px-3 py-2 text-sm outline-none transition-colors focus:ring-2',
    hasError ? 'border-red-500 focus:ring-red-300' : 'border-gray-300 focus:ring-blue-300',
  ].join(' ');
}

function textareaClass(hasError: boolean) {
  return inputClass(hasError) + ' resize-y min-h-[80px]';
}

// ---------------------------------------------------------------------------
// 기술 스택 태그 입력 컴포넌트
// ---------------------------------------------------------------------------

function SkillTagsInput({ value, onChange, error }: { value: string[]; onChange: (tags: string[]) => void; error?: string }) {
  const [input, setInput] = useState('');
  const MAX_SKILLS = 30;
  const isMax = value.length >= MAX_SKILLS;
  const hasError = Boolean(error);

  function addSkill(raw: string) {
    const tag = raw.trim();
    if (!tag || value.includes(tag) || isMax) return;
    onChange([...value, tag]);
    setInput('');
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addSkill(input); }
    if (e.key === 'Backspace' && input === '' && value.length > 0) onChange(value.slice(0, -1));
  }

  return (
    <div>
      <div className={['flex flex-wrap gap-1.5 rounded-md border px-3 py-2 text-sm transition-colors focus-within:ring-2 cursor-text', hasError ? 'border-red-500 focus-within:ring-red-300' : 'border-gray-300 focus-within:ring-blue-300'].join(' ')}>
        {value.map((tag, i) => (
          <span key={i} className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-800">
            {tag}
            <button type="button" aria-label={`${tag} 태그 제거`} onClick={() => onChange(value.filter((_, j) => j !== i))} className="text-blue-500 hover:text-blue-900 focus:outline-none">×</button>
          </span>
        ))}
        {!isMax ? (
          <input type="text" value={input} placeholder={value.length === 0 ? 'Enter 또는 쉼표로 태그 추가' : undefined} aria-label="기술 스택 입력" aria-invalid={hasError} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} onBlur={() => { if (input.trim()) addSkill(input); }} className="min-w-[140px] flex-1 bg-transparent outline-none" />
        ) : (
          <span className="text-xs text-gray-400 self-center">최대 {MAX_SKILLS}개</span>
        )}
      </div>
      {isMax && !hasError && <p className="mt-1 text-xs text-gray-500">기술 스택을 최대 {MAX_SKILLS}개까지 입력할 수 있습니다.</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 프로젝트 기술 태그
// ---------------------------------------------------------------------------

function ProjectTechTags({ value, onChange }: { value: string[]; onChange: (tags: string[]) => void }) {
  const [input, setInput] = useState('');

  function add(raw: string) {
    const tag = raw.trim();
    if (!tag || value.includes(tag)) return;
    onChange([...value, tag]);
    setInput('');
  }

  return (
    <div className="flex flex-wrap gap-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus-within:ring-2 focus-within:ring-blue-300 cursor-text">
      {value.map((tag, i) => (
        <span key={i} className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-xs text-purple-800">
          {tag}
          <button type="button" aria-label={`${tag} 제거`} onClick={() => onChange(value.filter((_, j) => j !== i))} className="text-purple-500 hover:text-purple-900">×</button>
        </span>
      ))}
      <input type="text" value={input} placeholder={value.length === 0 ? '사용 기술 입력' : undefined} aria-label="사용 기술 입력" onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(input); } }} onBlur={() => { if (input.trim()) add(input); }} className="min-w-[100px] flex-1 bg-transparent outline-none" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 1: 기본 정보
// ---------------------------------------------------------------------------

function Step1BasicInfo({ form }: { form: ReturnType<typeof useForm<PortfolioFormValues>> }) {
  const { register, control, formState: { errors }, trigger } = form;
  return (
    <div className="flex flex-col gap-5">
      <FieldWrapper label="이름" required error={errors.name?.message}>
        <input {...register('name')} type="text" maxLength={50} placeholder="홍길동" aria-required="true" aria-invalid={!!errors.name} className={inputClass(!!errors.name)} />
      </FieldWrapper>
      <FieldWrapper label="직함" error={errors.title?.message}>
        <input {...register('title')} type="text" maxLength={50} placeholder="프론트엔드 개발자" aria-invalid={!!errors.title} className={inputClass(!!errors.title)} />
      </FieldWrapper>
      <FieldWrapper label="자기소개" error={errors.bio?.message} hint="최대 500자">
        <textarea {...register('bio')} maxLength={500} placeholder="간략한 자기소개를 작성해주세요." aria-invalid={!!errors.bio} className={textareaClass(!!errors.bio)} rows={4} />
      </FieldWrapper>
      <FieldWrapper label="연락처 이메일" error={errors.email?.message}>
        <input {...register('email', { onBlur: () => trigger('email') })} type="email" placeholder="example@email.com" aria-invalid={!!errors.email} className={inputClass(!!errors.email)} />
      </FieldWrapper>
      <FieldWrapper label="깃허브 프로필 URL" error={errors.githubUrl?.message}>
        <input {...register('githubUrl', { onBlur: () => trigger('githubUrl') })} type="url" placeholder="https://github.com/username" aria-invalid={!!errors.githubUrl} className={inputClass(!!errors.githubUrl)} />
      </FieldWrapper>
      <FieldWrapper label="기술 스택" error={errors.skills?.message} hint="Enter 또는 쉼표(,)로 태그를 추가하세요. 최대 30개">
        <Controller control={control} name="skills" render={({ field }) => (
          <SkillTagsInput value={field.value} onChange={field.onChange} error={errors.skills?.message} />
        )} />
      </FieldWrapper>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 2: 프로젝트 목록
// ---------------------------------------------------------------------------

function Step2Projects({ form }: { form: ReturnType<typeof useForm<PortfolioFormValues>> }) {
  const { register, control, formState: { errors }, trigger } = form;
  const { fields, append, remove } = useFieldArray({ control, name: 'projects' });
  const MAX_PROJECTS = 20;

  return (
    <div className="flex flex-col gap-6">
      {fields.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-6 border border-dashed border-gray-300 rounded-lg">아직 프로젝트가 없어요. 아래 버튼으로 추가해봐!</p>
      )}
      {fields.map((field, index) => {
        const pe = errors.projects?.[index];
        return (
          <div key={field.id} className="border border-gray-200 rounded-xl p-4 bg-gray-50 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700">프로젝트 {index + 1}</span>
              <button type="button" onClick={() => remove(index)} className="text-xs text-red-500 hover:text-red-700 border border-red-200 px-2 py-1 rounded" aria-label={`프로젝트 ${index + 1} 삭제`}>삭제</button>
            </div>
            <FieldWrapper label="제목" required error={pe?.title?.message}>
              <input {...register(`projects.${index}.title`)} type="text" maxLength={100} placeholder="프로젝트 이름" aria-required="true" aria-invalid={!!pe?.title} className={inputClass(!!pe?.title)} />
            </FieldWrapper>
            <FieldWrapper label="설명" error={pe?.description?.message} hint="최대 1000자">
              <textarea {...register(`projects.${index}.description`)} maxLength={1000} placeholder="프로젝트 설명" aria-invalid={!!pe?.description} className={textareaClass(!!pe?.description)} rows={3} />
            </FieldWrapper>
            <FieldWrapper label="URL" error={pe?.url?.message}>
              <input {...register(`projects.${index}.url`, { onBlur: () => trigger(`projects.${index}.url`) })} type="url" placeholder="https://github.com/..." aria-invalid={!!pe?.url} className={inputClass(!!pe?.url)} />
            </FieldWrapper>
            <FieldWrapper label="사용 기술">
              <Controller control={control} name={`projects.${index}.technologies`} render={({ field }) => (
                <ProjectTechTags value={field.value} onChange={field.onChange} />
              )} />
            </FieldWrapper>
          </div>
        );
      })}
      {fields.length < MAX_PROJECTS ? (
        <button type="button" onClick={() => append({ title: '', description: '', url: '', technologies: [] })} className="w-full py-2.5 border-2 border-dashed border-blue-300 text-blue-600 hover:border-blue-400 hover:bg-blue-50 rounded-xl text-sm font-medium transition-colors">
          + 프로젝트 추가 ({fields.length}/{MAX_PROJECTS})
        </button>
      ) : (
        <p className="text-center text-xs text-gray-500">프로젝트를 최대 {MAX_PROJECTS}개까지 입력할 수 있습니다.</p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 3: 경력 목록
// ---------------------------------------------------------------------------

function Step3Experiences({ form }: { form: ReturnType<typeof useForm<PortfolioFormValues>> }) {
  const { register, formState: { errors }, control, trigger } = form;
  const { fields, append, remove } = useFieldArray({ control, name: 'experiences' });
  const MAX_EXPERIENCES = 20;

  return (
    <div className="flex flex-col gap-6">
      {fields.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-6 border border-dashed border-gray-300 rounded-lg">아직 경력이 없어요. 아래 버튼으로 추가해봐!</p>
      )}
      {fields.map((field, index) => {
        const ee = errors.experiences?.[index];
        return (
          <div key={field.id} className="border border-gray-200 rounded-xl p-4 bg-gray-50 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700">경력 {index + 1}</span>
              <button type="button" onClick={() => remove(index)} className="text-xs text-red-500 hover:text-red-700 border border-red-200 px-2 py-1 rounded" aria-label={`경력 ${index + 1} 삭제`}>삭제</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FieldWrapper label="회사명" required error={ee?.company?.message}>
                <input {...register(`experiences.${index}.company`)} type="text" maxLength={50} placeholder="(주)커폴이컴퍼니" aria-required="true" aria-invalid={!!ee?.company} className={inputClass(!!ee?.company)} />
              </FieldWrapper>
              <FieldWrapper label="직위" required error={ee?.position?.message}>
                <input {...register(`experiences.${index}.position`)} type="text" maxLength={50} placeholder="프론트엔드 개발자" aria-required="true" aria-invalid={!!ee?.position} className={inputClass(!!ee?.position)} />
              </FieldWrapper>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FieldWrapper label="시작 연월" required error={ee?.startDate?.message} hint="YYYY-MM">
                <input {...register(`experiences.${index}.startDate`, { onBlur: () => trigger(`experiences.${index}.startDate`) })} type="text" placeholder="2023-01" aria-required="true" aria-invalid={!!ee?.startDate} className={inputClass(!!ee?.startDate)} />
              </FieldWrapper>
              <FieldWrapper label="종료 연월" required error={ee?.endDate?.message} hint="YYYY-MM 또는 present">
                <input {...register(`experiences.${index}.endDate`, { onBlur: () => trigger(`experiences.${index}.endDate`) })} type="text" placeholder="2024-12 또는 present" aria-required="true" aria-invalid={!!ee?.endDate} className={inputClass(!!ee?.endDate)} />
              </FieldWrapper>
            </div>
            <FieldWrapper label="업무 설명" error={ee?.description?.message} hint="최대 1000자">
              <textarea {...register(`experiences.${index}.description`)} maxLength={1000} placeholder="담당한 업무와 성과를 기입해주세요." aria-invalid={!!ee?.description} className={textareaClass(!!ee?.description)} rows={3} />
            </FieldWrapper>
          </div>
        );
      })}
      {fields.length < MAX_EXPERIENCES ? (
        <button type="button" onClick={() => append({ company: '', position: '', startDate: '', endDate: '', description: '' })} className="w-full py-2.5 border-2 border-dashed border-blue-300 text-blue-600 hover:border-blue-400 hover:bg-blue-50 rounded-xl text-sm font-medium transition-colors">
          + 경력 추가 ({fields.length}/{MAX_EXPERIENCES})
        </button>
      ) : (
        <p className="text-center text-xs text-gray-500">경력을 최대 {MAX_EXPERIENCES}개까지 입력할 수 있습니다.</p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 메인 페이지 컴포넌트
// ---------------------------------------------------------------------------

const TOTAL_STEPS = 3;
const STEP_TITLES = ['기본 정보', '프로젝트', '경력'];

export default function PortfolioCreatePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-gray-400 text-sm">로딩 중...</p></div>}>
      <CreatePageContent />
    </Suspense>
  );
}

function CreatePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const step = searchParams.get('step');
  const editId = searchParams.get('edit');
  const isTemplateStep = step === 'template';
  const isPublishStep = step === 'publish';

  const user = useAuthStore((state) => state.user);
  const setDraft = usePortfolioStore((s) => s.setDraft);
  const draft = usePortfolioStore((s) => s.draft);
  const clearDraft = usePortfolioStore((s) => s.clearDraft);
  const createPortfolio = usePortfolioStore((s) => s.createPortfolio);
  const updatePortfolio = usePortfolioStore((s) => s.updatePortfolio);
  const getById = usePortfolioStore((s) => s.getById);
  const selectedTemplate = useTemplateStore((s) => s.selectedTemplate);
  const customization = useTemplateStore((s) => s.customization);

  const [currentStep, setCurrentStep] = useState(1);
  const [validationError, setValidationError] = useState(false);

  // 발행 단계 상태
  const [portfolioTitle, setPortfolioTitle] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private'>('private');

  const form = useForm<PortfolioFormValues>({
    resolver: zodResolver(portfolioFormSchema),
    defaultValues: { name: '', title: '', bio: '', email: '', githubUrl: '', skills: [], projects: [], experiences: [] },
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });

  const { handleSubmit, trigger, reset, formState: { errors } } = form;

  // 수정 모드: 기존 포트폴리오 데이터를 폼에 로드
  useEffect(() => {
    if (editId) {
      const pf = getById(editId);
      if (pf) {
        reset({
          name: pf.profileData.name,
          title: pf.profileData.title,
          bio: pf.profileData.bio,
          email: pf.profileData.email,
          githubUrl: pf.profileData.githubUrl,
          skills: pf.profileData.skills,
          projects: pf.profileData.projects.map((p) => ({ title: p.title, description: p.description, url: p.url, technologies: p.technologies })),
          experiences: pf.profileData.experiences.map((e) => ({ company: e.company, position: e.position, startDate: e.startDate, endDate: e.endDate, description: e.description })),
        });
        setPortfolioTitle(pf.title);
        setVisibility(pf.visibility);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId]);

  const handleNext = useCallback(async () => {
    setValidationError(false);
    let isValid = false;
    if (currentStep === 1) isValid = await trigger(['name', 'title', 'bio', 'email', 'githubUrl', 'skills']);
    else if (currentStep === 2) isValid = await trigger('projects');
    else isValid = true;
    if (!isValid) { setValidationError(true); return; }
    setCurrentStep((s) => Math.min(s + 1, TOTAL_STEPS));
  }, [currentStep, trigger]);

  const handleBack = useCallback(() => {
    setValidationError(false);
    setCurrentStep((s) => Math.max(s - 1, 1));
  }, []);

  // 입력 폼 완료 → draft 저장 후 템플릿 단계로 (포트폴리오는 아직 생성 안 함)
  const onSubmit = useCallback((data: PortfolioFormValues) => {
    setValidationError(false);
    const generateId = () => typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setDraft({
      userId: user?.id ?? 'anonymous',
      name: data.name, title: data.title, bio: data.bio, email: data.email,
      githubUrl: data.githubUrl, skills: data.skills,
      projects: data.projects.map((p) => ({ ...p, id: generateId() })),
      experiences: data.experiences.map((e) => ({ ...e, id: generateId() })),
    }, editId ?? null);
    const q = editId ? `?step=template&edit=${editId}` : '?step=template';
    router.push(`/portfolio/create${q}`);
  }, [setDraft, user, router, editId]);

  const hasFormErrors = Object.keys(errors).length > 0;

  const onInvalid = useCallback(() => {
    setValidationError(true);
    const fe = form.formState.errors;
    if (fe.name || fe.title || fe.bio || fe.email || fe.githubUrl || fe.skills) setCurrentStep(1);
    else if (fe.projects) setCurrentStep(2);
    else if (fe.experiences) setCurrentStep(3);
  }, [form]);

  // 최종 발행: HTML 생성 → 포트폴리오 1개 생성/갱신 → 마이페이지로
  const handlePublish = useCallback(() => {
    if (!draft.profileData) {
      router.push('/portfolio/create');
      return;
    }
    const now = new Date().toISOString();
    const profileData = {
      ...draft.profileData,
      id: draft.editingId ?? (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`),
      createdAt: now,
      updatedAt: now,
    };
    const site = generateSite(profileData, selectedTemplate, customization, profileData.id);
    const title = portfolioTitle.trim() || `${profileData.name}의 포트폴리오`;

    if (draft.editingId) {
      updatePortfolio(draft.editingId, {
        title, visibility, html: site.html, templateId: selectedTemplate.id,
        customization, profileData, ownerName: profileData.name,
      });
    } else {
      createPortfolio({
        userId: user?.id ?? 'anonymous',
        ownerName: user?.name ?? profileData.name,
        title, profileData, html: site.html,
        templateId: selectedTemplate.id, customization, visibility,
      });
    }
    clearDraft();
    router.push('/mypage');
  }, [draft, selectedTemplate, customization, portfolioTitle, visibility, createPortfolio, updatePortfolio, clearDraft, router, user]);

  // ── 발행 단계 (이름 + 공개여부 → 생성) ──
  if (isPublishStep) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="max-w-2xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">포트폴리오 발행</h1>
          <p className="text-sm text-gray-500 text-center mb-6">이름과 공개 범위를 정하면 끝이야!</p>
          <div className="mb-6">
            <MascotMessage type="guide" message="포트폴리오 이름을 정하고, 공개할지 비공개로 둘지 골라줘! ✨" />
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col gap-6">
            <div className="flex flex-col gap-1">
              <label htmlFor="pf-title" className="text-sm font-medium text-gray-700">포트폴리오 이름 <span className="text-red-500">*</span></label>
              <input
                id="pf-title"
                type="text"
                value={portfolioTitle}
                onChange={(e) => setPortfolioTitle(e.target.value)}
                maxLength={60}
                placeholder="예) 2026 프론트엔드 지원용 포트폴리오"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-300"
              />
              <p className="text-xs text-gray-400">비워두면 &quot;{draft.profileData?.name ?? '내'}의 포트폴리오&quot;로 저장돼요.</p>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-gray-700">공개 범위</span>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setVisibility('private')}
                  className={['rounded-xl border-2 p-4 text-left transition-all', visibility === 'private' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'].join(' ')}
                >
                  <div className="text-lg mb-1">🔒 비공개</div>
                  <p className="text-xs text-gray-500">나만 볼 수 있어요. 나중에 공개로 바꿀 수 있어요.</p>
                </button>
                <button
                  type="button"
                  onClick={() => setVisibility('public')}
                  className={['rounded-xl border-2 p-4 text-left transition-all', visibility === 'public' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'].join(' ')}
                >
                  <div className="text-lg mb-1">🌐 공개</div>
                  <p className="text-xs text-gray-500">커뮤니티 피드에 노출되고 공유 URL이 생겨요.</p>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <button type="button" onClick={() => router.push(`/portfolio/create?step=template${editId ? `&edit=${editId}` : ''}`)} className="px-5 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors">← 이전</button>
              <button type="button" onClick={handlePublish} className="px-6 py-2.5 rounded-lg bg-green-600 text-white text-sm font-bold hover:bg-green-700 transition-colors shadow-sm">
                {draft.editingId ? '포트폴리오 수정 완료 ✨' : '포트폴리오 생성하기 ✨'}
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ── 템플릿 선택 단계 ──
  if (isTemplateStep) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="max-w-2xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">포트폴리오 만들기</h1>
          <p className="text-sm text-gray-500 text-center mb-6">템플릿 선택 (4/5)</p>
          <div className="mb-6">
            <MascotMessage type="guide" message="맘에 드는 템플릿을 골라봐! 색상이랑 폰트도 바꿀 수 있어 🎨" />
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <TemplateSelector
              onNext={() => router.push(`/portfolio/create?step=publish${editId ? `&edit=${editId}` : ''}`)}
              onBack={() => router.push(`/portfolio/create${editId ? `?edit=${editId}` : ''}`)}
            />
          </div>
        </main>
      </div>
    );
  }

  // ── 정보 입력 단계 (1~3) ──
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">{editId ? '포트폴리오 수정' : '포트폴리오 만들기'}</h1>
        <p className="text-sm text-gray-500 text-center mb-6">{STEP_TITLES[currentStep - 1]} ({currentStep}/{TOTAL_STEPS})</p>

        <StepIndicator current={currentStep} total={TOTAL_STEPS} />

        <div className="mb-6">
          {(validationError || hasFormErrors) ? (
            <MascotMessage type="error" message="앗, 여기를 한번 확인해볼래요? 필수 항목이나 형식이 맞지 않는 것 같아!" />
          ) : (
            <MascotMessage type="guide" message={STEP_GUIDE_MESSAGES[currentStep]} />
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          {currentStep === 1 && <Step1BasicInfo form={form} />}
          {currentStep === 2 && <Step2Projects form={form} />}
          {currentStep === 3 && <Step3Experiences form={form} />}

          <div className="flex items-center justify-between mt-8 pt-5 border-t border-gray-100">
            {currentStep > 1 ? (
              <button type="button" onClick={handleBack} className="px-5 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors">← 이전</button>
            ) : <div />}
            {currentStep < TOTAL_STEPS ? (
              <button type="button" onClick={handleNext} className="px-6 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors">다음 →</button>
            ) : (
              <button type="button" onClick={() => handleSubmit(onSubmit, onInvalid)()} className="px-6 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors">
                다음: 템플릿 고르기 →
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
