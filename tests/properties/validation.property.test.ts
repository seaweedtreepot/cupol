/**
 * Validation Utility Property-Based Tests
 *
 * Feature: portfolio-generator
 * Tests Properties 12, 13, 14, 20 from the design document.
 *
 * Validates: Requirements 10.1, 10.2, 5.7, 3.6
 */
import { describe, it } from 'vitest';
import * as fc from 'fast-check';
import {
  validateField,
  validateUrl,
  validateEmail,
  validateHexColor,
  profileDataSchema,
} from '@/lib/validators';

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

/**
 * Generates valid HTTP/HTTPS URLs by constructing them from parts.
 */
const validUrlArb = fc
  .record({
    protocol: fc.constantFrom('http', 'https'),
    host: fc.domain(),
    path: fc.stringOf(fc.constantFrom('a', 'b', 'c', '1', '2', '/', '-', '_'), {
      minLength: 0,
      maxLength: 20,
    }),
  })
  .map(({ protocol, host, path }) => `${protocol}://${host}/${path}`);

/**
 * Generates strings that are definitely NOT valid URLs:
 * no protocol, random strings, empty strings, etc.
 */
const invalidUrlArb = fc.oneof(
  fc.constant(''),
  fc.constant('ftp://example.com'),
  fc.constant('not-a-url'),
  fc.constant('//example.com'),
  fc.constant('example.com'),
  fc.stringOf(fc.char(), { minLength: 1, maxLength: 50 }).filter(
    (s) => !s.startsWith('http://') && !s.startsWith('https://')
  )
);

/**
 * Generates valid email addresses matching "local@domain.tld".
 */
const validEmailArb = fc
  .record({
    local: fc.stringOf(fc.constantFrom('a', 'b', 'c', 'x', 'y', 'z', '1', '2', '3', '.', '_', '-'), {
      minLength: 1,
      maxLength: 20,
    }),
    domain: fc.domain(),
    tld: fc.constantFrom('com', 'net', 'org', 'io', 'dev', 'kr'),
  })
  .filter(({ local }) => local.length > 0 && !local.startsWith('.') && !local.endsWith('.'))
  .map(({ local, domain, tld }) => `${local}@${domain}.${tld}`);

/**
 * Generates strings that are NOT valid emails.
 */
const invalidEmailArb = fc.oneof(
  fc.constant(''),
  fc.constant('no-at-sign'),
  fc.constant('@nodomain'),
  fc.constant('missing@tld'),
  fc.constant('two@@signs.com'),
  fc.constant('spaces in@email.com'),
  fc.stringOf(fc.char(), { minLength: 1, maxLength: 30 }).filter(
    (s) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)
  )
);

/**
 * Generates valid #RRGGBB hex color strings.
 */
const validHexColorArb = fc
  .tuple(
    fc.integer({ min: 0, max: 255 }),
    fc.integer({ min: 0, max: 255 }),
    fc.integer({ min: 0, max: 255 })
  )
  .map(([r, g, b]) => `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`);

/**
 * Generates strings that do NOT match #RRGGBB format.
 */
const invalidHexColorArb = fc.oneof(
  fc.constant(''),
  fc.constant('#FFF'),          // shorthand 3-digit
  fc.constant('#GGGGGG'),       // invalid hex chars
  fc.constant('FF5733'),        // missing #
  fc.constant('#FF573'),        // too short
  fc.constant('#FF57333'),      // too long
  fc.constant('red'),
  fc.constant('rgb(255,0,0)'),
  fc.stringOf(fc.char(), { minLength: 1, maxLength: 10 }).filter(
    (s) => !/^#[0-9A-Fa-f]{6}$/.test(s)
  )
);

/**
 * Builds a minimal valid ProfileData for use in Property 20 tests.
 */
const baseProfileData = {
  id: 'test-id',
  userId: 'user-1',
  title: '',
  bio: '',
  email: 'test@example.com',
  skills: [],
  githubUrl: '',
  projects: [],
  experiences: [],
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

/**
 * Generates empty or whitespace-only name strings.
 */
const emptyOrWhitespaceNameArb = fc.oneof(
  fc.constant(''),
  fc.constant(' '),
  fc.constant('   '),
  fc.constant('\t'),
  fc.constant('\n'),
  fc.stringOf(fc.constantFrom(' ', '\t', '\n', '\r'), { minLength: 1, maxLength: 20 })
);

// ---------------------------------------------------------------------------
// Property 12: URL 검증 정확성
// ---------------------------------------------------------------------------

describe('Property 12: URL 검증 정확성', () => {
  /**
   * Feature: portfolio-generator, Property 12: URL 검증 정확성
   * Validates: Requirements 10.1
   */
  it('http:// 또는 https://로 시작하는 유효한 URL에 대해 validateField("url") 는 success=true를 반환해야 한다', () => {
    fc.assert(
      fc.property(validUrlArb, (url) => {
        // Only proceed if the URL is actually parseable (belt-and-suspenders)
        let isActuallyValid: boolean;
        try {
          const parsed = new URL(url);
          isActuallyValid = parsed.protocol === 'http:' || parsed.protocol === 'https:';
        } catch {
          isActuallyValid = false;
        }
        if (!isActuallyValid) return; // skip malformed generated strings

        const result = validateField('url', url);
        if (!result.success) {
          throw new Error(`Expected success=true for valid URL "${url}", got success=false`);
        }
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: portfolio-generator, Property 12: URL 검증 정확성
   * Validates: Requirements 10.1
   */
  it('유효하지 않은 URL에 대해 validateField("url") 는 success=false를 반환해야 한다', () => {
    fc.assert(
      fc.property(invalidUrlArb, (value) => {
        const result = validateField('url', value);
        if (result.success) {
          throw new Error(`Expected success=false for invalid URL "${value}", got success=true`);
        }
      }),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 13: 이메일 검증 정확성
// ---------------------------------------------------------------------------

describe('Property 13: 이메일 검증 정확성', () => {
  /**
   * Feature: portfolio-generator, Property 13: 이메일 검증 정확성
   * Validates: Requirements 10.2
   */
  it('"local@domain.tld" 구조의 이메일에 대해 validateField("email") 는 success=true를 반환해야 한다', () => {
    fc.assert(
      fc.property(validEmailArb, (email) => {
        const result = validateField('email', email);
        if (!result.success) {
          throw new Error(`Expected success=true for valid email "${email}", got success=false`);
        }
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: portfolio-generator, Property 13: 이메일 검증 정확성
   * Validates: Requirements 10.2
   */
  it('유효하지 않은 이메일에 대해 validateField("email") 는 success=false를 반환해야 한다', () => {
    fc.assert(
      fc.property(invalidEmailArb, (value) => {
        const result = validateField('email', value);
        if (result.success) {
          throw new Error(`Expected success=false for invalid email "${value}", got success=true`);
        }
      }),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 14: 색상값 검증
// ---------------------------------------------------------------------------

describe('Property 14: 색상값 검증', () => {
  /**
   * Feature: portfolio-generator, Property 14: 색상값 검증
   * Validates: Requirements 5.7
   */
  it('#RRGGBB 형식의 HEX 색상코드에 대해 validateField("hexColor") 는 success=true를 반환해야 한다', () => {
    fc.assert(
      fc.property(validHexColorArb, (color) => {
        const result = validateField('hexColor', color);
        if (!result.success) {
          throw new Error(`Expected success=true for valid hex color "${color}", got success=false`);
        }
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: portfolio-generator, Property 14: 색상값 검증
   * Validates: Requirements 5.7
   */
  it('#RRGGBB 형식이 아닌 문자열에 대해 validateField("hexColor") 는 success=false를 반환해야 한다', () => {
    fc.assert(
      fc.property(invalidHexColorArb, (value) => {
        const result = validateField('hexColor', value);
        if (result.success) {
          throw new Error(`Expected success=false for invalid hex color "${value}", got success=true`);
        }
      }),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 20: 이름 필수 필드 검증
// ---------------------------------------------------------------------------

describe('Property 20: 이름 필수 필드 검증', () => {
  /**
   * Feature: portfolio-generator, Property 20: 이름 필수 필드 검증
   * Validates: Requirements 3.6
   */
  it('name이 빈 문자열이거나 공백만으로 구성된 ProfileData는 profileDataSchema.safeParse 에서 success=false를 반환해야 한다', () => {
    fc.assert(
      fc.property(emptyOrWhitespaceNameArb, (name) => {
        const input = { ...baseProfileData, name };
        const result = profileDataSchema.safeParse(input);
        if (result.success) {
          throw new Error(
            `Expected safeParse to fail for name="${JSON.stringify(name)}", but it succeeded`
          );
        }
      }),
      { numRuns: 100 }
    );
  });
});
