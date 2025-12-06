# 개발자 가이드

## 개발 환경 설정

### 필수 요구사항

- **Node.js**: 18.0.0 이상
- **npm**: 8.0.0 이상
- **Git**: 2.30.0 이상
- **VS Code**: 권장 (ESLint, Prettier, TypeScript 확장 설치)

### 권장 확장 프로그램

```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-json",
    "christian-kohler.path-intellisense",
    "ms-vscode.vscode-css-peek",
    "formulahendry.auto-rename-tag",
    "ms-vscode.vscode-css-intellisense"
  ]
}
```

## 프로젝트 구조

```
src/
├── components/           # 재사용 가능한 UI 컴포넌트
│   ├── atoms/           # 기본 컴포넌트 (Button, Input 등)
│   ├── molecules/       # 복합 컴포넌트 (Card, Form 등)
│   ├── organisms/       # 페이지 레벨 컴포넌트 (Header, Sidebar 등)
│   ├── admin/           # 관리자 전용 컴포넌트
│   └── atoms/
│       ├── __tests__/   # 컴포넌트 단위 테스트
│       └── NotificationBell.test.tsx
├── pages/               # 페이지 컴포넌트
│   ├── __tests__/       # 페이지 통합 테스트
│   └── Dashboard.integration.test.tsx
├── hooks/               # 커스텀 React 훅
│   ├── useAuth.ts       # 인증 관련 훅
│   ├── useCalendar.ts   # 캘린더 관련 훅
│   ├── useChat.ts       # 채팅 관련 훅
│   └── useTasks.ts      # 업무 관련 훅
├── contexts/            # React Context Providers
│   └── AuthContext.tsx  # 인증 컨텍스트
├── firebase/            # Firebase 설정 및 서비스
│   ├── config.ts        # Firebase 초기화
│   ├── services.ts      # 범용 서비스 함수
│   ├── calendarServices.ts # 캘린더 서비스
│   ├── approvalServices.ts # 결재 서비스
│   └── notificationServices.ts # 알림 서비스
├── types/               # TypeScript 타입 정의
│   └── index.ts         # 모든 타입 export
├── utils/               # 유틸리티 함수
│   ├── offlineStorage.ts # 오프라인 저장소
│   └── withMemo.tsx     # 메모이제이션 헬퍼
├── styles/              # 스타일 파일
│   └── index.css        # 글로벌 스타일
├── __mocks__/           # 테스트 모킹 파일
│   └── fileMock.js      # 파일 모킹
└── setupTests.ts        # 테스트 설정
```

## 코딩 컨벤션

### TypeScript

#### 타입 정의
```typescript
// 인터페이스명은 PascalCase
interface User {
  id: string;
  email: string;
  displayName: string;
  role: 'admin' | 'manager' | 'employee';
  createdAt: Date;
  updatedAt: Date;
}

// 유니온 타입은 PascalCase
type UserRole = 'admin' | 'manager' | 'employee';

// 제네릭 타입 사용
interface ApiResponse<T> {
  data: T;
  error?: string;
  loading: boolean;
}
```

#### 컴포넌트 타입
```typescript
interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onClick?: () => void;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  onClick
}) => {
  // 컴포넌트 구현
};
```

### React 컴포넌트

#### 함수형 컴포넌트 패턴
```typescript
import React, { useState, useEffect, memo } from 'react';

interface ComponentProps {
  // props 타입 정의
}

const Component: React.FC<ComponentProps> = memo(({ prop1, prop2 }) => {
  // 상태 및 이펙트
  const [state, setState] = useState(initialValue);

  useEffect(() => {
    // 사이드 이펙트
  }, [dependencies]);

  // 이벤트 핸들러
  const handleEvent = useCallback(() => {
    // 이벤트 처리
  }, []);

  return (
    <div>
      {/* JSX */}
    </div>
  );
});

Component.displayName = 'Component';

export default Component;
```

#### 커스텀 훅 패턴
```typescript
import { useState, useEffect, useCallback } from 'react';

interface UseCustomHookReturn {
  data: any;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useCustomHook = (param: string): UseCustomHookReturn => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const result = await apiCall(param);
      setData(result);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [param]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
};
```

### 파일 및 폴더 네이밍

- **컴포넌트 파일**: `PascalCase.tsx` (예: `UserProfile.tsx`)
- **훅 파일**: `camelCase.ts` (예: `useAuth.ts`)
- **서비스 파일**: `camelCase.ts` (예: `userServices.ts`)
- **유틸리티 파일**: `camelCase.ts` (예: `dateUtils.ts`)
- **타입 파일**: `index.ts` (폴더당 하나)
- **테스트 파일**: `ComponentName.test.tsx`

### 스타일링

#### Tailwind CSS 클래스 순서
```typescript
<div
  className="
    // 포지셔닝
    relative
    // 디스플레이 및 박스 모델
    flex flex-col
    // 공간
    p-4 m-2
    // 크기
    w-full h-auto
    // 타이포그래피
    text-lg font-bold text-gray-900
    // 배경
    bg-white
    // 테두리
    border border-gray-300 rounded-lg
    // 이펙트
    shadow-md hover:shadow-lg
    // 트랜지션
    transition-shadow duration-200
  "
>
```

#### CSS 변수 사용
```css
/* styles/index.css */
:root {
  --color-primary: #3b82f6;
  --color-secondary: #64748b;
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 3rem;
}
```

## 상태 관리

### 로컬 상태 (useState)
단순한 컴포넌트 상태에 사용:
```typescript
const [formData, setFormData] = useState({
  title: '',
  description: '',
  completed: false,
});
```

### 서버 상태 (커스텀 훅)
API 호출 및 서버 상태 관리:
```typescript
const { data, loading, error, refetch } = useCustomData(id);
```

### 전역 상태 (Context)
사용자 인증, 테마 설정 등 앱 전체 상태:
```typescript
const { user, login, logout } = useAuth();
```

## 데이터 fetching

### Firebase 실시간 리스너
```typescript
import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';

export const useRealtimeData = (collectionName: string, userId?: string) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let q = collection(db, collectionName);

    if (userId) {
      q = query(q, where('userId', '==', userId));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setData(items);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [collectionName, userId]);

  return { data, loading };
};
```

## 에러 처리

### API 에러 처리
```typescript
try {
  const result = await apiCall(params);
  return result;
} catch (error) {
  console.error('API Error:', error);

  if (error.code === 'permission-denied') {
    throw new Error('권한이 없습니다.');
  }

  if (error.code === 'not-found') {
    throw new Error('데이터를 찾을 수 없습니다.');
  }

  throw new Error('알 수 없는 오류가 발생했습니다.');
}
```

### UI 에러 처리
```typescript
const [error, setError] = useState<string | null>(null);

const handleSubmit = async () => {
  try {
    setError(null);
    await submitForm(formData);
    onSuccess();
  } catch (err) {
    setError(err.message);
  }
};

if (error) {
  return (
    <div className="text-red-600 p-4 bg-red-50 rounded-lg">
      {error}
    </div>
  );
}
```

## 테스트 작성

### 단위 테스트
```typescript
// components/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import Button from './Button';

describe('Button', () => {
  it('renders children correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### 통합 테스트
```typescript
// pages/Dashboard.integration.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { AuthProvider } from '../contexts/AuthContext';
import Dashboard from './Dashboard';

const renderDashboard = () =>
  render(
    <AuthProvider>
      <Dashboard />
    </AuthProvider>
  );

describe('Dashboard Integration', () => {
  it('loads and displays user data', async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Welcome back!')).toBeInTheDocument();
    });

    expect(screen.getByText('Recent Activities')).toBeInTheDocument();
  });
});
```

### E2E 테스트
```typescript
// cypress/e2e/auth.cy.ts
describe('Authentication', () => {
  it('should login successfully', () => {
    cy.visit('/login');
    cy.get('[data-cy="email"]').type('user@example.com');
    cy.get('[data-cy="password"]').type('password123');
    cy.get('[data-cy="login-button"]').click();
    cy.url().should('include', '/dashboard');
  });
});
```

## 성능 최적화

### 컴포넌트 메모이제이션
```typescript
import React, { memo, useMemo } from 'react';

const ExpensiveComponent = memo(({ data, onAction }) => {
  const processedData = useMemo(() => {
    return data.map(item => expensiveCalculation(item));
  }, [data]);

  return (
    <div>
      {processedData.map(item => (
        <Item key={item.id} data={item} onAction={onAction} />
      ))}
    </div>
  );
});
```

### 코드 스플리팅
```typescript
import { lazy, Suspense } from 'react';

const AdminPage = lazy(() => import('./pages/Admin'));
const CalendarPage = lazy(() => import('./pages/Calendar'));

const App = () => (
  <Suspense fallback={<div>Loading...</div>}>
    <Routes>
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/calendar" element={<CalendarPage />} />
    </Routes>
  </Suspense>
);
```

### 이미지 최적화
```typescript
import { useState } from 'react';

const OptimizedImage = ({ src, alt, className }) => {
  const [loaded, setLoaded] = useState(false);

  return (
    <img
      src={src}
      alt={alt}
      className={`${className} ${loaded ? 'opacity-100' : 'opacity-0'} transition-opacity`}
      loading="lazy"
      onLoad={() => setLoaded(true)}
    />
  );
};
```

## 보안 고려사항

### 입력 검증
```typescript
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password: string): boolean => {
  // 최소 8자, 대소문자, 숫자, 특수문자 포함
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};
```

### XSS 방지
```typescript
import DOMPurify from 'dompurify';

// 사용자 입력 sanitization
const sanitizeInput = (input: string): string => {
  return DOMPurify.sanitize(input);
};

// dangerouslySetInnerHTML 사용 시
<div dangerouslySetInnerHTML={{ __html: sanitizeInput(htmlContent) }} />
```

## Git 워크플로우

### 브랜치 전략
```
main          # 프로덕션 배포 브랜치
develop       # 개발 통합 브랜치
feature/*     # 기능 개발 브랜치
hotfix/*      # 긴급 수정 브랜치
release/*     # 릴리즈 준비 브랜치
```

### 커밋 메시지 컨벤션
```
feat: 새로운 기능 추가
fix: 버그 수정
docs: 문서 수정
style: 코드 스타일 변경 (기능 변경 없음)
refactor: 코드 리팩토링
test: 테스트 코드 추가/수정
chore: 빌드, 설정 등 기타 변경
```

### PR 템플릿
```markdown
## 변경사항
- [ ] 새로운 기능
- [ ] 버그 수정
- [ ] 리팩토링
- [ ] 문서 업데이트

## 변경 유형
- [ ] Breaking change (기존 API 변경)
- [ ] New feature (새로운 기능)
- [ ] Bug fix (버그 수정)
- [ ] Documentation (문서)
- [ ] Style (스타일)

## 테스트
- [ ] 단위 테스트 작성/업데이트
- [ ] 통합 테스트 작성/업데이트
- [ ] E2E 테스트 작성/업데이트

## 체크리스트
- [ ] 코드 리뷰 완료
- [ ] 테스트 통과
- [ ] 문서 업데이트
- [ ] 브레이킹 체인지 확인
```

## 모니터링 및 로깅

### 에러 로깅
```typescript
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: process.env.VITE_SENTRY_DSN,
  environment: process.env.NODE_ENV,
});

// 에러 캡처
try {
  riskyOperation();
} catch (error) {
  Sentry.captureException(error);
}
```

### 성능 모니터링
```typescript
// Web Vitals 측정
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

getCLS(console.log);
getFID(console.log);
getFCP(console.log);
getLCP(console.log);
getTTFB(console.log);
```

## 배포 체크리스트

### 사전 배포
- [ ] 모든 테스트 통과
- [ ] 린팅 에러 없음
- [ ] TypeScript 에러 없음
- [ ] 번들 크기 확인
- [ ] 환경변수 설정 확인
- [ ] 데이터베이스 마이그레이션 확인

### 배포 후
- [ ] 애플리케이션 정상 실행 확인
- [ ] 주요 기능 동작 확인
- [ ] 에러 모니터링 확인
- [ ] 성능 메트릭 확인
- [ ] 사용자 피드백 모니터링</content>
<parameter name="filePath">c:\grokcoding\grok_project_73\DEVELOPMENT.md