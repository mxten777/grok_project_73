# 배포 가이드

## 개요

이 문서는 그룹웨어 애플리케이션의 배포 프로세스와 환경 설정에 대해 설명합니다.

## 지원 환경

### 개발 환경 (Development)
- **목적**: 기능 개발 및 테스트
- **URL**: `http://localhost:5173` (Vite 기본 포트)
- **데이터베이스**: Firebase Emulator Suite
- **특징**: 핫 리로드, 소스 맵, 디버깅 지원

### 스테이징 환경 (Staging)
- **목적**: 통합 테스트 및 QA
- **URL**: `https://groupware-staging.vercel.app`
- **데이터베이스**: Firebase 프로젝트 (staging)
- **특징**: 프로덕션과 동일한 환경, 실제 데이터 사용 제한

### 프로덕션 환경 (Production)
- **목적**: 실제 서비스 운영
- **URL**: `https://groupware.vercel.app`
- **데이터베이스**: Firebase 프로젝트 (production)
- **특징**: 최적화된 빌드, 모니터링, 백업

## 사전 준비사항

### 1. Firebase 프로젝트 설정

#### 프로젝트 생성
```bash
# Firebase CLI 설치 (아직 설치하지 않은 경우)
npm install -g firebase-tools

# Firebase 로그인
firebase login

# 새 프로젝트 생성 또는 기존 프로젝트 선택
firebase projects:list
firebase use your-project-id
```

#### Firestore 설정
```bash
# Firestore 초기화
firebase init firestore

# 보안 규칙 배포
firebase deploy --only firestore:rules
```

#### Storage 설정
```bash
# Storage 초기화
firebase init storage

# Storage 규칙 배포
firebase deploy --only storage
```

#### Authentication 설정
Firebase Console에서 다음을 설정:
- 이메일/비밀번호 인증 활성화
- Google 인증 활성화 (선택적)
- 권한 부여 도메인 설정

### 2. Vercel 설정

#### 프로젝트 연결
```bash
# Vercel CLI 설치
npm install -g vercel

# Vercel 로그인
vercel login

# 프로젝트 연결
vercel link
```

#### 환경변수 설정
```bash
# 환경변수 설정 (각 환경별로)
vercel env add VITE_FIREBASE_API_KEY
vercel env add VITE_FIREBASE_AUTH_DOMAIN
vercel env add VITE_FIREBASE_PROJECT_ID
vercel env add VITE_FIREBASE_STORAGE_BUCKET
vercel env add VITE_FIREBASE_MESSAGING_SENDER_ID
vercel env add VITE_FIREBASE_APP_ID
```

## 로컬 개발 환경 설정

### 1. 의존성 설치
```bash
# 프로젝트 클론
git clone https://github.com/your-org/groupware.git
cd groupware

# 의존성 설치
npm install
```

### 2. 환경변수 설정
```bash
# .env 파일 생성
cp .env.example .env

# 환경변수 편집
VITE_FIREBASE_API_KEY=your_dev_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project-dev.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-dev
VITE_FIREBASE_STORAGE_BUCKET=your-project-dev.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 3. Firebase 에뮬레이터 설정
```bash
# 에뮬레이터 시작
npm run emulators

# 다른 터미널에서 개발 서버 시작
npm run dev
```

### 4. 데이터 시드 (선택적)
```bash
# 초기 데이터 생성 스크립트 실행
npm run seed
```

## 스테이징 배포

### 1. 브랜치 준비
```bash
# develop 브랜치에서 staging 브랜치 생성
git checkout develop
git checkout -b staging
git push origin staging
```

### 2. Vercel 프리뷰 배포
```bash
# 스테이징용 환경변수 설정
vercel env add VITE_FIREBASE_PROJECT_ID --scope staging
# 다른 환경변수들도 설정...

# 프리뷰 배포
vercel --prod false
```

### 3. 자동 배포 설정
GitHub Actions를 통한 자동 배포:
```yaml
# .github/workflows/staging.yml
name: Deploy to Staging

on:
  push:
    branches: [staging]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod false'
```

## 프로덕션 배포

### 1. 릴리즈 브랜치 생성
```bash
# main 브랜치에서 release 브랜치 생성
git checkout main
git checkout -b release/v1.0.0
git push origin release/v1.0.0
```

### 2. 프로덕션 배포
```bash
# 프로덕션 환경변수 설정
vercel env add VITE_FIREBASE_PROJECT_ID --scope production
# 다른 환경변수들도 설정...

# 프로덕션 배포
vercel --prod
```

### 3. 자동 배포 설정
```yaml
# .github/workflows/production.yml
name: Deploy to Production

on:
  push:
    branches: [main]
  release:
    types: [published]

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v3
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

## 데이터베이스 마이그레이션

### Firestore 마이그레이션
```typescript
// migrations/migrate-v1.0.0.ts
import { collection, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '../firebase/config';

export const migrateToV1 = async () => {
  const batch = writeBatch(db);

  // 기존 사용자 데이터에 새로운 필드 추가
  const usersRef = collection(db, 'users');
  const usersSnapshot = await getDocs(usersRef);

  usersSnapshot.docs.forEach((doc) => {
    const userData = doc.data();
    if (!userData.permissions) {
      batch.update(doc.ref, {
        permissions: ['read'],
        updatedAt: new Date()
      });
    }
  });

  await batch.commit();
  console.log('Migration completed');
};
```

### 마이그레이션 실행
```bash
# 마이그레이션 스크립트 실행
npm run migrate:v1.0.0
```

## 모니터링 및 로깅

### Vercel Analytics 설정
```typescript
// src/utils/analytics.ts
import { inject } from '@vercel/analytics';

export const initAnalytics = () => {
  if (import.meta.env.PROD) {
    inject();
  }
};
```

### 에러 추적 (Sentry)
```typescript
// src/utils/sentry.ts
import * as Sentry from '@sentry/react';

export const initSentry = () => {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    tracesSampleRate: 1.0,
  });
};
```

### Firebase 모니터링
```typescript
// Firebase Performance Monitoring
import { getPerformance } from 'firebase/performance';
import { getApp } from 'firebase/app';

const perf = getPerformance(getApp());
```

## 백업 및 복구

### Firestore 백업
```bash
# Firestore 데이터 내보내기
gcloud firestore export gs://your-backup-bucket --project=your-project-id

# 또는 Firebase Admin SDK 사용
import * as admin from 'firebase-admin';

export const backupFirestore = async () => {
  const bucket = admin.storage().bucket('your-backup-bucket');
  const timestamp = new Date().toISOString();

  await admin.firestore().collection('users').backup(bucket, `backup/users/${timestamp}`);
  await admin.firestore().collection('calendarEvents').backup(bucket, `backup/events/${timestamp}`);
};
```

### 자동 백업 설정
```yaml
# Cloud Scheduler로 주기적 백업
# 또는 Firebase Functions로 구현
export const scheduledBackup = functions.pubsub
  .schedule('0 2 * * *') // 매일 오전 2시
  .timeZone('Asia/Seoul')
  .onRun(async () => {
    await backupFirestore();
  });
```

## 롤백 절차

### 긴급 롤백
```bash
# 이전 버전으로 즉시 롤백
vercel rollback

# 또는 특정 배포로 롤백
vercel rollback [deployment-url-or-id]
```

### 데이터 롤백
```bash
# 백업에서 데이터 복구
gcloud firestore import gs://your-backup-bucket/backup --project=your-project-id
```

## 성능 모니터링

### Core Web Vitals 모니터링
```typescript
// Web Vitals 측정
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

export const reportWebVitals = (metric: any) => {
  // Vercel Analytics 또는 커스텀 모니터링 서비스로 전송
  console.log('Web Vital:', metric.name, metric.value);

  // Firebase Analytics로 전송
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', metric.name, {
      value: Math.round(metric.value * 1000), // Convert to milliseconds
      event_category: 'Web Vitals',
      event_label: metric.id,
      non_interaction: true,
    });
  }
};

// 모든 Web Vitals 측정
getCLS(reportWebVitals);
getFID(reportWebVitals);
getFCP(reportWebVitals);
getLCP(reportWebVitals);
getTTFB(reportWebVitals);
```

### 애플리케이션 성능 모니터링
```typescript
// Firebase Performance Monitoring
import { getPerformance, trace } from 'firebase/performance';

const perf = getPerformance();

// 페이지 로드 성능 추적
const pageLoadTrace = trace(perf, 'page_load');
pageLoadTrace.start();
pageLoadTrace.stop();

// API 호출 성능 추적
const apiTrace = trace(perf, 'api_call');
apiTrace.start();
// API 호출
apiTrace.stop();
```

## 보안 설정

### HTTPS 강제 적용
```typescript
// Vercel에서는 자동으로 HTTPS 적용됨
// 추가 보안 헤더 설정 (vercel.json)
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        }
      ]
    }
  ]
}
```

### CSP (Content Security Policy)
```json
// vercel.json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline' https://*.firebase.com https://*.googleapis.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://*.firebase.com https://*.googleapis.com wss://*.firebaseio.com;"
        }
      ]
    }
  ]
}
```

## 트러블슈팅

### 일반적인 배포 문제

#### 빌드 실패
```bash
# 빌드 로그 확인
vercel logs

# 로컬에서 빌드 테스트
npm run build

# 의존성 문제 확인
npm ls --depth=0
```

#### 런타임 에러
```bash
# 환경변수 확인
vercel env ls

# Firebase 연결 확인
firebase projects:list
firebase use your-project-id
```

#### 성능 문제
```bash
# 번들 분석
npm run build:analyze

# Core Web Vitals 확인
# Chrome DevTools > Lighthouse > Performance
```

### 긴급 상황 대응

#### 서비스 중단 시
1. 상태 페이지 확인
2. Vercel 대시보드에서 상태 확인
3. Firebase Console에서 서비스 상태 확인
4. 롤백 실행
5. 사용자에게 상황 공지

#### 데이터 손상 시
1. 백업에서 복구
2. Firebase Console에서 데이터 확인
3. 필요한 경우 수동 데이터 수정
4. 재발 방지 조치 수립

## 유지보수

### 정기 점검 항목
- [ ] 의존성 업데이트 확인
- [ ] 보안 취약점 스캔
- [ ] 성능 메트릭 모니터링
- [ ] 백업 상태 확인
- [ ] 로그 분석 및 정리

### 업데이트 절차
1. 개발 브랜치에서 변경사항 개발
2. 스테이징 환경에 배포 및 테스트
3. 프로덕션 배포
4. 모니터링 및 롤백 준비
5. 사용자 피드백 수집

이 배포 가이드를 따라 안전하고 효율적인 배포 프로세스를 유지할 수 있습니다.</content>
<parameter name="filePath">c:\grokcoding\grok_project_73\DEPLOYMENT.md