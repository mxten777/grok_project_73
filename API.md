# 그룹웨어 API 문서

## 개요

이 문서는 그룹웨어 애플리케이션의 Firebase 기반 API 구조와 사용 방법을 설명합니다.

## Firebase 설정

### 환경변수
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## 데이터베이스 구조

### Firestore 컬렉션

#### users
사용자 정보 저장
```typescript
interface User {
  id: string;
  email: string;
  displayName: string;
  role: 'admin' | 'manager' | 'employee';
  teamId?: string;
  createdAt: Date;
  updatedAt: Date;
  permissions: string[];
}
```

#### calendarEvents
일정 및 회의 정보
```typescript
interface CalendarEvent {
  id?: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate?: Date;
  allDay: boolean;
  type: 'meeting' | 'personal' | 'deadline' | 'other';
  location?: string;
  attendees?: Attendee[];
  visibility: 'private' | 'team' | 'public';
  teamId?: string;
  meetingRoom?: string;
  meetingLink?: string;
  agenda?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Attendee {
  userId: string;
  status: 'pending' | 'accepted' | 'declined' | 'tentative';
  respondedAt?: Date;
}
```

#### approvals
전자결재 문서
```typescript
interface Approval {
  id: string;
  type: 'vacation' | 'expense' | 'purchase' | 'quote' | 'contract';
  requesterId: string;
  status: 'draft' | 'submitted' | 'reviewing' | 'approved' | 'rejected';
  approvers: string[];
  currentApprover?: string;
  data: Record<string, unknown>;
  pdfUrl?: string;
  history: ApprovalHistory[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  permissions: string[];
}
```

#### chats & messages
채팅방 및 메시지
```typescript
interface Chat {
  id: string;
  type: 'direct' | 'group' | 'notice';
  participants: string[];
  name?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  permissions: string[];
  typingUsers: string[];
}

interface Message {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  type: 'text' | 'image' | 'file';
  fileUrl?: string;
  reactions: { [emoji: string]: string[] };
  mentions: string[];
  isEdited: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

#### attendance
근태 기록
```typescript
interface AttendanceRecord {
  id: string;
  userId: string;
  date: Date;
  checkInTime?: Date;
  checkOutTime?: Date;
  location?: {
    latitude: number;
    longitude: number;
  };
  status: 'present' | 'absent' | 'late' | 'early_leave';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

## 주요 서비스 함수

### 인증 서비스 (authServices.ts)

#### 사용자 인증
```typescript
// 로그인
const signIn = async (email: string, password: string): Promise<UserCredential>

// 로그아웃
const signOut = async (): Promise<void>

// 현재 사용자 정보 가져오기
const getCurrentUser = (): Promise<User | null>

// 사용자 프로필 업데이트
const updateUserProfile = async (updates: Partial<User>): Promise<void>
```

### 캘린더 서비스 (calendarServices.ts)

#### 일정 관리
```typescript
// 일정 생성
const createCalendarEvent = async (event: Omit<CalendarEvent, 'id'>): Promise<string>

// 일정 조회
const getCalendarEvents = async (): Promise<CalendarEvent[]>
const getUserCalendarEvents = async (userId: string): Promise<CalendarEvent[]>
const getTeamCalendarEvents = async (teamId: string): Promise<CalendarEvent[]>

// 일정 수정/삭제
const updateCalendarEvent = async (eventId: string, updates: Partial<CalendarEvent>): Promise<void>
const deleteCalendarEvent = async (eventId: string): Promise<void>

// 회의실 관리
const checkMeetingRoomAvailability = async (
  roomName: string,
  startDate: Date,
  endDate: Date,
  excludeEventId?: string
): Promise<boolean>

const getMeetingRooms = async (): Promise<string[]>

// 참석자 초대
const respondToMeetingInvitation = async (
  eventId: string,
  userId: string,
  status: 'accepted' | 'declined' | 'tentative'
): Promise<void>
```

### 결재 서비스 (approvalServices.ts)

#### 결재 문서 관리
```typescript
// 결재 요청 생성
const createApproval = async (approval: Omit<Approval, 'id'>): Promise<string>

// 결재 문서 조회
const getApprovals = async (): Promise<Approval[]>
const getUserApprovals = async (userId: string): Promise<Approval[]>
const getPendingApprovals = async (userId: string): Promise<Approval[]>

// 결재 처리
const approveApproval = async (approvalId: string, userId: string, comment?: string): Promise<void>
const rejectApproval = async (approvalId: string, userId: string, comment: string): Promise<void>

// PDF 생성
const generateApprovalPDF = async (approval: Approval): Promise<string>
```

### 채팅 서비스 (services.ts)

#### 채팅방 관리
```typescript
// 채팅방 생성
const createChat = async (chat: Omit<Chat, 'id'>): Promise<string>

// 채팅방 조회
const getChats = async (): Promise<Chat[]>
const getUserChats = async (userId: string): Promise<Chat[]>

// 메시지 관리
const sendMessage = async (message: Omit<Message, 'id'>): Promise<string>
const updateMessage = async (messageId: string, content: string): Promise<void>
const deleteMessage = async (messageId: string): Promise<void>

// 파일 업로드
const uploadFile = async (file: File, chatId: string): Promise<string>
```

### 근태 서비스 (attendanceServices.ts)

#### 근태 기록
```typescript
// 출근 체크인
const checkIn = async (userId: string, location?: GeolocationCoordinates): Promise<void>

// 퇴근 체크아웃
const checkOut = async (userId: string): Promise<void>

// 근태 기록 조회
const getAttendanceRecords = async (userId: string, month: number, year: number): Promise<AttendanceRecord[]>

// 근태 통계
const getAttendanceStats = async (userId: string, month: number, year: number): Promise<AttendanceStats>
```

## 실시간 리스너

### Firestore 실시간 업데이트
```typescript
// 일정 실시간 구독
const subscribeToCalendarEvents = (callback: (events: CalendarEvent[]) => void): Unsubscribe

// 채팅 메시지 실시간 구독
const subscribeToMessages = (chatId: string, callback: (messages: Message[]) => void): Unsubscribe

// 결재 상태 실시간 구독
const subscribeToApprovals = (userId: string, callback: (approvals: Approval[]) => void): Unsubscribe
```

## 에러 처리

모든 API 함수는 적절한 에러 처리를 포함하며, 다음과 같은 에러 타입을 반환할 수 있습니다:

- `FirebaseError`: Firebase 관련 에러
- `ValidationError`: 데이터 검증 에러
- `PermissionError`: 권한 관련 에러
- `NetworkError`: 네트워크 연결 에러

## 보안 규칙

### Firestore Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 사용자 데이터: 본인만 읽기/쓰기 가능
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // 일정 데이터: 생성자 또는 팀 멤버만 접근 가능
    match /calendarEvents/{eventId} {
      allow read: if request.auth != null &&
        (resource.data.createdBy == request.auth.uid ||
         resource.data.visibility == 'public' ||
         (resource.data.visibility == 'team' && resource.data.teamId in getUserTeams(request.auth.uid)));
      allow write: if request.auth != null && resource.data.createdBy == request.auth.uid;
    }

    // 기타 컬렉션에 대한 유사한 규칙 적용
  }
}
```

## 파일 업로드 정책

### Firebase Storage Rules
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // 프로필 이미지: 본인만 업로드 가능
    match /profiles/{userId}/{allPaths=**} {
      allow read;
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    // 채팅 파일: 채팅방 참가자만 접근 가능
    match /chats/{chatId}/{allPaths=**} {
      allow read, write: if request.auth != null &&
        chatId in getUserChatIds(request.auth.uid);
    }

    // 결재 문서: 관련자만 접근 가능
    match /approvals/{approvalId}/{allPaths=**} {
      allow read: if request.auth != null &&
        approvalId in getUserApprovalIds(request.auth.uid);
    }
  }
}
```</content>
<parameter name="filePath">c:\grokcoding\grok_project_73\API.md