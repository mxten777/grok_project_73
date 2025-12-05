import { useState, useEffect } from 'react';
import type { CalendarEvent } from '../firebase/calendarServices';
import {
  createCalendarEvent,
  getCalendarEvents,
  updateCalendarEvent,
  deleteCalendarEvent,
  subscribeToUserCalendarEvents
} from '../firebase/calendarServices';
import { useAuth } from './useAuth';

export const useCalendar = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
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

  return {
    events,
    loading,
    error,
    createEvent,
    updateEvent,
    deleteEvent,
    getEventsForDate,
    getEventsForMonth,
    getUpcomingEvents,
    clearError: () => setError(null),
  };
};