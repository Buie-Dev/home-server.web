import { useRef, useState } from 'react';
import * as eventsApi from 'api/events.api';

export type EventSubcategory = { id: number; name: string; categoryId: number };
export type EventCategory = { id: number; name: string; subcategories: EventSubcategory[]; itemCount: number };
export type CalendarEvent = {
  id: number;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:MM
  categoryId: number;
  categoryName: string;
  subcategoryId?: number;
  subcategoryName?: string;
};

type EventPayload = {
  title: string;
  description?: string;
  date: string;
  time?: string;
  categoryId: number;
  subcategoryId?: number;
};
type FilterRef = { categoryId?: number; subcategoryId?: number; month?: number; year?: number };

function useEvents() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [categories, setCategories] = useState<EventCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const filterRef = useRef<FilterRef>({});

  const fetchEvents = async ({ categoryId, subcategoryId, month, year }: FilterRef = {}) => {
    filterRef.current = { categoryId, subcategoryId, month, year };
    setLoading(true);
    try {
      const data = await eventsApi.fetchEvents({ categoryId, subcategoryId, month, year });
      setEvents(data as CalendarEvent[]);
    } catch (e) {
      console.error('fetchEvents', e);
    } finally {
      setLoading(false);
    }
  };

  const refetchEvents = async () => {
    const { categoryId, subcategoryId, month, year } = filterRef.current;
    try {
      const data = await eventsApi.fetchEvents({ categoryId, subcategoryId, month, year });
      setEvents(data as CalendarEvent[]);
    } catch (e) {
      console.error('refetchEvents', e);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await eventsApi.fetchCategories();
      setCategories(data as EventCategory[]);
    } catch (e) {
      console.error('fetchCategories', e);
    }
  };

  const createEvent = async ({ data }: { data: EventPayload }) => {
    await eventsApi.createEvent(data);
    await refetchEvents();
  };

  const updateEvent = async ({ id, data }: { id: number; data: EventPayload }) => {
    await eventsApi.updateEvent({ id, data });
    await refetchEvents();
  };

  const deleteEvent = async ({ id }: { id: number }) => {
    await eventsApi.deleteEvent({ id });
    setEvents((prev) => prev.filter((e) => e.id !== id));
  };

  const createCategory = async ({ name, subcategoryNames }: { name: string; subcategoryNames: string[] }) => {
    await eventsApi.createCategory({ name, subcategoryNames });
    await fetchCategories();
  };

  const updateCategory = async ({ id, name }: { id: number; name: string }) => {
    await eventsApi.updateCategory({ id, name });
    await fetchCategories();
  };

  const deleteCategory = async ({ id }: { id: number }) => {
    await eventsApi.deleteCategory({ id });
    await fetchCategories();
  };

  const createSubcategory = async ({ categoryId, name }: { categoryId: number; name: string }) => {
    await eventsApi.createSubcategory({ categoryId, name });
    await fetchCategories();
  };

  const updateSubcategory = async ({ id, name }: { id: number; name: string }) => {
    await eventsApi.updateSubcategory({ id, name });
    await fetchCategories();
  };

  const deleteSubcategory = async ({ id }: { id: number }) => {
    await eventsApi.deleteSubcategory({ id });
    await fetchCategories();
  };

  return {
    events,
    categories,
    loading,
    fetchEvents,
    refetchEvents,
    fetchCategories,
    createEvent,
    updateEvent,
    deleteEvent,
    createCategory,
    updateCategory,
    deleteCategory,
    createSubcategory,
    updateSubcategory,
    deleteSubcategory,
  };
}

export default useEvents;
