/**
 * Zod 검증 스키마 및 유틸리티 함수
 *
 * Requirements: 10.1, 10.2, 10.3, 10.4, 3.6, 5.7
 */
import { z } from 'zod';

// ---------------------------------------------------------------------------
// 재사용 가능한 기본 스키마 조각
// ---------------------------------------------------------------------------

/** http:// 또는 https://로 시작하는 유효한 URL */
const urlSchema = z
  .string()
  .refine(
    (val) => {
      if (val === '') return true; // 선택 필드는 빈 문자열 허용
      return validateUrl(val);
    },
    { message: 'http:// 또는 https://를 포함한 유효한 URL을 입력해주세요.' }
  );

/** "local@domain.tld" 구조의 유효한 이메일 */
const emailSchema = z
  .string()
  .refine((val) => validateEmail(val), {
    message: '유효한 이메일 주소를 입력해주세요. (예: name@example.com)',
  });

/** #RRGGBB 형식의 HEX 색상코드 */
const hexColorSchema = z
  .string()
  .refine((val) => validateHexColor(val), {
    message: '유효한 HEX 색상코드를 입력해주세요. (예: #FF5733)',
  });

// ---------------------------------------------------------------------------
// ProfileData Zod 스키마
// ---------------------------------------------------------------------------

export const projectSchema = z.object({
  id: z.string(),
  title: z.string().max(100, '프로젝트 제목은 최대 100자까지 입력할 수 있습니다.'),
  description: z.string().max(1000, '프로젝트 설명은 최대 1000자까지 입력할 수 있습니다.'),
  url: urlSchema,
  technologies: z.array(z.string()),
});

export const experienceSchema = z.object({
  id: z.string(),
  company: z.string().max(50, '회사명은 최대 50자까지 입력할 수 있습니다.'),
  position: z.string().max(50, '직위는 최대 50자까지 입력할 수 있습니다.'),
  startDate: z.string(),
  endDate: z.string(),
  description: z.string().max(1000, '업무 설명은 최대 1000자까지 입력할 수 있습니다.'),
});

/**
 * ProfileData Zod 스키마
 * Requirements: 3.1 ~ 3.6, 10.1, 10.2
 */
export const profileDataSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z
    .string()
    .min(1, '이름은 필수 입력 항목입니다.')
    .max(50, '이름은 최대 50자까지 입력할 수 있습니다.')
    .refine((val) => val.trim().length > 0, {
      message: '이름은 공백만으로 구성될 수 없습니다.',
    }),
  title: z.string().max(50, '직함은 최대 50자까지 입력할 수 있습니다.'),
  bio: z.string().max(500, '자기소개는 최대 500자까지 입력할 수 있습니다.'),
  email: emailSchema,
  skills: z
    .array(z.string())
    .max(30, '기술 스택은 최대 30개까지 입력할 수 있습니다.'),
  githubUrl: urlSchema,
  projects: z
    .array(projectSchema)
    .max(20, '프로젝트는 최대 20개까지 입력할 수 있습니다.'),
  experiences: z
    .array(experienceSchema)
    .max(20, '경력은 최대 20개까지 입력할 수 있습니다.'),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// ---------------------------------------------------------------------------
// CompanyCriteria Zod 스키마
// ---------------------------------------------------------------------------

/**
 * CompanyCriteria Zod 스키마
 * Requirements: 6.1, 6.9
 */
export const companyCriteriaSchema = z.object({
  requiredSkills: z
    .array(z.string())
    .min(1, '요구 기술 스택을 최소 1개 이상 입력해주세요.'),
  minExperienceYears: z.number().min(0),
  preferredRole: z.string(),
  additionalRequirements: z.string(),
});

// ---------------------------------------------------------------------------
// ChatRequest Zod 스키마
// ---------------------------------------------------------------------------

/**
 * ChatRequest Zod 스키마
 * Requirements: 8.11, 8.12
 */
export const chatRequestSchema = z.object({
  id: z.string(),
  fromUserId: z.string(),
  toUserId: z.string(),
  requesterName: z
    .string()
    .min(1, '이름은 필수 입력 항목입니다.')
    .refine((val) => val.trim().length > 0, {
      message: '이름은 공백만으로 구성될 수 없습니다.',
    }),
  requesterEmail: emailSchema,
  requesterOrganization: z.string(),
  message: z
    .string()
    .min(1, '메시지는 필수 입력 항목입니다.')
    .max(500, '메시지는 최대 500자까지 입력할 수 있습니다.')
    .refine((val) => val.trim().length > 0, {
      message: '메시지는 공백만으로 구성될 수 없습니다.',
    }),
  status: z.enum(['pending', 'accepted', 'rejected']),
  createdAt: z.string(),
  respondedAt: z.string().optional(),
});

// ---------------------------------------------------------------------------
// 개별 검증 유틸리티 함수
// ---------------------------------------------------------------------------

/**
 * URL 검증: http:// 또는 https:// 프로토콜을 포함한 유효한 URL인지 확인
 * Requirements: 10.1
 */
export function validateUrl(value: string): boolean {
  if (!value || value.trim() === '') return false;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * 이메일 검증: "local@domain.tld" 구조의 유효한 이메일인지 확인
 * Requirements: 10.2
 */
export function validateEmail(value: string): boolean {
  if (!value || value.trim() === '') return false;
  // local@domain.tld 구조: local 부분, @, 도메인, 점, TLD(최소 1자)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value);
}

/**
 * HEX 색상코드 검증: #RRGGBB 형식인지 확인
 * Requirements: 5.7
 */
export function validateHexColor(value: string): boolean {
  if (!value) return false;
  return /^#[0-9A-Fa-f]{6}$/.test(value);
}

// ---------------------------------------------------------------------------
// 통합 검증 함수
// ---------------------------------------------------------------------------

export type ValidatableField = 'url' | 'email' | 'hexColor';

export interface ValidationResult {
  success: boolean;
  error?: string;
}

/**
 * 통합 필드 검증 함수
 * Requirements: 10.1, 10.2, 5.7
 */
export function validateField(
  field: ValidatableField,
  value: string
): ValidationResult {
  switch (field) {
    case 'url': {
      const isValid = validateUrl(value);
      return isValid
        ? { success: true }
        : {
            success: false,
            error: 'http:// 또는 https://를 포함한 유효한 URL을 입력해주세요.',
          };
    }
    case 'email': {
      const isValid = validateEmail(value);
      return isValid
        ? { success: true }
        : {
            success: false,
            error: '유효한 이메일 주소를 입력해주세요. (예: name@example.com)',
          };
    }
    case 'hexColor': {
      const isValid = validateHexColor(value);
      return isValid
        ? { success: true }
        : {
            success: false,
            error: '유효한 HEX 색상코드를 입력해주세요. (예: #FF5733)',
          };
    }
    default: {
      const _exhaustiveCheck: never = field;
      return { success: false, error: '알 수 없는 필드 유형입니다.' };
    }
  }
}
