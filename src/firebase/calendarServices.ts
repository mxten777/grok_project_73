import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, orderBy, onSnapshot, QueryDocumentSnapshot } from 'firebase/firestore';
import { db } from './config';

export interface CalendarEvent {
  id?: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate?: Date;
  allDay: boolean;
  type: 'meeting' | 'personal' | 'deadline' | 'other';
  location?: string;
  attendees?: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CalendarEventDoc {
  id: string;
  title: string;
  description?: string;
  startDate: string; // ISO string
  endDate?: string; // ISO string
  allDay: boolean;
  type: 'meeting' | 'personal' | 'deadline' | 'other';
  location?: string;
  attendees?: string[];
  createdBy: string;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

// Convert Firestore document to CalendarEvent
const docToEvent = (doc: QueryDocumentSnapshot): CalendarEvent => {
  const data = doc.data();
  return {
    id: doc.id,
    title: data.title,
    description: data.description,
    startDate: new Date(data.startDate),
    endDate: data.endDate ? new Date(data.endDate) : undefined,
    allDay: data.allDay,
    type: data.type,
    location: data.location,
    attendees: data.attendees,
    createdBy: data.createdBy,
    createdAt: new Date(data.createdAt),
    updatedAt: new Date(data.updatedAt),
  };
};

// Convert CalendarEvent to Firestore document
const eventToDoc = (event: Omit<CalendarEvent, 'id'>): Omit<CalendarEventDoc, 'id'> => {
  return {
    title: event.title,
    description: event.description,
    startDate: event.startDate.toISOString(),
    endDate: event.endDate?.toISOString(),
    allDay: event.allDay,
    type: event.type,
    location: event.location,
    attendees: event.attendees,
    createdBy: event.createdBy,
    createdAt: event.createdAt.toISOString(),
    updatedAt: event.updatedAt.toISOString(),
  };
};

// Create a new calendar event
export const createCalendarEvent = async (event: Omit<CalendarEvent, 'id'>): Promise<string> => {
  try {
    const docData = eventToDoc(event);
    const docRef = await addDoc(collection(db, 'calendarEvents'), docData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating calendar event:', error);
    throw error;
  }
};

// Get all calendar events
export const getCalendarEvents = async (): Promise<CalendarEvent[]> => {
  try {
    const q = query(collection(db, 'calendarEvents'), orderBy('startDate', 'asc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(docToEvent);
  } catch (error) {
    console.error('Error getting calendar events:', error);
    throw error;
  }
};

// Get calendar events for a specific user
export const getUserCalendarEvents = async (userId: string): Promise<CalendarEvent[]> => {
  try {
    const q = query(
      collection(db, 'calendarEvents'),
      where('createdBy', '==', userId),
      orderBy('startDate', 'asc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(docToEvent);
  } catch (error) {
    console.error('Error getting user calendar events:', error);
    throw error;
  }
};

// Update a calendar event
export const updateCalendarEvent = async (eventId: string, updates: Partial<Omit<CalendarEvent, 'id'>>): Promise<void> => {
  try {
    const docRef = doc(db, 'calendarEvents', eventId);
    const updateData: Partial<Omit<CalendarEventDoc, 'id'>> = {};

    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.startDate !== undefined) updateData.startDate = updates.startDate.toISOString();
    if (updates.endDate !== undefined) updateData.endDate = updates.endDate?.toISOString();
    if (updates.allDay !== undefined) updateData.allDay = updates.allDay;
    if (updates.type !== undefined) updateData.type = updates.type;
    if (updates.location !== undefined) updateData.location = updates.location;
    if (updates.attendees !== undefined) updateData.attendees = updates.attendees;
    if (updates.updatedAt !== undefined) updateData.updatedAt = updates.updatedAt.toISOString();

    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error('Error updating calendar event:', error);
    throw error;
  }
};

// Delete a calendar event
export const deleteCalendarEvent = async (eventId: string): Promise<void> => {
  try {
    const docRef = doc(db, 'calendarEvents', eventId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    throw error;
  }
};

// Subscribe to calendar events for real-time updates
export const subscribeToCalendarEvents = (callback: (events: CalendarEvent[]) => void) => {
  const q = query(collection(db, 'calendarEvents'), orderBy('startDate', 'asc'));

  return onSnapshot(q, (querySnapshot) => {
    const events = querySnapshot.docs.map(docToEvent);
    callback(events);
  }, (error) => {
    console.error('Error subscribing to calendar events:', error);
  });
};

// Subscribe to user's calendar events for real-time updates
export const subscribeToUserCalendarEvents = (userId: string, callback: (events: CalendarEvent[]) => void) => {
  const q = query(
    collection(db, 'calendarEvents'),
    where('createdBy', '==', userId),
    orderBy('startDate', 'asc')
  );

  return onSnapshot(q, (querySnapshot) => {
    const events = querySnapshot.docs.map(docToEvent);
    callback(events);
  }, (error) => {
    console.error('Error subscribing to user calendar events:', error);
  });
};