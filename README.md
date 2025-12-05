# 그룹웨어 + 업무 메신저 MVP

회사 내부용 그룹웨어 + Slack-lite 메신저 All-in-One 애플리케이션

## 기술 스택

- **Frontend**: Vite + React 18/19 + TypeScript
- **Styling**: Tailwind CSS 3.4+ with custom design system
- **UI Components**: Headless UI + Radix UI + Heroicons
- **Animations**: Framer Motion
- **Backend**: Firebase (Auth, Firestore, Storage, Cloud Functions, Hosting)
- **Deployment**: Vercel (CI/CD, Preview Deployments)

## 기능

### 1. 대시보드
- 오늘 일정 / 결재 대기 / 공지 / 미확인 메시지
- 개인별 할 일(To-Do) + 위젯 시스템

### 2. 전자결재(E-Approval)
- 결재요청 생성(기안) → 팀장 승인 → 대표 승인
- 결재 양식 템플릿(휴가, 지출, 구매, 견적, 계약 등)
- 진행상태: 상신 → 검토 → 승인 → 반려
- PDF 자동 생성 + 이력 저장(Firebase Storage)

### 3. 근태관리
- 출근·퇴근 QR 체크인
- GPS 옵션(반경 100m)
- 월간 근태 캘린더 + 관리자 수정 기능

### 4. 사내 메신저(Slack-lite)
- 1:1 채팅 + 그룹채팅 + 공지방
- 실시간 Firestore Listener 기반 메시징
- 파일·이미지 전송(Storage)
- 이모지 반응, @멘션, 메시지 수정/삭제
- 읽음/안읽음 표시 + 타자 중 표시(typing indicator)

### 5. 캘린더/일정 공유
- 팀 일정, 회의 일정 공유
- Google Calendar 연동 옵션(후속 기능)

### 6. 공지사항·문서함
- 관리자 공지 작성/예약발행
- 사내 문서함(정책, 업무 가이드, 매뉴얼)
- 버전관리 + 권한 부여

### 7. 사내 프로젝트/업무 보드
- Kanban 보드(백로그 → 진행중 → 완료)
- 담당자 배정, 댓글, 파일첨부
- 알림 시스템(Firebase Functions)

### 8. 관리자 페이지(Admin)
- 직원 관리 / 팀 관리 / 권한 설정
- 로그 모니터링 / 시스템 상태 / 스토리지 관리
- 설정: 회사 로고/명칭, 메뉴 ON/OFF, 권한 템플릿

## 설치 및 실행

1. 의존성 설치:
```bash
npm install
```

2. 환경변수 설정 (.env 파일 생성):
```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

3. 개발 서버 실행:
```bash
npm run dev
```

4. 빌드:
```bash
npm run build
```

## 테스트

### 단위 테스트 및 통합 테스트
```bash
# 모든 테스트 실행
npm run test:all

# 단위 테스트만 실행
npm run test:unit

# 통합 테스트만 실행
npm run test:integration

# 테스트 커버리지 확인
npm run test:coverage

# 테스트 감시 모드
npm run test:watch
```

### E2E 테스트
```bash
# E2E 테스트 실행 (헤드리스)
npm run test:e2e

# E2E 테스트 GUI로 실행
npm run test:e2e:open
```

### 린팅
```bash
npm run lint
```

## 배포

### 로컬 배포
```bash
# 프로덕션 빌드
npm run build

# 빌드 분석
npm run build:analyze

# 미리보기 서버 실행
npm run preview
```

### Vercel 배포
1. GitHub 저장소에 푸시
2. Vercel에서 프로젝트 연결
3. 환경변수 설정 (`.env.example` 참고)
4. 자동 배포 트리거

### CI/CD 파이프라인
GitHub Actions를 통해 자동화된 테스트와 배포가 설정되어 있습니다:
- **Push/PR**: 자동 테스트 실행 (린팅, 단위/통합/E2E 테스트)
- **Main 브랜치 Push**: 프로덕션 배포 자동화

필요한 시크릿:
- `VERCEL_TOKEN`: Vercel API 토큰
- `VERCEL_ORG_ID`: Vercel 조직 ID
- `VERCEL_PROJECT_ID`: Vercel 프로젝트 ID
- Firebase 환경변수들

## PWA 및 오프라인 기능

이 애플리케이션은 PWA(Progressive Web App)로 개발되어 오프라인에서도 작동합니다:

- **서비스 워커**: 캐싱 및 오프라인 지원
- **IndexedDB**: 로컬 데이터 저장
- **푸시 알림**: Firebase Cloud Messaging
- **설치 가능**: 모바일/데스크톱에서 앱으로 설치

## 모바일 최적화

- 반응형 디자인 (모바일 우선)
- 터치 제스처 지원
- PWA 설치 지원
- 오프라인 모드
- 푸시 알림

## 성능 최적화

- 코드 스플리팅 (React.lazy)
- 이미지 최적화 (WebP, lazy loading)
- 번들 분석 (`npm run build:analyze`)
- 캐싱 전략 (Service Worker)

```
src/
├── components/
│   ├── atoms/          # 기본 컴포넌트
│   ├── molecules/      # 복합 컴포넌트
│   └── organisms/      # 페이지 레벨 컴포넌트
├── pages/              # 페이지 컴포넌트
├── hooks/              # 커스텀 훅
├── utils/              # 유틸리티 함수
├── types/              # TypeScript 타입 정의
├── firebase/           # Firebase 설정 및 서비스
├── contexts/           # React Context
└── styles/             # 스타일 파일
```

## 배포

- GitHub → Vercel 자동 배포
- Firebase Hosting으로 Admin Console 분리 가능(A/B)

## 개발 가이드라인

- Atomic Design + 재사용성 우선
- Custom Hook 기반 상태 관리
- TypeScript 철저 적용
- Framer Motion으로 애니메이션 구현
- 모바일 우선 반응형 디자인

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
