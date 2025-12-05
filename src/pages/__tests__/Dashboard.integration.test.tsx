import React from 'react';
import { render } from '@testing-library/react';
import { screen, waitFor } from '@testing-library/dom';
import { jest } from '@jest/globals';
import Dashboard from '../Dashboard';

// Mock all the hooks and services
const mockUseAuth = jest.fn();
const mockUseApprovals = jest.fn();
const mockUseAttendance = jest.fn();
const mockUseChat = jest.fn();
const mockUseCalendar = jest.fn();
const mockUseNotices = jest.fn();

jest.mock('../../hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock('../../hooks/useApprovals', () => ({
  useApprovals: () => mockUseApprovals(),
}));

jest.mock('../../hooks/useAttendance', () => ({
  useAttendance: () => mockUseAttendance(),
}));

jest.mock('../../hooks/useChat', () => ({
  useChat: () => mockUseChat(),
}));

jest.mock('../../hooks/useCalendar', () => ({
  useCalendar: () => mockUseCalendar(),
}));

jest.mock('../../hooks/useNotices', () => ({
  useNotices: () => mockUseNotices(),
}));

describe('Dashboard Integration', () => {
  beforeEach(() => {
    // Setup default mock returns
    mockUseAuth.mockReturnValue({
      user: { displayName: 'Test User', email: 'test@example.com' },
      logout: jest.fn(),
    });

    mockUseApprovals.mockReturnValue({
      pendingApprovals: [],
      loading: false,
    });

    mockUseAttendance.mockReturnValue({
      todayAttendance: null,
      loading: false,
    });

    mockUseChat.mockReturnValue({
      unreadMessages: 0,
      recentChats: [],
      loading: false,
    });

    mockUseCalendar.mockReturnValue({
      todayEvents: [],
      loading: false,
    });

    mockUseNotices.mockReturnValue({
      recentNotices: [],
      loading: false,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders dashboard with user greeting', async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/안녕하세요/)).toBeInTheDocument();
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });
  });

  it('displays loading states initially', () => {
    mockUseApprovals.mockReturnValue({ pendingApprovals: [], loading: true });
    mockUseAttendance.mockReturnValue({ todayAttendance: null, loading: true });

    render(<Dashboard />);

    // Should show loading indicators
    expect(screen.getAllByText('로딩 중...').length).toBeGreaterThan(0);
  });

  it('shows pending approvals count', async () => {
    const mockApprovals = [
      { id: '1', title: '휴가 신청서', status: 'pending' },
      { id: '2', title: '지출 결의서', status: 'pending' },
    ];

    mockUseApprovals.mockReturnValue({
      pendingApprovals: mockApprovals,
      loading: false,
    });

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument(); // Pending count
    });
  });

  it('shows attendance status', async () => {
    mockUseAttendance.mockReturnValue({
      todayAttendance: {
        checkIn: new Date('2024-01-01T09:00:00'),
        checkOut: null,
      },
      loading: false,
    });

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/출근/)).toBeInTheDocument();
    });
  });

  it('displays recent notices', async () => {
    const mockNotices = [
      { id: '1', title: '새 공지사항', createdAt: new Date() },
      { id: '2', title: '중요 공지', createdAt: new Date() },
    ];

    mockUseNotices.mockReturnValue({
      recentNotices: mockNotices,
      loading: false,
    });

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('새 공지사항')).toBeInTheDocument();
      expect(screen.getByText('중요 공지')).toBeInTheDocument();
    });
  });

  it('shows today\'s calendar events', async () => {
    const mockEvents = [
      { id: '1', title: '팀 미팅', start: new Date(), end: new Date() },
      { id: '2', title: '프로젝트 회의', start: new Date(), end: new Date() },
    ];

    mockUseCalendar.mockReturnValue({
      todayEvents: mockEvents,
      loading: false,
    });

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('팀 미팅')).toBeInTheDocument();
      expect(screen.getByText('프로젝트 회의')).toBeInTheDocument();
    });
  });

  it('displays unread message count', async () => {
    mockUseChat.mockReturnValue({
      unreadMessages: 5,
      recentChats: [],
      loading: false,
    });

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('5')).toBeInTheDocument(); // Unread count
    });
  });

  it('handles error states gracefully', async () => {
    mockUseApprovals.mockReturnValue({
      pendingApprovals: [],
      loading: false,
      error: 'Failed to load approvals',
    });

    render(<Dashboard />);

    await waitFor(() => {
      // Should still render without crashing
      expect(screen.getByText(/안녕하세요/)).toBeInTheDocument();
    });
  });
});