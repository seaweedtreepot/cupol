/**
 * 커뮤니티 데모 데이터
 * 데모 유저의 프로필 + 포트폴리오를 생성하여 커뮤니티 탐색 흐름을 시연한다.
 */

import type { ProfileData } from '@/types';

export interface DemoProfileSeed {
  userId: string;
  name: string;
  title: string;
  company: string;
  skills: string[];
  bio: string;
}

export const DEMO_PROFILE_SEEDS: DemoProfileSeed[] = [
  { userId: 'demo-1', name: '김민준', title: '프론트엔드 개발자', company: '네이버', skills: ['React', 'TypeScript', 'Next.js'], bio: '5년차 프론트엔드 개발자로 React와 TypeScript를 주로 사용합니다. 사용자 경험에 관심이 많아요.' },
  { userId: 'demo-2', name: '이서연', title: '백엔드 개발자', company: '카카오', skills: ['Java', 'Spring', 'MySQL'], bio: '안정적인 서버 아키텍처 설계를 좋아하는 백엔드 개발자입니다.' },
  { userId: 'demo-3', name: '박지훈', title: '풀스택 개발자', company: '라인', skills: ['Vue', 'Node.js', 'PostgreSQL'], bio: '기획부터 배포까지 전 과정을 다루는 풀스택 개발자입니다.' },
  { userId: 'demo-4', name: '최수아', title: 'UI/UX 디자이너', company: '토스', skills: ['Figma', 'Sketch', 'React'], bio: '디자인과 개발의 경계를 넘나드는 디자이너-개발자입니다.' },
  { userId: 'demo-5', name: '정현우', title: 'DevOps 엔지니어', company: 'AWS', skills: ['Docker', 'Kubernetes', 'Terraform'], bio: '인프라 자동화와 CI/CD 파이프라인 구축이 전문입니다.' },
  { userId: 'demo-6', name: '한지수', title: '데이터 엔지니어', company: '쿠팡', skills: ['Python', 'Spark', 'Airflow'], bio: '대용량 데이터 파이프라인을 설계하고 운영합니다.' },
  { userId: 'demo-7', name: '오승민', title: '모바일 개발자', company: '당근마켓', skills: ['Swift', 'Kotlin', 'Flutter'], bio: 'iOS/Android 네이티브와 크로스플랫폼 앱을 개발합니다.' },
  { userId: 'demo-8', name: '임유나', title: '데이터 사이언티스트', company: '네이버', skills: ['Python', 'TensorFlow', 'PyTorch'], bio: '머신러닝 모델 연구와 서비스 적용을 담당합니다.' },
  { userId: 'demo-9', name: '신재현', title: '백엔드 개발자', company: '배달의민족', skills: ['Go', 'gRPC', 'Redis'], bio: '고성능 분산 시스템을 다루는 백엔드 개발자입니다.' },
  { userId: 'demo-10', name: '윤미래', title: '프론트엔드 개발자', company: '토스', skills: ['React', 'Redux', 'GraphQL'], bio: '복잡한 상태 관리와 디자인 시스템 구축에 강합니다.' },
  { userId: 'demo-11', name: '강태양', title: '클라우드 아키텍트', company: 'NHN', skills: ['AWS', 'GCP', 'Terraform'], bio: '멀티 클라우드 아키텍처 설계 전문가입니다.' },
  { userId: 'demo-12', name: '백서진', title: '풀스택 개발자', company: '카카오', skills: ['React', 'Django', 'PostgreSQL'], bio: '빠른 프로토타이핑과 안정적 운영을 모두 추구합니다.' },
  { userId: 'demo-13', name: '황민호', title: '시스템 프로그래머', company: '삼성전자', skills: ['C++', 'Linux', 'Assembly'], bio: '저수준 시스템 최적화와 임베디드 개발이 전문입니다.' },
  { userId: 'demo-14', name: '문채원', title: '보안 엔지니어', company: 'SK텔레콤', skills: ['Python', 'Penetration Testing', 'SIEM'], bio: '웹/네트워크 보안 진단과 대응을 담당합니다.' },
  { userId: 'demo-15', name: '류진성', title: '게임 개발자', company: 'NC소프트', skills: ['C#', 'Unity', 'Unreal'], bio: '몰입감 있는 게임 경험을 만드는 게임 개발자입니다.' },
];

/** 데모 유저 시드를 완전한 ProfileData로 변환 */
export function demoProfileToProfileData(seed: DemoProfileSeed): ProfileData {
  return {
    id: `${seed.userId}-portfolio`,
    userId: seed.userId,
    name: seed.name,
    title: seed.title,
    bio: seed.bio,
    email: `${seed.userId}@example.com`,
    skills: seed.skills,
    githubUrl: `https://github.com/${seed.userId}`,
    projects: [
      {
        id: `${seed.userId}-proj-1`,
        title: `${seed.company} 사내 프로젝트`,
        description: `${seed.title}로서 ${seed.skills[0]} 기반 서비스를 설계하고 개발했습니다.`,
        url: 'https://example.com',
        technologies: seed.skills.slice(0, 2),
      },
      {
        id: `${seed.userId}-proj-2`,
        title: '사이드 프로젝트',
        description: `${seed.skills.join(', ')}을(를) 활용한 개인 프로젝트입니다.`,
        url: 'https://example.com',
        technologies: seed.skills,
      },
    ],
    experiences: [
      {
        id: `${seed.userId}-exp-1`,
        company: seed.company,
        position: seed.title,
        startDate: '2021-03',
        endDate: 'present',
        description: `${seed.company}에서 ${seed.title}로 근무 중입니다.`,
      },
    ],
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  };
}

/** userId로 데모 ProfileData 조회 (없으면 null) */
export function getDemoProfileData(userId: string): ProfileData | null {
  const seed = DEMO_PROFILE_SEEDS.find((s) => s.userId === userId);
  return seed ? demoProfileToProfileData(seed) : null;
}
