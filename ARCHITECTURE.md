# 시스템 아키텍처

## 개요

그룹웨어 애플리케이션은 React 기반의 모던 웹 애플리케이션으로, Firebase를 백엔드로 사용하는 실시간 협업 플랫폼입니다.

## 전체 아키텍처

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Browser   │    │   Vercel Edge   │    │   Firebase      │
│   (React SPA)   │◄──►│   Functions     │◄──►│   Services      │
│                 │    │                 │    │                 │
│ - PWA Support   │    │ - API Routes    │    │ - Firestore     │
│ - Offline Mode  │    │ - SSR/SSG       │    │ - Auth          │
│ - Real-time     │    │ - CDN           │    │ - Storage       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Cloudflare    │
                    │   (Optional)    │
                    │                 │
                    │ - CDN           │
                    │ - DDoS Protection│
                    │ - Edge Computing│
                    └─────────────────┘
```

## 프론트엔드 아키텍처

### 기술 스택
- **React 19**: 함수형 컴포넌트, Concurrent Features
- **TypeScript**: 타입 안전성, 개발자 경험 향상
- **Vite**: 빠른 빌드 및 개발 서버
- **Tailwind CSS**: 유틸리티 퍼스트 CSS 프레임워크

### 디자인 패턴

#### Atomic Design
```
Atoms (원자)
├── Button, Input, Icon 등의 기본 컴포넌트

Molecules (분자)
├── Form, Card, Modal 등의 복합 컴포넌트

Organisms (유기체)
├── Header, Sidebar, Dashboard 등의 페이지 레벨 컴포넌트

Templates (템플릿)
├── 페이지 레이아웃 및 구조

Pages (페이지)
├── 실제 라우팅되는 페이지 컴포넌트
```

#### Custom Hooks 패턴
```typescript
// 관심사 분리 및 재사용성
const useAuth = () => {
  // 인증 로직
};

const useRealtimeData = (collection: string) => {
  // 실시간 데이터 관리
};

const useForm = (initialValues: any) => {
  // 폼 상태 관리
};
```

### 상태 관리 전략

#### 로컬 상태 (useState/useReducer)
- 컴포넌트 내부 상태
- 폼 데이터
- UI 상태 (모달, 드롭다운 등)

#### 서버 상태 (커스텀 훅)
- API 데이터
- 실시간 업데이트
- 캐싱 및 동기화

#### 전역 상태 (Context)
- 사용자 인증 상태
- 앱 설정
- 테마 설정

### 라우팅 구조

```
App
├── Public Routes
│   ├── /login
│   ├── /register
│   └── /forgot-password
├── Protected Routes (Auth Required)
│   ├── /dashboard
│   ├── /calendar
│   ├── /approvals
│   ├── /messenger
│   ├── /attendance
│   ├── /documents
│   ├── /projects
│   └── /admin (Admin Only)
└── Error Routes
    ├── 404
    └── 500
```

## 백엔드 아키텍처

### Firebase 서비스

#### Firestore (NoSQL 데이터베이스)
```
Collections:
├── users/           # 사용자 정보
├── calendarEvents/  # 일정 및 회의
├── approvals/       # 전자결재 문서
├── chats/           # 채팅방
├── messages/        # 채팅 메시지
├── attendance/      # 근태 기록
├── notices/         # 공지사항
├── documents/       # 문서
├── projects/        # 프로젝트
├── tasks/           # 업무
└── logs/            # 시스템 로그
```

#### Cloud Storage
```
Buckets:
├── profiles/        # 프로필 이미지
├── chats/           # 채팅 파일
├── approvals/       # 결재 문서 (PDF)
├── documents/       # 사내 문서
└── projects/        # 프로젝트 파일
```

#### Authentication
```
Providers:
├── Email/Password
├── Google OAuth
├── Microsoft OAuth
└── SAML SSO (향후 지원)
```

#### Cloud Functions (선택적)
```
Functions:
├── sendNotification  # 푸시 알림
├── generateReport    # 보고서 생성
├── processApproval   # 결재 자동화
└── backupData        # 데이터 백업
```

### 데이터 모델

#### 사용자 모델
```typescript
interface User {
  // 기본 정보
  id: string;
  email: string;
  displayName: string;

  // 권한 및 역할
  role: 'admin' | 'manager' | 'employee';
  permissions: string[];

  // 조직 정보
  teamId?: string;
  department?: string;

  // 메타데이터
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}
```

#### 일정 모델
```typescript
interface CalendarEvent {
  // 기본 정보
  id: string;
  title: string;
  description?: string;

  // 시간 정보
  startDate: Date;
  endDate?: Date;
  allDay: boolean;

  // 분류
  type: 'meeting' | 'personal' | 'deadline' | 'other';
  visibility: 'private' | 'team' | 'public';

  // 회의 관련 (선택적)
  meetingRoom?: string;
  meetingLink?: string;
  agenda?: string;
  attendees?: Attendee[];

  // 메타데이터
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}
```

## 실시간 아키텍처

### Firestore 실시간 리스너

#### 구현 패턴
```typescript
// 1. 실시간 구독
const useRealtimeSubscription = (collection: string, userId?: string) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let query = collection(db, collection);

    if (userId) {
      query = query.where('userId', '==', userId);
    }

    const unsubscribe = onSnapshot(query, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setData(items);
      setLoading(false);
    });

    return unsubscribe;
  }, [collection, userId]);

  return { data, loading };
};

// 2. 최적화된 리스너
const useOptimizedRealtime = (collection: string) => {
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    const unsubscribe = onSnapshot(
      collection(db, collection),
      { includeMetadataChanges: false },
      (snapshot) => {
        if (controller.signal.aborted) return;

        try {
          const items = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setData(items);
        } catch (err) {
          setError(err);
        }
      },
      (error) => {
        if (!controller.signal.aborted) {
          setError(error);
        }
      }
    );

    return () => {
      controller.abort();
      unsubscribe();
    };
  }, [collection]);

  return { data, error };
};
```

### 실시간 이벤트 처리

#### 채팅 메시지
```typescript
// 메시지 전송
const sendMessage = async (chatId: string, content: string) => {
  const messageRef = await addDoc(collection(db, 'messages'), {
    chatId,
    content,
    senderId: currentUser.uid,
    createdAt: serverTimestamp(),
    type: 'text'
  });

  // 채팅방 마지막 메시지 업데이트
  await updateDoc(doc(db, 'chats', chatId), {
    lastMessage: content,
    lastMessageAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
};

// 실시간 메시지 구독
const useChatMessages = (chatId: string) => {
  return useRealtimeSubscription('messages', chatId);
};
```

#### 결재 상태 업데이트
```typescript
// 결재 처리
const processApproval = async (approvalId: string, action: 'approve' | 'reject') => {
  const approvalRef = doc(db, 'approvals', approvalId);

  await runTransaction(db, async (transaction) => {
    const approvalDoc = await transaction.get(approvalRef);

    if (!approvalDoc.exists()) {
      throw new Error('Approval not found');
    }

    const approval = approvalDoc.data();

    // 상태 업데이트
    transaction.update(approvalRef, {
      status: action === 'approve' ? 'approved' : 'rejected',
      updatedAt: serverTimestamp()
    });

    // 히스토리 추가
    const historyRef = collection(approvalRef, 'history');
    transaction.add(historyRef, {
      action,
      userId: currentUser.uid,
      timestamp: serverTimestamp(),
      comment: approval.comment
    });
  });
};
```

## 보안 아키텍처

### Firebase Security Rules

#### Firestore Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 사용자 데이터: 본인만 접근 가능
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow read: if request.auth != null && isAdmin();
    }

    // 일정 데이터: 가시성에 따른 접근 제어
    match /calendarEvents/{eventId} {
      allow read: if request.auth != null && canReadEvent(resource.data);
      allow write: if request.auth != null && canWriteEvent(resource.data);
    }

    // 결재 데이터: 관련자만 접근 가능
    match /approvals/{approvalId} {
      allow read: if request.auth != null && canAccessApproval(resource.data);
      allow write: if request.auth != null && canModifyApproval(resource.data);
    }

    // 채팅 데이터: 참가자만 접근 가능
    match /chats/{chatId} {
      allow read: if request.auth != null && isParticipant(resource.data);
      allow write: if request.auth != null && isParticipant(resource.data);
    }
  }
}

// 헬퍼 함수들
function isAdmin() {
  return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
}

function canReadEvent(event) {
  return event.createdBy == request.auth.uid ||
         event.visibility == 'public' ||
         (event.visibility == 'team' && event.teamId == getUserTeamId());
}

function canAccessApproval(approval) {
  return approval.requesterId == request.auth.uid ||
         approval.approvers.hasAny([request.auth.uid]) ||
         isAdmin();
}
```

#### Storage Rules
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // 프로필 이미지
    match /profiles/{userId}/{allPaths=**} {
      allow read;
      allow write: if request.auth != null && request.auth.uid == userId;
      allow delete: if request.auth != null && request.auth.uid == userId;
    }

    // 채팅 파일
    match /chats/{chatId}/{allPaths=**} {
      allow read, write: if request.auth != null && isChatParticipant(chatId);
    }

    // 결재 문서
    match /approvals/{approvalId}/{allPaths=**} {
      allow read: if request.auth != null && canAccessApproval(approvalId);
      allow write: if request.auth != null && canModifyApproval(approvalId);
    }
  }
}
```

### 클라이언트 사이드 보안

#### 입력 검증
```typescript
// 이메일 검증
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
};

// XSS 방지
import DOMPurify from 'dompurify';

const sanitizeInput = (input: string): string => {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [], // HTML 태그 허용하지 않음
    ALLOWED_ATTR: []
  });
};
```

#### API 요청 보호
```typescript
// CSRF 토큰 (Firebase Auth 토큰 사용)
const makeAuthenticatedRequest = async (url: string, options: RequestInit = {}) => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Authentication required');
  }

  const idToken = await user.getIdToken();

  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${idToken}`,
      'Content-Type': 'application/json',
    },
  });
};
```

## 성능 아키텍처

### 코드 스플리팅 전략

#### 라우트 기반 스플리팅
```typescript
import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';

// 페이지 레벨 컴포넌트 지연 로딩
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Calendar = lazy(() => import('./pages/Calendar'));
const Approvals = lazy(() => import('./pages/Approvals'));
const Messenger = lazy(() => import('./pages/Messenger'));

const App = () => (
  <Suspense fallback={<PageLoader />}>
    <Routes>
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/calendar" element={<Calendar />} />
      <Route path="/approvals" element={<Approvals />} />
      <Route path="/messenger" element={<Messenger />} />
    </Routes>
  </Suspense>
);
```

#### 컴포넌트 기반 스플리팅
```typescript
import { lazy, Suspense } from 'react';

// 무거운 컴포넌트 지연 로딩
const HeavyChart = lazy(() => import('./components/HeavyChart'));
const RichTextEditor = lazy(() => import('./components/RichTextEditor'));

const Dashboard = () => (
  <div>
    <BasicStats />
    <Suspense fallback={<ChartSkeleton />}>
      <HeavyChart />
    </Suspense>
    <Suspense fallback={<EditorSkeleton />}>
      <RichTextEditor />
    </Suspense>
  </div>
);
```

### 캐싱 전략

#### React Query 패턴 (커스텀 구현)
```typescript
interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class QueryCache {
  private cache = new Map<string, CacheItem<any>>();

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  set<T>(key: string, data: T, ttl = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  invalidate(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }
}
```

#### Service Worker 캐싱
```typescript
// service-worker.js
const CACHE_NAME = 'groupware-v1';
const STATIC_CACHE = 'static-v1';
const DYNAMIC_CACHE = 'dynamic-v1';

const STATIC_ASSETS = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/favicon.ico'
];

// 설치 시 정적 에셋 캐싱
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

// 네트워크 요청 가로채기
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // API 요청은 네트워크 우선
  if (request.url.includes('/api/')) {
    event.respondWith(networkFirst(request));
  }
  // 정적 에셋은 캐시 우선
  else if (STATIC_ASSETS.includes(request.url)) {
    event.respondWith(cacheFirst(request));
  }
  // 기타 요청은 스태일-화일 (stale-while-revalidate)
  else {
    event.respondWith(staleWhileRevalidate(request));
  }
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  return cached || fetch(request);
}

async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    return caches.match(request);
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const cachedResponse = await cache.match(request);

  const fetchPromise = fetch(request).then(networkResponse => {
    cache.put(request, networkResponse.clone());
    return networkResponse;
  });

  return cachedResponse || fetchPromise;
}
```

### 이미지 최적화

#### 반응형 이미지
```typescript
interface OptimizedImageProps {
  src: string;
  alt: string;
  sizes?: string;
  className?: string;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  className
}) => {
  // WebP 지원 확인 및 srcSet 생성
  const webpSrcSet = generateWebPSrcSet(src);
  const fallbackSrcSet = generateFallbackSrcSet(src);

  return (
    <picture>
      <source srcSet={webpSrcSet} sizes={sizes} type="image/webp" />
      <img
        srcSet={fallbackSrcSet}
        sizes={sizes}
        src={src}
        alt={alt}
        className={className}
        loading="lazy"
        decoding="async"
      />
    </picture>
  );
};
```

### 번들 최적화

#### Vite 설정
```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    visualizer({
      filename: 'dist/stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
    }),
  ],

  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // React 관련 청크
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],

          // UI 라이브러리 청크
          'ui-vendor': ['@headlessui/react', '@radix-ui/react-dialog'],

          // Firebase 청크
          'firebase-vendor': ['firebase/app', 'firebase/firestore', 'firebase/auth'],

          // 유틸리티 청크
          'utils-vendor': ['date-fns', 'lodash-es'],
        },
      },
    },

    // 청크 크기 제한
    chunkSizeWarningLimit: 1000,
  },

  // 의존성 사전 번들링 최적화
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'firebase/app',
      'firebase/firestore',
      '@headlessui/react',
    ],
  },
});
```

## 모니터링 및 로깅

### 클라이언트 사이드 모니터링

#### 에러 추적
```typescript
import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  integrations: [new BrowserTracing()],
  tracesSampleRate: 1.0,
  beforeSend(event) {
    // 민감한 정보 필터링
    if (event.exception) {
      event.exception.values = event.exception.values?.map(value => ({
        ...value,
        stacktrace: {
          ...value.stacktrace,
          frames: value.stacktrace?.frames?.map(frame => ({
            ...frame,
            vars: undefined, // 로컬 변수 제거
          })),
        },
      }));
    }
    return event;
  },
});
```

#### 성능 모니터링
```typescript
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

// Core Web Vitals 측정 및 보고
getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);

function sendToAnalytics(metric) {
  // Firebase Analytics 또는 커스텀 분석 서비스로 전송
  console.log('Web Vital:', metric.name, metric.value);
}
```

### 서버 사이드 모니터링

#### Firebase Functions 모니터링
```typescript
import * as functions from 'firebase-functions';
import { error, info } from 'firebase-functions/logger';

export const processApproval = functions
  .runWith({
    timeoutSeconds: 540,
    memory: '1GB',
  })
  .https.onCall(async (data, context) => {
    const startTime = Date.now();

    try {
      info('Processing approval', { approvalId: data.approvalId });

      // 비즈니스 로직
      const result = await processApprovalLogic(data);

      const duration = Date.now() - startTime;
      info('Approval processed successfully', {
        approvalId: data.approvalId,
        duration,
      });

      return result;
    } catch (err) {
      error('Approval processing failed', {
        approvalId: data.approvalId,
        error: err.message,
        duration: Date.now() - startTime,
      });
      throw err;
    }
  });
```

## 확장성 고려사항

### 수평적 확장

#### 데이터베이스 샤딩
```typescript
// 컬렉션 그룹별 샤딩
const getShardId = (userId: string): string => {
  // 사용자 ID를 기반으로 샤드 결정
  const hash = simpleHash(userId);
  return `shard_${hash % SHARD_COUNT}`;
};

// 샤딩된 컬렉션 접근
const getUserData = async (userId: string) => {
  const shardId = getShardId(userId);
  const docRef = doc(db, `users_${shardId}`, userId);
  return getDoc(docRef);
};
```

#### CDN 활용
```typescript
// 지역별 Firebase 프로젝트
const getRegionalDb = (region: string) => {
  const regionalConfig = getRegionalConfig(region);
  return getFirestore(getApp(regionalConfig.appName));
};

// 자동 지역 선택
const getOptimalRegion = async (): Promise<string> => {
  // 사용자 위치 기반 최적 지역 선택
  const userLocation = await getUserLocation();
  return getNearestRegion(userLocation);
};
```

### 마이크로서비스 분리

#### 기능별 모듈화
```
services/
├── auth/           # 인증 서비스
├── calendar/       # 캘린더 서비스
├── messaging/      # 메시징 서비스
├── approvals/      # 결재 서비스
├── documents/      # 문서 서비스
└── notifications/  # 알림 서비스
```

#### API 게이트웨이 패턴
```typescript
// 중앙 집중식 API 관리
class ApiGateway {
  private services = new Map();

  register(serviceName: string, service: Service) {
    this.services.set(serviceName, service);
  }

  async call(serviceName: string, method: string, params: any) {
    const service = this.services.get(serviceName);
    if (!service) {
      throw new Error(`Service ${serviceName} not found`);
    }

    // 로깅, 인증, 캐싱 등 공통 로직
    await this.authenticate();
    await this.logRequest(serviceName, method, params);

    const result = await service[method](params);

    await this.cacheResult(serviceName, method, params, result);

    return result;
  }
}
```

## 배포 아키텍처

### CI/CD 파이프라인

#### GitHub Actions 워크플로우
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - run: npm ci
      - run: npm run lint
      - run: npm run test:unit
      - run: npm run test:integration
      - run: npm run test:e2e

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - run: npm ci
      - run: npm run build
      - run: npm run build:analyze

      - uses: actions/upload-artifact@v3
        with:
          name: build-files
          path: dist/

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/download-artifact@v3
        with:
          name: build-files
          path: dist/

      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

### 환경별 설정

#### 환경 변수 관리
```typescript
// config/environments.ts
interface EnvironmentConfig {
  apiUrl: string;
  firebase: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
  };
  features: {
    googleCalendar: boolean;
    notifications: boolean;
    analytics: boolean;
  };
}

const configs: Record<string, EnvironmentConfig> = {
  development: {
    apiUrl: 'http://localhost:3000',
    firebase: { /* dev config */ },
    features: {
      googleCalendar: false,
      notifications: true,
      analytics: false,
    },
  },
  staging: {
    apiUrl: 'https://staging-api.example.com',
    firebase: { /* staging config */ },
    features: {
      googleCalendar: true,
      notifications: true,
      analytics: true,
    },
  },
  production: {
    apiUrl: 'https://api.example.com',
    firebase: { /* prod config */ },
    features: {
      googleCalendar: true,
      notifications: true,
      analytics: true,
    },
  },
};

export const getConfig = (): EnvironmentConfig => {
  const env = import.meta.env.MODE || 'development';
  return configs[env];
};
```

### 롤백 전략

#### 블루-그린 배포
```typescript
// 배포 상태 관리
interface DeploymentStatus {
  version: string;
  environment: 'blue' | 'green';
  status: 'deploying' | 'testing' | 'live' | 'failed';
  traffic: number; // 0-100
}

class DeploymentManager {
  async deploy(version: string): Promise<void> {
    // 1. 새로운 환경에 배포
    const targetEnv = await this.getInactiveEnvironment();
    await this.deployToEnvironment(version, targetEnv);

    // 2. 헬스 체크
    await this.healthCheck(targetEnv);

    // 3. 트래픽 전환 (카나리 배포)
    await this.gradualTrafficShift(targetEnv, 10); // 10% 시작

    // 4. 모니터링 및 롤백 준비
    await this.monitorAndPrepareRollback(targetEnv);
  }

  async rollback(): Promise<void> {
    // 이전 버전으로 즉시 롤백
    await this.instantTrafficShift('previous-environment');
  }
}
```

이 아키텍처는 확장성, 유지보수성, 성능을 고려하여 설계되었으며, Firebase의 실시간 기능을 최대한 활용하는 모던 웹 애플리케이션 패턴을 따르고 있습니다.</content>
<parameter name="filePath">c:\grokcoding\grok_project_73\ARCHITECTURE.md