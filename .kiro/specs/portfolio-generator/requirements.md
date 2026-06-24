# Requirements Document

## Introduction

**CustomPortfolio: 대신취업해줘**는 사용자가 자신의 개인 성과물(깃허브 주소, 프로젝트 링크, 경력 정보 등)을 입력하면 자동으로 세련된 정적 포트폴리오 웹사이트를 생성해주는 서비스이다. 본 서비스의 마스코트는 **커폴이(Cupol)**로, 포트폴리오를 마법처럼 만들어주는 '포폴법사' 캐릭터이다. 커폴이는 서비스 전반에 걸쳐 사용자에게 친숙함과 재미를 제공하며, 로딩 화면, 가이드 메시지, 오류 안내 등 다양한 인터랙션 지점에서 친근한 톤으로 사용자를 안내한다. 사용자는 로그인/회원가입을 통해 서비스에 접근하며, 메인 페이지에서 포트폴리오 생성, 마이페이지, 커뮤니티(공개 포트폴리오 탐색 및 커피챗) 기능에 접근할 수 있다. 현재 단계에서는 프론트엔드 프로토타입으로 구현하며, 백엔드 연동(AI 링크 탐색 등)은 향후 확장 범위이다. 서브 기능으로 기업 인재상 적합도 분석, 포트폴리오 공개/비공개 설정, 커피챗 네트워킹 기능을 포함한다.

## Glossary

- **Portfolio_Generator**: 사용자 입력 데이터를 기반으로 포트폴리오 웹사이트를 자동 생성하는 시스템. 서비스 공식 명칭은 "CustomPortfolio: 대신취업해줘"
- **Cupol_Mascot**: 서비스 마스코트 '커폴이'. 포트폴리오를 마법처럼 만들어주는 '포폴법사' 캐릭터로, 지팡이와 마법사 모자를 착용한 친근한 캐릭터. 사용자 안내, 로딩 화면, 오류 메시지 등에서 등장하여 친근한 톤으로 사용자 경험을 향상시킨다
- **Mascot_Message**: Cupol_Mascot이 사용자에게 전달하는 안내 메시지. 로딩 상태, 가이드, 오류 안내, 축하 등 상황에 맞는 친근한 말투의 텍스트와 커폴이 일러스트를 조합하여 표시한다
- **Auth_Module**: 사용자 인증(로그인, 회원가입, 로그아웃)을 처리하는 모듈
- **Main_Page**: 로그인 후 표시되는 메인 화면으로, 포트폴리오 생성, 마이페이지, 커뮤니티 탐색 기능에 접근할 수 있는 네비게이션 허브
- **Input_Collector**: 사용자로부터 개인 정보, 깃허브 주소, 프로젝트 링크, 경력 정보 등을 수집하는 입력 폼 모듈
- **Site_Builder**: 수집된 데이터를 기반으로 정적 HTML/CSS 포트폴리오 사이트를 생성하는 모듈
- **Template_Engine**: 다양한 디자인 템플릿을 관리하고 적용하는 모듈
- **Fit_Analyzer**: 사용자의 포트폴리오와 기업 인재상을 비교 분석하여 적합도 피드백을 제공하는 모듈
- **Profile_Data**: 사용자의 이름, 소개, 연락처, 기술 스택, 경력, 프로젝트 등 포트폴리오에 표시할 정보의 집합
- **Company_Criteria**: 사용자가 입력한 기업의 인재상/요구 조건 (요구 기술, 경력 연수, 역할 등)
- **Generated_Site**: Site_Builder가 생성한 최종 정적 웹사이트 결과물
- **Fit_Report**: Fit_Analyzer가 생성한 포트폴리오와 기업 인재상 간의 차이 분석 결과
- **Visibility_Controller**: 포트폴리오의 공개/비공개 상태를 관리하는 모듈
- **Public_Portfolio**: 외부 사용자가 URL을 통해 열람할 수 있는 공개 상태의 포트폴리오
- **Private_Portfolio**: 소유자만 열람할 수 있는 비공개 상태의 포트폴리오
- **Coffee_Chat**: 포트폴리오를 방문한 외부 사용자가 소유자에게 비공식 면담(네트워킹)을 요청하는 기능
- **Chat_Request**: 외부 방문자가 포트폴리오 소유자에게 보내는 커피챗 요청 데이터(요청자 이름, 이메일, 소속, 메시지)
- **Community_Page**: 공개 프로필 목록을 탐색하고, 다른 사용자의 프로필 페이지에 방문하여 포트폴리오를 열람하고 커피챗을 요청할 수 있는 페이지
- **User_Profile_Page**: 특정 사용자의 공개 프로필 페이지로, 해당 사용자의 공개 포트폴리오 목록, 기본 정보, 커피챗 요청 버튼을 포함하는 페이지

## Requirements

### Requirement 1: 로그인 및 회원가입

**User Story:** 사용자로서, 구글 계정으로 간편하게 로그인할 수 있기를 원한다. 그래야 별도의 비밀번호 관리 없이 쉽게 서비스에 접근할 수 있기 때문이다.

#### Acceptance Criteria

1. THE Auth_Module SHALL 구글 계정을 이용한 소셜 로그인/회원가입 버튼을 제공한다
2. WHEN 사용자가 구글 로그인 버튼을 클릭하면, THE Auth_Module SHALL 구글 OAuth 인증 화면으로 이동시킨다
3. WHEN 구글 인증이 성공하고 해당 이메일로 기존 계정이 존재하면, THE Auth_Module SHALL 해당 계정으로 로그인하고 사용자 정보(이름, 프로필 사진)를 최신 상태로 갱신한다
4. WHEN 구글 인증이 성공하고 해당 이메일로 기존 계정이 존재하지 않으면, THE Auth_Module SHALL 사용자 정보(이름, 이메일, 프로필 사진)를 가져와 새 계정을 생성하고 로그인한다
5. WHEN 로그인에 성공하면, THE Auth_Module SHALL 2초 이내에 Main_Page로 이동시킨다
6. IF 구글 인증이 실패하거나 사용자가 인증을 취소하면, THEN THE Auth_Module SHALL 로그인 페이지에 머무르며 인증 실패 사유를 나타내는 오류 메시지를 표시한다
7. THE Auth_Module SHALL 로그인된 상태에서 로그아웃 버튼을 제공한다
8. WHEN 사용자가 로그아웃 버튼을 클릭하면, THE Auth_Module SHALL 세션을 무효화하고 로그인 페이지로 이동시킨다
9. IF OAuth 인증 과정에서 네트워크 오류가 발생하면, THEN THE Auth_Module SHALL 로그인 페이지에 머무르며 네트워크 연결 문제를 나타내는 오류 메시지를 표시한다

### Requirement 2: 메인 페이지 및 네비게이션

**User Story:** 사용자로서, 로그인 후 주요 기능에 쉽게 접근할 수 있기를 원한다. 그래야 서비스를 효율적으로 이용할 수 있기 때문이다.

#### Acceptance Criteria

1. WHEN 사용자가 로그인하면, THE Main_Page SHALL 포트폴리오 생성, 마이페이지, 커뮤니티 메뉴를 포함하는 네비게이션을 표시하며, 현재 활성화된 메뉴 항목을 시각적으로 구분하여 표시한다
2. THE Main_Page SHALL "포트폴리오 생성" 메뉴를 통해 포트폴리오 입력 및 생성 화면으로 이동할 수 있는 링크를 제공한다
3. THE Main_Page SHALL "마이페이지" 메뉴를 통해 내 포트폴리오 관리(수정, 공개/비공개 설정, 커피챗 대시보드) 화면으로 이동할 수 있는 링크를 제공한다
4. THE Main_Page SHALL "커뮤니티" 메뉴를 통해 공개 포트폴리오 탐색 및 커피챗 요청 화면으로 이동할 수 있는 링크를 제공한다
5. IF 비인증 사용자가 로그인이 필요한 페이지에 직접 접근하면, THEN THE Portfolio_Generator SHALL 로그인/회원가입 페이지로 리다이렉션한다
6. WHILE 사용자가 로그인된 상태이면, THE Portfolio_Generator SHALL 모든 페이지에서 포트폴리오 생성, 마이페이지, 커뮤니티 메뉴를 포함하는 네비게이션을 일관되게 표시한다

### Requirement 3: 사용자 정보 입력

**User Story:** 개발자로서, 나의 개인 정보와 성과물을 입력할 수 있기를 원한다. 그래야 포트폴리오에 정확한 정보가 반영되기 때문이다.

#### Acceptance Criteria

1. THE Input_Collector SHALL 사용자의 이름(최대 50자), 직함(최대 50자), 자기소개(최대 500자), 연락처(이메일) 정보를 입력받을 수 있는 폼을 제공한다
2. THE Input_Collector SHALL 기술 스택을 태그 형태로 최대 30개까지 입력받을 수 있는 필드를 제공한다
3. THE Input_Collector SHALL 깃허브 프로필 URL을 입력받을 수 있는 필드를 제공한다
4. THE Input_Collector SHALL 프로젝트 정보(제목(최대 100자), 설명(최대 1000자), URL, 사용 기술)를 최대 20개까지 입력받을 수 있는 필드를 제공하며, 항목을 추가하거나 삭제할 수 있는 버튼을 제공한다
5. THE Input_Collector SHALL 경력 정보(회사명(최대 50자), 직위(최대 50자), 기간, 업무 설명(최대 1000자))를 최대 20개까지 입력받을 수 있는 필드를 제공하며, 항목을 추가하거나 삭제할 수 있는 버튼을 제공한다
6. IF 필수 필드(이름)가 비어있는 상태로 제출하면, THEN THE Input_Collector SHALL 해당 필드에 시각적 오류 표시(붉은색 테두리)와 오류 원인을 나타내는 메시지를 표시한다
7. WHEN 사용자가 모든 필수 필드를 채운 상태에서 "저장" 버튼을 클릭하면, THE Input_Collector SHALL 입력된 데이터를 Profile_Data로 저장하고 저장 완료 메시지를 표시한다
8. IF 기술 스택 태그가 최대 개수(30개)에 도달한 상태에서 추가 입력을 시도하면, THEN THE Input_Collector SHALL 더 이상 추가할 수 없음을 나타내는 메시지를 표시한다

### Requirement 4: 포트폴리오 사이트 생성

**User Story:** 개발자로서, 입력한 정보를 바탕으로 자동으로 포트폴리오 웹사이트가 생성되기를 원한다. 그래야 웹 개발 지식 없이도 멋진 포트폴리오를 가질 수 있기 때문이다.

#### Acceptance Criteria

1. WHEN 사용자가 "생성" 버튼을 클릭하면, THE Site_Builder SHALL Profile_Data를 기반으로 정적 HTML/CSS 포트폴리오 사이트를 10초 이내에 생성하고, 생성 진행 중임을 나타내는 로딩 표시를 화면에 표시한다
2. THE Generated_Site SHALL 반응형 디자인을 적용하여 뷰포트 너비 320px 이상에서 콘텐츠가 잘리거나 수평 스크롤 없이 레이아웃이 조정되어 표시된다
3. THE Generated_Site SHALL 다음 섹션을 포함한다: 프로필 소개, 기술 스택, 프로젝트 목록, 경력 사항, 연락처. 단, 해당 섹션의 데이터가 입력되지 않은 경우 해당 섹션은 생성된 사이트에서 생략한다
4. WHEN 사이트 생성이 완료되면, THE Site_Builder SHALL 생성된 사이트의 미리보기를 화면에 표시한다
5. WHEN 사이트 생성이 완료되면, THE Site_Builder SHALL 생성된 HTML 파일을 다운로드할 수 있는 버튼을 제공한다
6. IF 깃허브 URL이 Profile_Data에 포함되어 있으면, THEN THE Generated_Site SHALL 해당 URL을 프로필 섹션에 클릭 가능한 하이퍼링크로 표시한다
7. IF 사이트 생성 중 오류가 발생하면, THEN THE Site_Builder SHALL 로딩 표시를 제거하고, 생성에 실패했음을 알리는 오류 메시지를 표시하며, 사용자가 입력한 Profile_Data를 유지한다

### Requirement 5: 템플릿 선택 및 커스터마이징

**User Story:** 개발자로서, 다양한 디자인 템플릿 중 원하는 것을 선택하고 색상을 조정할 수 있기를 원한다. 그래야 나만의 개성을 표현할 수 있기 때문이다.

#### Acceptance Criteria

1. THE Template_Engine SHALL 최소 3개 이상의 디자인 템플릿을 각각 이름과 썸네일 이미지를 포함하여 목록으로 제공한다
2. THE Template_Engine SHALL 사용자가 템플릿을 선택하지 않은 경우 첫 번째 템플릿을 기본 선택 상태로 적용한다
3. WHEN 사용자가 템플릿을 선택하면, THE Template_Engine SHALL 2초 이내에 해당 템플릿의 미리보기를 표시한다
4. THE Template_Engine SHALL 사용자가 주요 색상(Primary Color)과 보조 색상(Secondary Color)을 변경할 수 있는 색상 선택기를 제공한다
5. THE Template_Engine SHALL 사용자가 폰트 스타일(Serif, Sans-serif, Monospace)을 선택할 수 있는 설정을 제공한다
6. WHEN 사용자가 색상이나 폰트를 변경하면, THE Template_Engine SHALL 2초 이내에 변경 결과를 미리보기에 반영한다
7. IF 색상 선택기에서 유효하지 않은 색상값이 입력되면, THEN THE Template_Engine SHALL 해당 필드를 강조 표시하고 유효한 색상값 입력을 안내하는 오류 메시지를 표시한다

### Requirement 6: 기업 인재상 적합도 분석

**User Story:** 개발자로서, 내가 원하는 기업의 인재상과 나의 포트폴리오가 얼마나 일치하는지 피드백을 받고 싶다. 그래야 부족한 부분을 보완하여 취업 경쟁력을 높일 수 있기 때문이다.

#### Acceptance Criteria

1. THE Fit_Analyzer SHALL 기업의 인재상 정보(요구 기술 스택, 최소 경력 연수, 선호 역할, 기타 요구사항)를 입력받을 수 있는 폼을 제공한다
2. WHEN 사용자가 Company_Criteria를 입력하고 "분석" 버튼을 클릭하면, THE Fit_Analyzer SHALL 5초 이내에 Profile_Data와 Company_Criteria를 비교 분석하여 결과를 표시한다
3. WHEN 비교 분석이 완료되면, THE Fit_Analyzer SHALL 기술 스택 일치율을 0%~100% 범위의 백분율로 표시한다
4. WHEN 비교 분석이 완료되면, THE Fit_Analyzer SHALL 부족한 기술 스택 목록을 표시한다
5. WHEN 비교 분석이 완료되면, THE Fit_Analyzer SHALL 경력 요구사항 충족 여부를 충족/미충족으로 표시한다
6. WHEN 비교 분석이 완료되면, THE Fit_Analyzer SHALL 전체 적합도 점수를 0%~100% 범위의 시각적 게이지로 표시한다
7. WHEN 비교 분석이 완료되면, THE Fit_Analyzer SHALL 분석 결과를 바탕으로 최소 1개 이상의 포트폴리오 개선 제안 사항을 텍스트로 제공한다
8. IF 사용자의 Profile_Data에 기술 스택 또는 경력 정보가 입력되지 않은 상태에서 "분석" 버튼을 클릭하면, THEN THE Fit_Analyzer SHALL 포트폴리오 정보를 먼저 입력하라는 안내 메시지를 표시하고 분석을 수행하지 않는다
9. IF Company_Criteria의 요구 기술 스택이 1개 이상 입력되지 않은 상태에서 "분석" 버튼을 클릭하면, THEN THE Fit_Analyzer SHALL 해당 필드를 강조 표시하고 필수 입력 항목임을 안내한다

### Requirement 7: 포트폴리오 공개/비공개 설정

**User Story:** 개발자로서, 포트폴리오를 공개 또는 비공개로 설정할 수 있기를 원한다. 그래야 준비가 된 포트폴리오만 외부에 공개하고, 작업 중인 포트폴리오는 나만 볼 수 있기 때문이다.

#### Acceptance Criteria

1. THE Visibility_Controller SHALL 포트폴리오를 Public(공개) 또는 Private(비공개)으로 설정할 수 있는 토글을 제공한다
2. WHEN 포트폴리오가 Public으로 설정되면, THE Visibility_Controller SHALL 외부 사용자가 접근할 수 있는 공유 URL을 생성한다
3. WHILE 포트폴리오가 Private 상태이면, IF 외부 사용자가 공유 URL로 접근하면, THEN THE Visibility_Controller SHALL 접근이 제한된 비공개 포트폴리오임을 안내하는 메시지를 표시하고 포트폴리오 내용을 노출하지 않는다
4. THE Visibility_Controller SHALL 기본값으로 Private(비공개) 상태를 설정한다
5. WHEN 사용자가 공개 상태를 변경하면, THE Visibility_Controller SHALL 현재 상태를 Public 또는 Private 레이블과 구분 가능한 시각적 표시기(색상 또는 아이콘)로 표시하고, 변경 완료 확인 피드백을 제공한다
6. WHILE 포트폴리오가 Private 상태이면, IF 소유자가 해당 포트폴리오에 접근하면, THEN THE Visibility_Controller SHALL 포트폴리오 내용을 정상적으로 표시한다
7. WHEN 포트폴리오가 Public에서 Private으로 변경되면, THE Visibility_Controller SHALL 기존 공유 URL을 통한 외부 접근을 즉시 차단한다

### Requirement 8: 커뮤니티 및 커피챗 요청

**User Story:** 개발자로서, 다른 사용자의 프로필을 방문하여 공개된 포트폴리오를 열람하고 커피챗을 요청할 수 있기를 원한다. 그래야 원하는 직무나 기업의 관계자와 네트워킹 기회를 만들 수 있기 때문이다.

#### Acceptance Criteria

1. THE Community_Page SHALL 공개 프로필을 가진 사용자 목록을 카드 형태로 한 페이지당 최대 12개씩 표시하고, 추가 결과가 있을 경우 페이지네이션을 제공한다
2. THE Community_Page SHALL 사용자 목록을 직무(직함)별로 필터링할 수 있는 기능을 제공한다
3. THE Community_Page SHALL 사용자 목록을 기업(소속 회사)별로 필터링할 수 있는 기능을 제공한다
4. THE Community_Page SHALL 사용자 목록을 기술 스택별로 필터링할 수 있는 기능을 제공한다
5. WHEN 사용자가 특정 프로필 카드를 클릭하면, THE Community_Page SHALL 해당 사용자의 User_Profile_Page로 이동한다
6. THE User_Profile_Page SHALL 해당 사용자의 이름, 직함, 자기소개, 프로필 사진을 표시한다
7. THE User_Profile_Page SHALL 해당 사용자의 공개된 모든 포트폴리오를 목록으로 표시한다
8. WHEN 사용자가 포트폴리오 항목을 클릭하면, THE User_Profile_Page SHALL 해당 Generated_Site를 열람할 수 있도록 한다
9. IF 로그인한 사용자가 자신의 User_Profile_Page를 방문하면, THEN THE User_Profile_Page SHALL "커피챗 요청" 버튼을 표시하지 않는다
10. WHILE 사용자가 로그인한 상태이고 타인의 User_Profile_Page를 방문한 경우, THE User_Profile_Page SHALL "커피챗 요청" 버튼을 제공한다
11. WHEN 사용자가 "커피챗 요청" 버튼을 클릭하면, THE Portfolio_Generator SHALL 요청자 이름, 이메일, 소속, 메시지(최대 500자)를 입력받는 Chat_Request 폼을 표시한다
12. IF Chat_Request 폼에서 필수 필드(이름, 이메일, 메시지)가 비어있는 상태로 제출하면, THEN THE Portfolio_Generator SHALL 해당 필드를 강조 표시하고 오류 메시지를 표시한다
13. WHEN 커피챗 요청 폼이 제출되면, THE Portfolio_Generator SHALL 프로필 소유자의 커피챗 대시보드에 요청 내역을 추가한다
14. THE Portfolio_Generator SHALL 마이페이지에서 받은 커피챗 요청 목록을 확인할 수 있는 대시보드를 제공하며, 각 요청에 요청자 이름, 소속, 메시지, 요청 일시를 표시한다
15. THE Portfolio_Generator SHALL 커피챗 요청에 대해 수락 또는 거절 응답을 할 수 있는 기능을 제공한다
16. WHEN 프로필 소유자가 요청을 수락하면, THE Portfolio_Generator SHALL 요청자에게 수락 알림과 함께 소유자의 이메일 연락처를 전달한다
17. WHEN 프로필 소유자가 요청을 거절하면, THE Portfolio_Generator SHALL 요청자에게 거절 알림을 전달한다

### Requirement 9: 데이터 직렬화 및 복원

**User Story:** 개발자로서, 입력한 데이터를 저장하고 나중에 불러올 수 있기를 원한다. 그래야 반복 작업 없이 포트폴리오를 수정할 수 있기 때문이다.

#### Acceptance Criteria

1. THE Input_Collector SHALL Profile_Data의 모든 필드(이름, 직함, 자기소개, 연락처, 기술 스택, 깃허브 URL, 프로젝트 목록, 경력 목록)를 JSON 형식의 파일로 내보내기(Export)할 수 있는 기능을 제공한다
2. THE Input_Collector SHALL JSON 파일을 가져오기(Import)하여 입력 폼의 모든 필드에 데이터를 복원하는 기능을 제공한다
3. WHEN 유효한 Profile_Data가 포함된 JSON 파일을 가져오기하면, THE Input_Collector SHALL 기존 입력 폼의 데이터를 가져온 데이터로 덮어쓰고, 모든 필드가 내보내기 시점의 원본 데이터와 동일하게 표시한다
4. IF JSON 구문이 올바르지 않은 파일을 가져오기하면, THEN THE Input_Collector SHALL 오류 메시지를 표시하고 기존 입력 폼의 데이터를 유지한다
5. IF JSON 구문은 올바르나 Profile_Data의 필수 필드(이름)가 누락된 파일을 가져오기하면, THEN THE Input_Collector SHALL 오류 메시지를 표시하고 기존 입력 폼의 데이터를 유지한다
6. WHEN 가져오기에 실패하면, THE Input_Collector SHALL 가져오기 이전의 입력 폼 상태를 그대로 보존한다

### Requirement 10: 입력 데이터 검증

**User Story:** 개발자로서, 입력한 데이터가 올바르게 검증되기를 원한다. 그래야 생성된 포트폴리오에 정확한 정보가 표시되기 때문이다.

#### Acceptance Criteria

1. WHEN 사용자가 URL 필드(깃허브 프로필 URL, 프로젝트 URL)에서 포커스를 이동하면, THE Input_Collector SHALL 해당 값이 프로토콜(http:// 또는 https://)을 포함한 유효한 URL 형식인지 검증한다
2. WHEN 사용자가 이메일 필드(연락처 이메일)에서 포커스를 이동하면, THE Input_Collector SHALL 해당 값이 "local@domain.tld" 구조를 충족하는 유효한 이메일 형식인지 검증한다
3. IF URL 필드의 값이 유효한 URL 형식을 충족하지 않으면, THEN THE Input_Collector SHALL 해당 필드 하단에 올바른 URL 형식을 안내하는 오류 메시지를 표시하고, 해당 필드를 시각적으로 강조한다
4. IF 이메일 필드의 값이 유효한 이메일 형식을 충족하지 않으면, THEN THE Input_Collector SHALL 해당 필드 하단에 올바른 이메일 형식을 안내하는 오류 메시지를 표시하고, 해당 필드를 시각적으로 강조한다
5. WHEN 사용자가 검증 오류가 표시된 필드의 값을 유효한 형식으로 수정하면, THE Input_Collector SHALL 해당 필드의 오류 메시지와 시각적 강조를 즉시 제거한다
6. IF URL 또는 이메일 필드에 검증 오류가 존재하는 상태에서 사용자가 폼을 제출하면, THEN THE Input_Collector SHALL 제출을 차단하고 첫 번째 오류 필드로 포커스를 이동한다

### Requirement 11: 마스코트 커폴이를 활용한 사용자 경험

**User Story:** 사용자로서, 서비스를 이용하는 동안 마스코트 커폴이가 친근하게 안내해주기를 원한다. 그래야 딱딱한 도구가 아닌 재미있고 친숙한 경험으로 포트폴리오를 만들 수 있기 때문이다.

#### Acceptance Criteria

1. WHEN 포트폴리오 생성 로딩이 진행 중이면, THE Portfolio_Generator SHALL Cupol_Mascot 일러스트와 함께 마법을 부리는 애니메이션 또는 정적 이미지를 표시하고, "커폴이가 포폴 마법을 시전하고 있어요!" 스타일의 Mascot_Message를 표시한다
2. WHEN 사용자가 포트폴리오 생성 흐름의 각 단계(정보 입력, 템플릿 선택, 생성 완료)에 진입하면, THE Portfolio_Generator SHALL 해당 단계에 적합한 Cupol_Mascot 가이드 메시지를 화면 상단 또는 사이드에 표시한다
3. WHEN 포트폴리오 생성이 성공적으로 완료되면, THE Portfolio_Generator SHALL Cupol_Mascot 축하 일러스트와 함께 "짜잔! 커폴이가 멋진 포폴을 완성했어요!" 스타일의 Mascot_Message를 표시한다
4. IF 사용자 조작으로 인해 오류가 발생하면(필수 필드 미입력, 유효하지 않은 형식 등), THEN THE Portfolio_Generator SHALL 기존 오류 메시지와 함께 Cupol_Mascot 일러스트를 표시하고, "앗, 여기를 한번 확인해볼래요?" 스타일의 친근한 톤으로 오류 원인을 안내한다
5. IF 시스템 오류가 발생하면(네트워크 오류, 생성 실패 등), THEN THE Portfolio_Generator SHALL Cupol_Mascot 일러스트와 함께 "앗, 마법이 잠깐 꼬였어요. 다시 시도해볼게요!" 스타일의 Mascot_Message를 표시하고, 재시도 버튼을 제공한다
6. WHEN 사용자가 서비스에 처음 로그인하면, THE Portfolio_Generator SHALL Cupol_Mascot 환영 일러스트와 함께 서비스 주요 기능을 간략히 소개하는 온보딩 Mascot_Message를 1회 표시한다
7. THE Portfolio_Generator SHALL Mascot_Message를 표시할 때 Cupol_Mascot 일러스트 영역(최소 48x48px)과 메시지 텍스트 영역을 시각적으로 구분하여 말풍선 형태로 표시한다
8. THE Portfolio_Generator SHALL Mascot_Message의 톤을 반말체의 친근하고 격려하는 말투로 일관되게 유지한다
