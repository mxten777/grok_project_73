import { useState, useEffect } from 'react';
import type { CalendarEvent, Attendee } from '../firebase/calendarServices';
import {
  createCalendarEvent,
  getCalendarEvents,
  updateCalendarEvent,
  deleteCalendarEvent,
  subscribeToUserCalendarEvents,
  getTeamCalendarEvents,
  getPublicCalendarEvents,
  respondToMeetingInvitation,
  getInvitedEvents,
  subscribeToInvitedEvents,
  checkMeetingRoomAvailability,
  getMeetingRooms
} from '../firebase/calendarServices';
import { useAuth } from './useAuth';

export const useCalendar = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [teamEvents, setTeamEvents] = useState<CalendarEvent[]>([]);
  const [publicEvents, setPublicEvents] = useState<CalendarEvent[]>([]);
  const [invitedEvents, setInvitedEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Load initial events
  useEffect(() => {
    const loadEvents = async () => {
      try {
        setLoading(true);
        const allEvents = await getCalendarEvents();
        setEvents(allEvents);
      } catch (err) {
        setError('일정을 불러오는데 실패했습니다.');
        console.error('Error loading calendar events:', err);
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, []);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToUserCalendarEvents(user.uid, (updatedEvents) => {
      setEvents(updatedEvents);
    });

    return () => unsubscribe();
  }, [user]);

  // Subscribe to invited events
  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToInvitedEvents(user.uid, (updatedEvents) => {
      setInvitedEvents(updatedEvents);
    });

    return () => unsubscribe();
  }, [user]);

  // Create a new event
  const createEvent = async (eventData: Omit<CalendarEvent, 'id'>) => {
    try {
      setError(null);
      const eventId = await createCalendarEvent(eventData);
      return eventId;
    } catch (err) {
      setError('일정 생성에 실패했습니다.');
      console.error('Error creating event:', err);
      throw err;
    }
  };

  // Update an event
  const updateEvent = async (eventId: string, updates: Partial<Omit<CalendarEvent, 'id'>>) => {
    try {
      setError(null);
      await updateCalendarEvent(eventId, { ...updates, updatedAt: new Date() });
    } catch (err) {
      setError('일정 수정에 실패했습니다.');
      console.error('Error updating event:', err);
      throw err;
    }
  };

  // Delete an event
  const deleteEvent = async (eventId: string) => {
    try {
      setError(null);
      await deleteCalendarEvent(eventId);
    } catch (err) {
      setError('일정 삭제에 실패했습니다.');
      console.error('Error deleting event:', err);
      throw err;
    }
  };

  // Get events for a specific date
  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.startDate);
      return (
        eventDate.getFullYear() === date.getFullYear() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getDate() === date.getDate()
      );
    });
  };

  // Load team events
  const loadTeamEvents = async (teamId: string) => {
    if (!user) return;
    try {
      const teamEventsData = await getTeamCalendarEvents(teamId, user.uid);
      setTeamEvents(teamEventsData);
    } catch (err) {
      console.error('Error loading team events:', err);
    }
  };

  // Load public events
  const loadPublicEvents = async () => {
    try {
      const publicEventsData = await getPublicCalendarEvents();
      setPublicEvents(publicEventsData);
    } catch (err) {
      console.error('Error loading public events:', err);
    }
  };

  // Get all visible events (user + team + public)
  const getAllVisibleEvents = () => {
    return [...events, ...teamEvents, ...publicEvents];
  };

  // Get events for a specific month
  const getEventsForMonth = (year: number, month: number) => {
    return events.filter(event => {
      const eventDate = new Date(event.startDate);
      return eventDate.getFullYear() === year && eventDate.getMonth() === month;
    });
  };

  // Get upcoming events
  const getUpcomingEvents = (limit = 5) => {
    const now = new Date();
    return events
      .filter(event => new Date(event.startDate) >= now)
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
      .slice(0, limit);
  };

  // Respond to meeting invitation
  const respondToInvitation = async (eventId: string, status: 'accepted' | 'declined' | 'tentative') => {
    try {
      setError(null);
      if (!user) throw new Error('User not authenticated');
      await respondToMeetingInvitation(eventId, user.uid, status);
    } catch (err) {
      setError('초대 응답에 실패했습니다.');
      console.error('Error responding to invitation:', err);
      throw err;
    }
  };

  // Check meeting room availability
  const checkRoomAvailability = async (roomName: string, startDate: Date, endDate: Date, excludeEventId?: string) => {
    try {
      return await checkMeetingRoomAvailability(roomName, startDate, endDate, excludeEventId);
    } catch (err) {
      console.error('Error checking room availability:', err);
      throw err;
    }
  };

  // Get all meeting rooms
  const getAllMeetingRooms = async () => {
    try {
      return await getMeetingRooms();
    } catch (err) {
      console.error('Error getting meeting rooms:', err);
      throw err;
    }
  };

  return {
    events,
    teamEvents,
    publicEvents,
    invitedEvents,
    loading,
    error,
    createEvent,
    updateEvent,
    deleteEvent,
    respondToInvitation,
    checkRoomAvailability,
    getAllMeetingRooms,
    getEventsForDate,
    getEventsForMonth,
    getUpcomingEvents,
    loadTeamEvents,
    loadPublicEvents,
    getAllVisibleEvents,
    clearError: () => setError(null),
  };
};