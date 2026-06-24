/**
 * CustomPortfolio: 대신취업해줘 - AppError 유니언 타입 정의
 */

/** 폼 검증 오류 */
export interface ValidationError {
  type: 'VALIDATION_ERROR';
  field: string;
  message: string;
}

/** 인증 오류 */
export interface AuthError {
  type: 'AUTH_ERROR';
  reason: 'cancelled' | 'failed' | 'network';
}

/** 사이트 생성 오류 */
export interface GenerationError {
  type: 'GENERATION_ERROR';
  details: string;
}

/** JSON 가져오기 오류 */
export interface ImportError {
  type: 'IMPORT_ERROR';
  reason: 'invalid_json' | 'missing_fields';
}

/** 로컬 스토리지 오류 */
export interface StorageError {
  type: 'STORAGE_ERROR';
  reason: 'quota_exceeded' | 'unavailable';
}

/** 접근 거부 오류 */
export interface AccessDeniedError {
  type: 'ACCESS_DENIED';
  portfolioId: string;
}

/** 애플리케이션 에러 유니언 타입 */
export type AppError =
  | ValidationError
  | AuthError
  | GenerationError
  | ImportError
  | StorageError
  | AccessDeniedError;
