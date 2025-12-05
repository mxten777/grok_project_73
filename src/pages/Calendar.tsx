import React, { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useCalendar } from '../hooks/useCalendar';
import { useAuth } from '../hooks/useAuth';
import { Dialog } from '@headlessui/react';
import { CalendarEvent } from '../firebase/calendarServices';

const Calendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [showNewEvent, setShowNewEvent] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
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
  });
  const { loading, createEvent, getEventsForDate } = useCalendar();
  const { user } = useAuth();

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

  const isToday = (day: number) => {
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  // Get events for the current month
  // const monthEvents = getEventsForMonth(currentDate.getFullYear(), currentDate.getMonth());

  const getEventsForDay = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const events = getEventsForDate(date);
    return filterType === 'all' ? events : events.filter(event => event.type === filterType);
  };

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

      await createEvent({
        title: newEventForm.title,
        description: newEventForm.description,
        startDate: startDateTime,
        endDate: endDateTime,
        allDay: newEventForm.allDay,
        type: newEventForm.type,
        location: newEventForm.location,
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
          {/* Calendar Header */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <h2 className="text-lg font-medium text-gray-900">
                    {currentDate.getFullYear()}년 {monthNames[currentDate.getMonth()]}
                  </h2>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => setViewMode('month')}
                      className={`px-3 py-1 text-sm rounded-md ${
                        viewMode === 'month'
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      월
                    </button>
                    <button
                      onClick={() => setViewMode('week')}
                      className={`px-3 py-1 text-sm rounded-md ${
                        viewMode === 'week'
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      주
                    </button>
                    <button
                      onClick={() => setViewMode('day')}
                      className={`px-3 py-1 text-sm rounded-md ${
                        viewMode === 'day'
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      일
                    </button>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">모든 일정</option>
                    <option value="meeting">회의</option>
                    <option value="personal">개인</option>
                    <option value="deadline">마감</option>
                    <option value="other">기타</option>
                  </select>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => navigateMonth('prev')}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md"
                    >
                      <ChevronLeftIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => navigateMonth('next')}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md"
                    >
                      <ChevronRightIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="p-6">
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-1 mb-4">
                {['일', '월', '화', '수', '목', '금', '토'].map((day) => (
                  <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar days */}
              <div className="grid grid-cols-7 gap-1">
                {days.map((day, index) => (
                  <div
                    key={index}
                    className={`min-h-[120px] p-2 border border-gray-200 ${
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
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-md bg-white rounded-lg shadow-xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <Dialog.Title className="text-lg font-medium text-gray-900">
                새 일정 추가
              </Dialog.Title>
              <button
                onClick={() => setShowNewEvent(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  제목 *
                </label>
                <input
                  type="text"
                  value={newEventForm.title}
                  onChange={(e) => setNewEventForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  placeholder="장소를 입력하세요"
                />
              </div>

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
            </div>

            <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowNewEvent(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                취소
              </button>
              <button
                onClick={handleCreateEvent}
                disabled={!newEventForm.title.trim() || !newEventForm.startDate}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 rounded-md"
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