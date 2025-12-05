describe('Authentication Flow', () => {
  beforeEach(() => {
    // Clear any existing session
    cy.clearCookies();
    cy.clearLocalStorage();
  });

  it('should load the login page', () => {
    cy.visit('/login');
    cy.contains('로그인').should('be.visible');
  });

  it('should show validation errors for empty form', () => {
    cy.visit('/login');
    cy.get('[data-cy="login-button"]').click();
    // Should show validation messages
    cy.contains('이메일을 입력해주세요').should('be.visible');
  });

  it('should show error for invalid credentials', () => {
    cy.visit('/login');
    cy.get('[data-cy="email-input"]').type('invalid@example.com');
    cy.get('[data-cy="password-input"]').type('wrongpassword');
    cy.get('[data-cy="login-button"]').click();

    // Should show error message
    cy.contains('로그인에 실패했습니다').should('be.visible');
  });

  it('should redirect to dashboard after successful login', () => {
    // Mock successful login
    cy.intercept('POST', '**/identitytoolkit.googleapis.com/**', {
      statusCode: 200,
      body: {
        idToken: 'mock-token',
        refreshToken: 'mock-refresh-token',
        localId: 'mock-user-id',
      },
    });

    cy.visit('/login');
    cy.get('[data-cy="email-input"]').type('test@example.com');
    cy.get('[data-cy="password-input"]').type('password123');
    cy.get('[data-cy="login-button"]').click();

    // Should redirect to dashboard
    cy.url().should('include', '/');
    cy.contains('대시보드').should('be.visible');
  });
});

describe('Dashboard Functionality', () => {
  beforeEach(() => {
    // Assume user is logged in
    cy.login('test@example.com', 'password123');
    cy.visit('/');
  });

  it('should display dashboard widgets', () => {
    cy.contains('안녕하세요').should('be.visible');
    cy.contains('오늘의 일정').should('be.visible');
    cy.contains('결재 대기').should('be.visible');
  });

  it('should navigate to different sections', () => {
    // Test navigation to approvals
    cy.navigateTo('approvals');
    cy.url().should('include', '/approvals');
    cy.contains('전자결재').should('be.visible');

    // Test navigation to messenger
    cy.navigateTo('messenger');
    cy.url().should('include', '/messenger');
    cy.contains('메신저').should('be.visible');
  });

  it('should handle offline mode', () => {
    // Simulate going offline
    cy.window().then((win) => {
      // Mock offline event
      win.dispatchEvent(new Event('offline'));
    });

    // Should show offline indicator
    cy.contains('오프라인 모드').should('be.visible');
  });
});

describe('Approval Workflow', () => {
  beforeEach(() => {
    cy.login('test@example.com', 'password123');
    cy.navigateTo('approvals');
  });

  it('should display approval list', () => {
    cy.contains('전자결재').should('be.visible');
    cy.get('[data-cy="approval-list"]').should('be.visible');
  });

  it('should create new approval request', () => {
    cy.get('[data-cy="new-approval-button"]').click();
    cy.get('[data-cy="approval-type-select"]').select('휴가 신청서');
    cy.get('[data-cy="approval-title"]').type('연차 휴가 신청');
    cy.get('[data-cy="approval-content"]').type('연차 휴가를 신청합니다.');
    cy.get('[data-cy="submit-approval"]').click();

    // Should show success message
    cy.contains('결재 요청이 제출되었습니다').should('be.visible');
  });

  it('should approve pending approval', () => {
    cy.get('[data-cy="pending-approval"]').first().click();
    cy.get('[data-cy="approve-button"]').click();
    cy.get('[data-cy="confirm-approve"]').click();

    // Should show approval success
    cy.contains('승인되었습니다').should('be.visible');
  });
});

describe('Chat Functionality', () => {
  beforeEach(() => {
    cy.login('test@example.com', 'password123');
    cy.navigateTo('messenger');
  });

  it('should display chat interface', () => {
    cy.contains('메신저').should('be.visible');
    cy.get('[data-cy="chat-list"]').should('be.visible');
  });

  it('should send a message', () => {
    cy.get('[data-cy="chat-input"]').type('안녕하세요!');
    cy.get('[data-cy="send-button"]').click();

    // Should show the message in chat
    cy.contains('안녕하세요!').should('be.visible');
  });

  it('should create new chat room', () => {
    cy.get('[data-cy="new-chat-button"]').click();
    cy.get('[data-cy="chat-room-name"]').type('프로젝트 토론');
    cy.get('[data-cy="create-chat-room"]').click();

    // Should show new chat room
    cy.contains('프로젝트 토론').should('be.visible');
  });
});

describe('Mobile Responsiveness', () => {
  beforeEach(() => {
    cy.viewport('iphone-x');
    cy.login('test@example.com', 'password123');
  });

  it('should display mobile menu', () => {
    cy.get('[data-cy="mobile-menu-button"]').should('be.visible');
    cy.get('[data-cy="mobile-menu-button"]').click();

    // Should show mobile navigation
    cy.get('[data-cy="mobile-nav"]').should('be.visible');
  });

  it('should handle touch gestures', () => {
    // Test swipe gestures on mobile
    cy.get('[data-cy="chat-list"]').should('be.visible');
    // Note: Actual swipe testing would require additional plugins
  });
});