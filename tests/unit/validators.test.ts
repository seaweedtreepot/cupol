/**
 * validators.ts 단위 테스트
 * Requirements: 10.1, 10.2, 5.7, 3.6
 */
import { describe, it, expect } from 'vitest';
import {
  validateUrl,
  validateEmail,
  validateHexColor,
  validateField,
  profileDataSchema,
  companyCriteriaSchema,
  chatRequestSchema,
} from '@/lib/validators';

// ---------------------------------------------------------------------------
// validateUrl
// ---------------------------------------------------------------------------

describe('validateUrl', () => {
  it('https:// URL을 유효하다고 판단한다', () => {
    expect(validateUrl('https://github.com/user')).toBe(true);
  });

  it('http:// URL을 유효하다고 판단한다', () => {
    expect(validateUrl('http://example.com')).toBe(true);
  });

  it('프로토콜 없는 URL을 무효로 판단한다', () => {
    expect(validateUrl('github.com/user')).toBe(false);
  });

  it('ftp:// 프로토콜을 무효로 판단한다', () => {
    expect(validateUrl('ftp://files.example.com')).toBe(false);
  });

  it('빈 문자열을 무효로 판단한다', () => {
    expect(validateUrl('')).toBe(false);
  });

  it('공백 문자열을 무효로 판단한다', () => {
    expect(validateUrl('   ')).toBe(false);
  });

  it('랜덤 문자열을 무효로 판단한다', () => {
    expect(validateUrl('not a url at all')).toBe(false);
  });

  it('URL에 경로와 쿼리스트링이 있어도 유효하다', () => {
    expect(validateUrl('https://example.com/path?query=1#hash')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// validateEmail
// ---------------------------------------------------------------------------

describe('validateEmail', () => {
  it('표준 이메일 형식을 유효하다고 판단한다', () => {
    expect(validateEmail('user@example.com')).toBe(true);
  });

  it('서브도메인이 있는 이메일을 유효하다고 판단한다', () => {
    expect(validateEmail('user@mail.example.co.kr')).toBe(true);
  });

  it('@가 없는 문자열을 무효로 판단한다', () => {
    expect(validateEmail('userexample.com')).toBe(false);
  });

  it('도메인에 점이 없는 이메일을 무효로 판단한다', () => {
    expect(validateEmail('user@examplecom')).toBe(false);
  });

  it('빈 문자열을 무효로 판단한다', () => {
    expect(validateEmail('')).toBe(false);
  });

  it('공백을 포함한 이메일을 무효로 판단한다', () => {
    expect(validateEmail('us er@example.com')).toBe(false);
  });

  it('@가 여러 개인 문자열을 무효로 판단한다', () => {
    expect(validateEmail('a@@example.com')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// validateHexColor
// ---------------------------------------------------------------------------

describe('validateHexColor', () => {
  it('#RRGGBB 형식을 유효하다고 판단한다', () => {
    expect(validateHexColor('#FF5733')).toBe(true);
  });

  it('소문자 hex도 유효하다고 판단한다', () => {
    expect(validateHexColor('#ff5733')).toBe(true);
  });

  it('검정색 #000000을 유효하다고 판단한다', () => {
    expect(validateHexColor('#000000')).toBe(true);
  });

  it('흰색 #FFFFFF를 유효하다고 판단한다', () => {
    expect(validateHexColor('#FFFFFF')).toBe(true);
  });

  it('# 없는 값을 무효로 판단한다', () => {
    expect(validateHexColor('FF5733')).toBe(false);
  });

  it('3자리 HEX(#RGB)를 무효로 판단한다', () => {
    expect(validateHexColor('#F57')).toBe(false);
  });

  it('7자리 이상을 무효로 판단한다', () => {
    expect(validateHexColor('#FF57331')).toBe(false);
  });

  it('유효하지 않은 문자를 포함하면 무효로 판단한다', () => {
    expect(validateHexColor('#GGGGGG')).toBe(false);
  });

  it('빈 문자열을 무효로 판단한다', () => {
    expect(validateHexColor('')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// validateField (통합 검증 함수)
// ---------------------------------------------------------------------------

describe('validateField', () => {
  describe('url 필드', () => {
    it('유효한 URL에 success: true를 반환한다', () => {
      const result = validateField('url', 'https://github.com');
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('유효하지 않은 URL에 success: false와 에러 메시지를 반환한다', () => {
      const result = validateField('url', 'github.com');
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('email 필드', () => {
    it('유효한 이메일에 success: true를 반환한다', () => {
      const result = validateField('email', 'test@example.com');
      expect(result.success).toBe(true);
    });

    it('유효하지 않은 이메일에 success: false와 에러 메시지를 반환한다', () => {
      const result = validateField('email', 'notanemail');
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('hexColor 필드', () => {
    it('유효한 HEX 색상코드에 success: true를 반환한다', () => {
      const result = validateField('hexColor', '#A1B2C3');
      expect(result.success).toBe(true);
    });

    it('유효하지 않은 색상코드에 success: false와 에러 메시지를 반환한다', () => {
      const result = validateField('hexColor', 'red');
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});

// ---------------------------------------------------------------------------
// profileDataSchema
// ---------------------------------------------------------------------------

describe('profileDataSchema', () => {
  const baseProfile = {
    id: '1',
    userId: 'user1',
    name: '홍길동',
    title: '프론트엔드 개발자',
    bio: '안녕하세요.',
    email: 'hong@example.com',
    skills: ['TypeScript', 'React'],
    githubUrl: 'https://github.com/hong',
    projects: [],
    experiences: [],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  it('유효한 프로필 데이터를 통과시킨다', () => {
    const result = profileDataSchema.safeParse(baseProfile);
    expect(result.success).toBe(true);
  });

  it('이름이 빈 문자열이면 실패한다', () => {
    const result = profileDataSchema.safeParse({ ...baseProfile, name: '' });
    expect(result.success).toBe(false);
  });

  it('이름이 공백만으로 구성되면 실패한다', () => {
    const result = profileDataSchema.safeParse({ ...baseProfile, name: '   ' });
    expect(result.success).toBe(false);
  });

  it('이름이 50자를 초과하면 실패한다', () => {
    const result = profileDataSchema.safeParse({
      ...baseProfile,
      name: 'a'.repeat(51),
    });
    expect(result.success).toBe(false);
  });

  it('bio가 500자를 초과하면 실패한다', () => {
    const result = profileDataSchema.safeParse({
      ...baseProfile,
      bio: 'a'.repeat(501),
    });
    expect(result.success).toBe(false);
  });

  it('skills가 30개를 초과하면 실패한다', () => {
    const result = profileDataSchema.safeParse({
      ...baseProfile,
      skills: Array.from({ length: 31 }, (_, i) => `skill${i}`),
    });
    expect(result.success).toBe(false);
  });

  it('잘못된 이메일 형식이면 실패한다', () => {
    const result = profileDataSchema.safeParse({
      ...baseProfile,
      email: 'invalid-email',
    });
    expect(result.success).toBe(false);
  });

  it('프로토콜 없는 githubUrl이면 실패한다', () => {
    const result = profileDataSchema.safeParse({
      ...baseProfile,
      githubUrl: 'github.com/user',
    });
    expect(result.success).toBe(false);
  });

  it('projects가 20개를 초과하면 실패한다', () => {
    const project = {
      id: 'p1',
      title: 'Project',
      description: 'desc',
      url: 'https://example.com',
      technologies: [],
    };
    const result = profileDataSchema.safeParse({
      ...baseProfile,
      projects: Array.from({ length: 21 }, (_, i) => ({ ...project, id: `p${i}` })),
    });
    expect(result.success).toBe(false);
  });

  it('project.title이 100자를 초과하면 실패한다', () => {
    const result = profileDataSchema.safeParse({
      ...baseProfile,
      projects: [
        {
          id: 'p1',
          title: 'a'.repeat(101),
          description: 'desc',
          url: 'https://example.com',
          technologies: [],
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  it('experience.company가 50자를 초과하면 실패한다', () => {
    const result = profileDataSchema.safeParse({
      ...baseProfile,
      experiences: [
        {
          id: 'e1',
          company: 'a'.repeat(51),
          position: '개발자',
          startDate: '2022-01',
          endDate: '2023-01',
          description: '',
        },
      ],
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// companyCriteriaSchema
// ---------------------------------------------------------------------------

describe('companyCriteriaSchema', () => {
  const baseCriteria = {
    requiredSkills: ['TypeScript'],
    minExperienceYears: 2,
    preferredRole: '프론트엔드',
    additionalRequirements: '',
  };

  it('유효한 CompanyCriteria를 통과시킨다', () => {
    const result = companyCriteriaSchema.safeParse(baseCriteria);
    expect(result.success).toBe(true);
  });

  it('requiredSkills가 비어있으면 실패한다', () => {
    const result = companyCriteriaSchema.safeParse({
      ...baseCriteria,
      requiredSkills: [],
    });
    expect(result.success).toBe(false);
  });

  it('minExperienceYears가 음수이면 실패한다', () => {
    const result = companyCriteriaSchema.safeParse({
      ...baseCriteria,
      minExperienceYears: -1,
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// chatRequestSchema
// ---------------------------------------------------------------------------

describe('chatRequestSchema', () => {
  const baseRequest = {
    id: 'req1',
    fromUserId: 'user1',
    toUserId: 'user2',
    requesterName: '홍길동',
    requesterEmail: 'hong@example.com',
    requesterOrganization: '어딘가',
    message: '안녕하세요, 커피챗 요청드립니다.',
    status: 'pending' as const,
    createdAt: '2024-01-01T00:00:00Z',
  };

  it('유효한 ChatRequest를 통과시킨다', () => {
    const result = chatRequestSchema.safeParse(baseRequest);
    expect(result.success).toBe(true);
  });

  it('requesterName이 빈 문자열이면 실패한다', () => {
    const result = chatRequestSchema.safeParse({
      ...baseRequest,
      requesterName: '',
    });
    expect(result.success).toBe(false);
  });

  it('requesterName이 공백만이면 실패한다', () => {
    const result = chatRequestSchema.safeParse({
      ...baseRequest,
      requesterName: '   ',
    });
    expect(result.success).toBe(false);
  });

  it('requesterEmail이 유효하지 않으면 실패한다', () => {
    const result = chatRequestSchema.safeParse({
      ...baseRequest,
      requesterEmail: 'not-an-email',
    });
    expect(result.success).toBe(false);
  });

  it('message가 빈 문자열이면 실패한다', () => {
    const result = chatRequestSchema.safeParse({ ...baseRequest, message: '' });
    expect(result.success).toBe(false);
  });

  it('message가 공백만이면 실패한다', () => {
    const result = chatRequestSchema.safeParse({
      ...baseRequest,
      message: '   ',
    });
    expect(result.success).toBe(false);
  });

  it('message가 500자를 초과하면 실패한다', () => {
    const result = chatRequestSchema.safeParse({
      ...baseRequest,
      message: 'a'.repeat(501),
    });
    expect(result.success).toBe(false);
  });
});
