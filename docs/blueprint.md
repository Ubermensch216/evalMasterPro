# EvalMaster Pro — 시스템 설계 및 아키텍처 문서

## 1. 개요
**EvalMaster Pro(이발마스터 프로)**는 다수의 평가위원이 실시간으로 대상자를 채점하고, 관리자가 평가 기준·위원·대상자·잠금 상태를 관리하며, 종합 순위 및 공식 인쇄 보고서를 즉시 생성할 수 있는 Next.js + Firebase Firestore 기반 실시간 평가·집계 웹 애플리케이션입니다.

---

## 2. 핵심 기능 및 라우트

### 2.1 홈 (`/`)
- 시스템명(`systemName`) 및 세 가지 역할별 진입 카드 제공:
  - **평가 위원** (`/evaluate`)
  - **관리자** (`/admin`)
  - **채점 결과** (`/results`)

### 2.2 평가 위원 채점 (`/evaluate`)
- **위원 인증**: 등록된 평가위원 목록(`createdAt` 오름차순)에서 본인 이름을 선택하고 비밀번호를 입력해 로그인합니다.
- **실시간 채점 (`ScoringDashboard`, `CandidateScorePanel`)**:
  - 평가 대상자별 아코디언 목록에서 채점 상태(`미채점`, `저장됨`, `수정 불가`)를 아이콘으로 표시합니다.
  - 평가 항목별 **슬라이더**로 `0 ~ maxScore` 범위의 점수를 조절하며, 우측 점수 박스는 읽기 전용으로 현재 선택 점수를 표시합니다.
  - 대상자별로 최대 `300`자의 **기타 의견**을 입력할 수 있습니다.
  - **저장하기** 버튼 클릭 시 확인 팝업을 거쳐 Firestore에 저장됩니다.
- **채점 내역 확인 (`ScoringSummaryView`)**:
  - 하단 **채점 내역 확인** 버튼으로 전체 대상자의 항목별 점수, 총점, 기타 의견을 한눈에 조회하는 모달을 제공합니다.
- **최종 평가 완료**:
  - 하단 **최종 평가 완료** 버튼으로 본인의 `scoringLocked` 상태를 `true`로 전환하여 추가 수정을 잠급니다(해제는 관리자만 가능).

### 2.3 관리자 대시보드 (`/admin`)
- **이원화 인증 (`AdminLogin`)**: 일반 관리자 비밀번호 또는 비상 복구용 슈퍼 마스터 비밀번호(`0132`)로 접속합니다.
- **5개 관리 탭 (`AdminDashboard`)**:
  1. **결과 집계 (`ResultAggregation`)**:
     - 종합 순위표(`ResultsTable showDetails`) 및 평가위원별 세부 점수 보기 모달 제공
     - 평가위원별 공식 A4 채점 결과 보고서(`PrintableView`) 미리보기 및 인쇄 팝업(`openEvaluatorPrintWindow`) — 하단 평가위원 성명 및 서명란 포함
  2. **평가 위원 (`EvaluatorManager`)**: 평가위원 추가/수정/삭제(관련 점수·의견 연쇄 삭제) 및 개별 **채점 잠금** 스위치 제어
  3. **평가 대상자 (`CandidateManager`)**: 대상자 추가/수정/삭제(관련 점수·의견 연쇄 삭제)
  4. **평가 항목 (`ItemManager`)**: 평가 항목명 및 배점(`maxScore`) 추가/수정/삭제(관련 점수 연쇄 삭제)
  5. **시스템 설정 (`SettingsPanel`, `PasswordSettingCard`)**:
     - 시스템 이름 변경
     - 관리자 비밀번호 변경 및 초기화
     - 결과 페이지 비밀번호 변경 및 초기화
     - 전체 평가위원 채점 수정 권한 일괄 잠금/해제 (`allowScoreModification`)
     - 시스템 전체 데이터 초기화(초기 샘플 데이터 재시딩)

### 2.4 채점 결과 조회 (`/results`)
- **접근 보호 (`ResultsLogin`)**: 결과 열람 전용 비밀번호(또는 슈퍼 비밀번호 `0132`) 입력 후 접속합니다.
- **종합 순위표 (`ResultsTable`)**: 평가 대상자별 순위, 이름, 총점, 평균 점수를 실시간으로 표시합니다(위원별 상세 점수 팝업은 관리자 페이지에서만 제공).

---

## 3. 코드 구조 및 모듈 아키텍처

```text
src/
├── types/
│   └── evaluation.ts            # 도메인 타입 및 상수 (Evaluator, Candidate, EvaluationItem, Score, Comment 등)
├── lib/
│   ├── firebase.ts              # Firebase / Firestore 초기화 및 설정 감지 (`isFirebaseConfigured`)
│   ├── demoStore.ts             # 로컬 데모 모드용 시드 및 localStorage/BroadcastChannel 동기화 유틸리티
│   ├── store.tsx                # StoreProvider / useStore (Firestore 실시간 구독 + 로컬 데모 모드 자동 폴백)
│   ├── evaluation.ts            # 순수 계산 로직 (순위/평균 집계, 고아 점수 필터링, 위원별 보고서 데이터 빌드, HTML 이스케이프)
│   ├── printReport.ts           # 평가위원별 A4 인쇄 팝업 생성 유틸리티
│   ├── utils.ts                 # Tailwind 클래스 병합 유틸리티 (cn)
│   └── __tests__/               # 도메인 및 데모 스토어 단위 테스트
├── components/
│   ├── common/                  # Logo, PageHeader, PageLoadingSkeleton, PasswordLoginCard, ConfirmActionDialog, PermissionErrorDisplay, DemoModeBanner
│   ├── admin/                   # AdminDashboard, AdminLogin, ResultAggregation, PrintableView, EvaluatorManager, CandidateManager, ItemManager, SettingsPanel, PasswordSettingCard, AdminTableActions, EntityDialog
│   ├── evaluate/                # EvaluatorLogin, ScoringDashboard, CandidateScorePanel, ScoringSummaryView
│   ├── results/                 # ResultsLogin, ResultsTable
│   └── ui/                      # Radix UI 기반 shadcn/ui 공용 UI 컴포넌트
└── app/                         # Next.js App Router 페이지 (/, /evaluate, /admin, /results)
scripts/
└── package.mjs                  # Next.js standalone 기반 심사·배포용 ZIP 패키지 생성 스크립트
Dockerfile / docker-compose.yml  # 멀티스테이지 컨테이너 빌드 및 원커맨드 실행 구성
```

---

## 4. Firestore 데이터 모델
- `evaluators/{id}`: `{ name, password, scoringLocked, createdAt }`
- `candidates/{id}`: `{ name, createdAt }`
- `items/{id}`: `{ name, maxScore }`
- `scores/{candidateId-evaluatorId-evaluationItemId}`: `{ candidateId, evaluatorId, evaluationItemId, score }`
- `comments/{candidateId-evaluatorId}`: `{ candidateId, evaluatorId, commentText }`
- `settings/admin`: `{ password, resultsPassword, systemName, allowScoreModification }`

> **무결성 보장**: 점수 저장 시 결정적 문서 ID(`${candidateId}-${evaluatorId}-${evaluationItemId}`)를 사용해 동시 저장 중복을 방지하며, 평가위원·대상자·항목 삭제 시 연관 `scores`/`comments` 문서를 청크 단위 배치(`450`건 단위)로 연쇄 삭제합니다.

---

## 5. 스타일 가이드라인
- **Primary Color**: Deep Blue (`hsl(231 48% 48%)` / `#3F51B5`) — 신뢰성·안정성 강조
- **Background Color**: Light Gray (`hsl(0 0% 96.1%)` / `#F5F5F5`) — 가독성 높은 중립 배경
- **Accent Color**: Soft Amber (`hsl(42 100% 50%)` / `#FFB300`) — 강조 요소
- **Destructive Color**: Red (`hsl(0 84.2% 60.2%)`) — 잠금, 삭제, 초기화 등 주의 동작
- **Typography**: `'PT Sans', sans-serif`
- **Icons**: `lucide-react` 기반의 일관된 라인 아이콘 사용
