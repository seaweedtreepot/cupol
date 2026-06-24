'use client';

/**
 * MascotMessage 컴포넌트
 * 커폴이 마스코트의 말풍선 메시지를 표시한다.
 * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.7, 11.8
 */

export interface MascotMessageProps {
  type: 'guide' | 'loading' | 'success' | 'error' | 'welcome';
  message: string;
  illustration?: 'magic' | 'celebrate' | 'confused' | 'wave' | 'guide';
}

/** type별 기본 일러스트 매핑 */
const DEFAULT_ILLUSTRATION: Record<MascotMessageProps['type'], MascotMessageProps['illustration']> = {
  loading: 'magic',
  success: 'celebrate',
  error: 'confused',
  welcome: 'wave',
  guide: 'guide',
};

/** 일러스트(이모지) 매핑 */
const ILLUSTRATION_EMOJI: Record<NonNullable<MascotMessageProps['illustration']>, string> = {
  magic: '🧙',
  celebrate: '🎉',
  confused: '😅',
  wave: '👋',
  guide: '📖',
};

/** type별 말풍선 배경/테두리 색상 */
const BUBBLE_STYLES: Record<MascotMessageProps['type'], string> = {
  loading: 'bg-blue-50 border-blue-200',
  success: 'bg-green-50 border-green-200',
  error: 'bg-red-50 border-red-200',
  welcome: 'bg-purple-50 border-purple-200',
  guide: 'bg-yellow-50 border-yellow-200',
};

/** type별 삼각형 포인터 색상 (before 트릭 대신 SVG 방식 사용) */
const POINTER_COLOR: Record<MascotMessageProps['type'], string> = {
  loading: '#dbeafe',   // blue-100
  success: '#dcfce7',   // green-100
  error: '#fee2e2',     // red-100
  welcome: '#f3e8ff',   // purple-100
  guide: '#fef9c3',     // yellow-100
};

const POINTER_BORDER_COLOR: Record<MascotMessageProps['type'], string> = {
  loading: '#bfdbfe',   // blue-200
  success: '#bbf7d0',   // green-200
  error: '#fecaca',     // red-200
  welcome: '#e9d5ff',   // purple-200
  guide: '#fde68a',     // yellow-200
};

/** type별 마스코트 원형 배경 */
const MASCOT_BG: Record<MascotMessageProps['type'], string> = {
  loading: 'bg-blue-100',
  success: 'bg-green-100',
  error: 'bg-red-100',
  welcome: 'bg-purple-100',
  guide: 'bg-yellow-100',
};

/** loading 타입일 때 애니메이션 클래스 */
const LOADING_ANIMATION = 'animate-bounce';

export function MascotMessage({ type, message, illustration }: MascotMessageProps) {
  const resolvedIllustration = illustration ?? DEFAULT_ILLUSTRATION[type];
  const emoji = ILLUSTRATION_EMOJI[resolvedIllustration!];
  const bubbleStyle = BUBBLE_STYLES[type];
  const mascotBg = MASCOT_BG[type];
  const isLoading = type === 'loading';

  // 포인터 SVG 삼각형 (말풍선 왼쪽, 마스코트를 향함)
  const pointerFill = POINTER_COLOR[type];
  const pointerBorder = POINTER_BORDER_COLOR[type];

  return (
    <div
      className="flex items-start gap-3"
      role="status"
      aria-live={isLoading ? 'polite' : undefined}
      aria-label={`커폴이 메시지: ${message}`}
    >
      {/* 마스코트 일러스트 영역 (최소 48x48px) */}
      <div
        className={`
          flex-shrink-0 flex items-center justify-center
          w-14 h-14 rounded-full text-3xl
          ${mascotBg}
          ${isLoading ? LOADING_ANIMATION : ''}
        `}
        aria-hidden="true"
        style={{ minWidth: '48px', minHeight: '48px' }}
      >
        {emoji}
      </div>

      {/* 말풍선 영역: 삼각형 포인터 + 말풍선 박스 */}
      <div className="flex items-center">
        {/* 삼각형 포인터 (마스코트 방향) */}
        <svg
          width="12"
          height="20"
          viewBox="0 0 12 20"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
          className="flex-shrink-0"
        >
          {/* 테두리 삼각형 */}
          <polygon
            points="12,2 0,10 12,18"
            fill={pointerBorder}
          />
          {/* 채우기 삼각형 (내부 색상, 살짝 오른쪽으로) */}
          <polygon
            points="12,4 2,10 12,16"
            fill={pointerFill}
          />
        </svg>

        {/* 말풍선 박스 */}
        <div
          className={`
            relative rounded-2xl border px-4 py-3
            min-w-[120px] max-w-xs sm:max-w-sm
            shadow-sm
            ${bubbleStyle}
          `}
        >
          <p
            className="text-sm leading-relaxed text-gray-800 whitespace-pre-wrap"
          >
            {message}
          </p>

          {/* 로딩 타입: 점 애니메이션 */}
          {isLoading && (
            <span className="inline-flex gap-1 mt-1" aria-hidden="true">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce [animation-delay:0ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce [animation-delay:300ms]" />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default MascotMessage;
