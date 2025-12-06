import React, { useState, useEffect } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useCalendar } from '../hooks/useCalendar';
import { useAuth } from '../hooks/useAuth';
import { Dialog } from '@headlessui/react';
import { CalendarEvent, Attendee } from '../firebase/calendarServices';

const Calendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [showNewEvent, setShowNewEvent] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [meetingRooms, setMeetingRooms] = useState<string[]>([]);
  const [newEventForm, setNewEventForm] = useState({
    title: '',
    description: '',
    startDate: '',
    startTime: '09:00',
    endDate: '',
    endTime: '10:00',
    allDay: false,
    type: 'meeting' as 'meeting' | 'personal' | 'deadline' | 'other',
    location: '',
    visibility: 'private' as 'private' | 'team' | 'public',
    teamId: '',
    meetingRoom: '',
    meetingLink: '',
    agenda: '',
    attendees: [] as Attendee[],
  });
  const { 
    loading, 
    createEvent, 
    getEventsForDate,
    teamEvents,
    publicEvents,
    invitedEvents,
    respondToInvitation,
    checkRoomAvailability,
    getAllMeetingRooms,
    loadTeamEvents,
    loadPublicEvents,
    getAllVisibleEvents
  } = useCalendar();
  const { user } = useAuth();

  // Load meeting rooms
  useEffect(() => {
    const loadMeetingRooms = async () => {
      try {
        const rooms = await getAllMeetingRooms();
        setMeetingRooms(rooms);
      } catch (error) {
        console.error('Failed to load meeting rooms:', error);
      }
    };

    loadMeetingRooms();
  }, [getAllMeetingRooms]);

  const today = new Date();

  // Get days in month
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  };

  const days = getDaysInMonth(currentDate);
  const monthNames = [
    '1월', '2월', '3월', '4월', '5월', '6월',
    '7월', '8월', '9월', '10월', '11월', '12월'
  ];

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const getEventsForDay = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    let allEvents = getEventsForDate(date);

    // 필터 적용
    switch (filterType) {
      case 'my':
        allEvents = allEvents.filter(event => event.createdBy === user?.uid);
        break;
      case 'team':
        allEvents = allEvents.filter(event => event.visibility === 'team' || event.visibility === 'public');
        break;
      case 'public':
        allEvents = allEvents.filter(event => event.visibility === 'public');
        break;
      case 'all':
      default:
        // 모든 이벤트 표시 (개인 일정은 본인만, 팀/공개 일정은 모두)
        allEvents = allEvents.filter(event => 
          event.createdBy === user?.uid || 
          event.visibility === 'team' || 
          event.visibility === 'public'
        );
        break;
    }

    return allEvents;
  };

  const isToday = (day: number) => {
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  // Get events for the current month
  // const monthEvents = getEventsForMonth(currentDate.getFullYear(), currentDate.getMonth());

  const getEventColor = (type: string) => {
    switch (type) {
      case 'meeting': return 'bg-blue-100 text-blue-800';
      case 'personal': return 'bg-green-100 text-green-800';
      case 'deadline': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatEventTime = (event: CalendarEvent) => {
    if (event.allDay) return '종일';
    const startTime = new Date(event.startDate).toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit'
    });
    return startTime;
  };

  const handleCreateEvent = async () => {
    if (!user || !newEventForm.title.trim()) return;

    try {
      const startDateTime = newEventForm.allDay
        ? new Date(newEventForm.startDate)
        : new Date(`${newEventForm.startDate}T${newEventForm.startTime}`);

      const endDateTime = newEventForm.allDay
        ? new Date(newEventForm.endDate || newEventForm.startDate)
        : new Date(`${newEventForm.endDate || newEventForm.startDate}T${newEventForm.endTime}`);

      // Check meeting room availability if it's a meeting with a room
      if (newEventForm.type === 'meeting' && newEventForm.meetingRoom.trim()) {
        const isAvailable = await checkRoomAvailability(
          newEventForm.meetingRoom,
          startDateTime,
          endDateTime
        );
        
        if (!isAvailable) {
          alert('선택한 회의실이 해당 시간에 이미 예약되어 있습니다. 다른 시간이나 회의실을 선택해주세요.');
          return;
        }
      }

      await createEvent({
        title: newEventForm.title,
        description: newEventForm.description,
        startDate: startDateTime,
        endDate: endDateTime,
        allDay: newEventForm.allDay,
        type: newEventForm.type,
        location: newEventForm.location,
        visibility: newEventForm.visibility,
        teamId: newEventForm.visibility === 'team' ? 'default-team' : undefined,
        meetingRoom: newEventForm.meetingRoom,
        meetingLink: newEventForm.meetingLink,
        agenda: newEventForm.agenda,
        attendees: newEventForm.attendees,
        createdBy: user.uid,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Reset form
      setNewEventForm({
        title: '',
        description: '',
        startDate: '',
        startTime: '09:00',
        endDate: '',
        endTime: '10:00',
        allDay: false,
        type: 'meeting',
        location: '',
        visibility: 'private',
        teamId: '',
        meetingRoom: '',
        meetingLink: '',
        agenda: '',
        attendees: [],
      });
      setShowNewEvent(false);
    } catch (error) {
      console.error('Failed to create event:', error);
    }
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">캘린더</h1>
        <button
          onClick={() => setShowNewEvent(!showNewEvent)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          새 일정
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          {/* Meeting Invitations */}
          {invitedEvents.length > 0 && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">회의 초대</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {invitedEvents.map((event) => {
                    const myAttendance = event.attendees?.find(a => a.userId === user?.uid);
                    if (myAttendance?.status !== 'pending') return null;
                    
                    return (
                      <div key={event.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900">{event.title}</h4>
                          <p className="text-sm text-gray-500">
                            {new Date(event.startDate).toLocaleString('ko-KR')} - {event.endDate ? new Date(event.endDate).toLocaleString('ko-KR') : '종일'}
                          </p>
                          {event.location && <p className="text-sm text-gray-500">{event.location}</p>}
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => respondToInvitation(event.id!, 'accepted')}
                            className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
                          >
                            수락
                          </button>
                          <button
                            onClick={() => respondToInvitation(event.id!, 'declined')}
                            className="px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700"
                          >
                            거절
                          </button>
                          <button
                            onClick={() => respondToInvitation(event.id!, 'tentative')}
                            className="px-3 py-1 text-sm bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
                          >
                            미정
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Calendar Header */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                  <h2 className="text-base sm:text-lg font-medium text-gray-900">
                    {currentDate.getFullYear()}년 {monthNames[currentDate.getMonth()]}
                  </h2>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => setViewMode('month')}
                      className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-md ${
                        viewMode === 'month'
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      월
                    </button>
                    <button
                      onClick={() => setViewMode('week')}
                      className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-md ${
                        viewMode === 'week'
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      주
                    </button>
                    <button
                      onClick={() => setViewMode('day')}
                      className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-md ${
                        viewMode === 'day'
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      일
                    </button>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="text-xs sm:text-sm border border-gray-300 rounded-md px-2 sm:px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">모든 일정</option>
                    <option value="my">내 일정</option>
                    <option value="team">팀 일정</option>
                    <option value="public">공개 일정</option>
                  </select>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => navigateMonth('prev')}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                    >
                      <ChevronLeftIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                    <button
                      onClick={() => navigateMonth('next')}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                    >
                      <ChevronRightIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="p-2 sm:p-6">
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-1 mb-2 sm:mb-4">
                {['일', '월', '화', '수', '목', '금', '토'].map((day) => (
                  <div key={day} className="p-1 sm:p-2 text-center text-xs sm:text-sm font-medium text-gray-500">
                    <span className="hidden sm:inline">{day}</span>
                    <span className="sm:hidden">{day.charAt(0)}</span>
                  </div>
                ))}
              </div>

              {/* Calendar days */}
              <div className="grid grid-cols-7 gap-1">
                {days.map((day, index) => (
                  <div
                    key={index}
                    className={`min-h-[80px] sm:min-h-[120px] p-1 sm:p-2 border border-gray-200 ${
                      day ? 'hover:bg-gray-50 cursor-pointer' : ''
                    } ${isToday(day || 0) ? 'bg-blue-50 border-blue-300' : ''}`}
                  >
                    {day && (
                      <>
                        <div className={`text-sm font-medium mb-1 ${
                          isToday(day) ? 'text-blue-600' : 'text-gray-900'
                        }`}>
                          {day}
                        </div>
                        <div className="space-y-1">
                          {getEventsForDay(day).slice(0, 3).map((event) => (
                            <div
                              key={event.id}
                              className={`text-xs p-1 rounded ${getEventColor(event.type)} truncate`}
                              title={`${event.title} - ${formatEventTime(event)}`}
                            >
                              {event.title}
                            </div>
                          ))}
                          {getEventsForDay(day).length > 3 && (
                            <div className="text-xs text-gray-500">
                              +{getEventsForDay(day).length - 3}개 더보기
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Today's Events */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">오늘의 일정</h3>
            </div>
            <div className="p-6">
              {getEventsForDay(today.getDate()).length > 0 ? (
                <div className="space-y-3">
                  {getEventsForDay(today.getDate()).map((event) => (
                    <div key={event.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          event.type === 'meeting' ? 'bg-blue-500' :
                          event.type === 'personal' ? 'bg-green-500' : 'bg-red-500'
                        }`} />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{event.title}</p>
                          <p className="text-xs text-gray-500">{formatEventTime(event)}</p>
                        </div>
                      </div>
                      <button className="text-blue-600 hover:text-blue-900 text-sm">
                        수정
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">오늘 예정된 일정이 없습니다.</p>
              )}
            </div>
          </div>
        </>
      )}

      {/* New Event Modal */}
      <Dialog open={showNewEvent} onClose={() => setShowNewEvent(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black bg-opacity-25" />
        <div className="fixed inset-0 flex items-center justify-center p-2 sm:p-4">
          <Dialog.Panel className="w-full max-w-md bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
              <Dialog.Title className="text-base sm:text-lg font-medium text-gray-900 pr-2">
                새 일정 추가
              </Dialog.Title>
              <button
                onClick={() => setShowNewEvent(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <XMarkIcon className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  제목 *
                </label>
                <input
                  type="text"
                  value={newEventForm.title}
                  onChange={(e) => setNewEventForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="일정 제목을 입력하세요"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  유형
                </label>
                <select
                  value={newEventForm.type}
                  onChange={(e) => setNewEventForm(prev => ({ ...prev, type: e.target.value as CalendarEvent['type'] }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="meeting">회의</option>
                  <option value="personal">개인</option>
                  <option value="deadline">마감</option>
                  <option value="other">기타</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  공개 범위
                </label>
                <select
                  value={newEventForm.visibility}
                  onChange={(e) => setNewEventForm(prev => ({ ...prev, visibility: e.target.value as 'private' | 'team' | 'public' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="private">비공개 (나만 보기)</option>
                  <option value="team">팀 공유 (팀원만 보기)</option>
                  <option value="public">전체 공개 (모든 사용자)</option>
                </select>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="allDay"
                  checked={newEventForm.allDay}
                  onChange={(e) => setNewEventForm(prev => ({ ...prev, allDay: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="allDay" className="ml-2 text-sm text-gray-700">
                  종일 일정
                </label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    시작 날짜 *
                  </label>
                  <input
                    type="date"
                    value={newEventForm.startDate}
                    onChange={(e) => setNewEventForm(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                {!newEventForm.allDay && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      시작 시간
                    </label>
                    <input
                      type="time"
                      value={newEventForm.startTime}
                      onChange={(e) => setNewEventForm(prev => ({ ...prev, startTime: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    종료 날짜
                  </label>
                  <input
                    type="date"
                    value={newEventForm.endDate}
                    onChange={(e) => setNewEventForm(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                {!newEventForm.allDay && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      종료 시간
                    </label>
                    <input
                      type="time"
                      value={newEventForm.endTime}
                      onChange={(e) => setNewEventForm(prev => ({ ...prev, endTime: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  장소
                </label>
                <input
                  type="text"
                  value={newEventForm.location}
                  onChange={(e) => setNewEventForm(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="회의 장소를 입력하세요"
                />
              </div>

              {newEventForm.type === 'meeting' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      회의실
                    </label>
                    <select
                      value={newEventForm.meetingRoom}
                      onChange={(e) => setNewEventForm(prev => ({ ...prev, meetingRoom: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">회의실 선택</option>
                      <option value="회의실 A">회의실 A</option>
                      <option value="회의실 B">회의실 B</option>
                      <option value="회의실 C">회의실 C</option>
                      <option value="소회의실">소회의실</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      화상회의 링크
                    </label>
                    <input
                      type="url"
                      value={newEventForm.meetingLink}
                      onChange={(e) => setNewEventForm(prev => ({ ...prev, meetingLink: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://meet.google.com/..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      회의 안건
                    </label>
                    <textarea
                      value={newEventForm.agenda}
                      onChange={(e) => setNewEventForm(prev => ({ ...prev, agenda: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="회의 안건을 입력하세요"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  설명
                </label>
                <textarea
                  value={newEventForm.description}
                  onChange={(e) => setNewEventForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="일정에 대한 설명을 입력하세요"
                />
              </div>

              {newEventForm.type === 'meeting' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      회의실
                    </label>
                    <input
                      type="text"
                      value={newEventForm.meetingRoom}
                      onChange={(e) => setNewEventForm(prev => ({ ...prev, meetingRoom: e.target.value }))}
                      list="meeting-rooms"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="회의실 이름을 입력하세요"
                    />
                    <datalist id="meeting-rooms">
                      {meetingRooms.map((room) => (
                        <option key={room} value={room} />
                      ))}
                    </datalist>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      화상회의 링크
                    </label>
                    <input
                      type="url"
                      value={newEventForm.meetingLink}
                      onChange={(e) => setNewEventForm(prev => ({ ...prev, meetingLink: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://meet.google.com/..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      안건
                    </label>
                    <textarea
                      value={newEventForm.agenda}
                      onChange={(e) => setNewEventForm(prev => ({ ...prev, agenda: e.target.value }))}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="회의 안건을 입력하세요"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      참석자
                    </label>
                    <div className="space-y-2">
                      {newEventForm.attendees.map((attendee, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <input
                            type="email"
                            value={attendee.userId}
                            onChange={(e) => {
                              const updatedAttendees = [...newEventForm.attendees];
                              updatedAttendees[index] = { ...attendee, userId: e.target.value };
                              setNewEventForm(prev => ({ ...prev, attendees: updatedAttendees }));
                            }}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="참석자 이메일을 입력하세요"
                          />
                          <button
                            onClick={() => {
                              const updatedAttendees = newEventForm.attendees.filter((_, i) => i !== index);
                              setNewEventForm(prev => ({ ...prev, attendees: updatedAttendees }));
                            }}
                            className="p-2 text-red-500 hover:text-red-700"
                          >
                            <XMarkIcon className="h-5 w-5" />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => {
                          setNewEventForm(prev => ({
                            ...prev,
                            attendees: [...prev.attendees, { userId: '', status: 'pending' }]
                          }));
                        }}
                        className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
                      >
                        <PlusIcon className="h-5 w-5" />
                        <span>참석자 추가</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end space-y-2 space-y-reverse sm:space-y-0 sm:space-x-3 p-4 sm:p-6 border-t border-gray-200">
              <button
                onClick={() => setShowNewEvent(false)}
                className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleCreateEvent}
                disabled={!newEventForm.title.trim() || !newEventForm.startDate}
                className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 rounded-md transition-colors"
              >
                생성
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
};

export default Calendar;