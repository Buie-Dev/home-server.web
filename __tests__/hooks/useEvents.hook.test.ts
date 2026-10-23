import { renderHook, act } from '@testing-library/react';

vi.mock('api/events.api', () => ({
  fetchEvents: vi.fn(),
  createEvent: vi.fn(),
  updateEvent: vi.fn(),
  deleteEvent: vi.fn(),
  fetchCategories: vi.fn(),
  createCategory: vi.fn(),
  updateCategory: vi.fn(),
  deleteCategory: vi.fn(),
  createSubcategory: vi.fn(),
  updateSubcategory: vi.fn(),
  deleteSubcategory: vi.fn(),
}));

import * as eventsApi from 'api/events.api';
import useEvents from 'hooks/useEvents.hook';

const mockedFetchEvents = vi.mocked(eventsApi.fetchEvents);
const mockedCreateEvent = vi.mocked(eventsApi.createEvent);
const mockedDeleteEvent = vi.mocked(eventsApi.deleteEvent);
const mockedFetchCategories = vi.mocked(eventsApi.fetchCategories);
const mockedCreateCategory = vi.mocked(eventsApi.createCategory);

describe('useEvents', () => {
  it('starts with empty state', () => {
    const { result } = renderHook(() => useEvents());
    expect(result.current.events).toEqual([]);
    expect(result.current.categories).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it('fetchEvents loads events with filters', async () => {
    mockedFetchEvents.mockResolvedValue([{ id: 1, title: 'BBQ', date: '2024-06-15', categoryId: 1, categoryName: 'Social' }]);
    const { result } = renderHook(() => useEvents());

    await act(async () => {
      await result.current.fetchEvents({ month: 6, year: 2024 });
    });

    expect(result.current.events).toHaveLength(1);
    expect(result.current.loading).toBe(false);
  });

  it('createEvent calls API and refetches', async () => {
    mockedCreateEvent.mockResolvedValue(undefined);
    mockedFetchEvents.mockResolvedValue([]);
    const { result } = renderHook(() => useEvents());

    await act(async () => {
      await result.current.createEvent({ data: { title: 'Party', date: '2024-07-01', categoryId: 1 } });
    });

    expect(mockedCreateEvent).toHaveBeenCalledWith({ title: 'Party', date: '2024-07-01', categoryId: 1 });
    expect(mockedFetchEvents).toHaveBeenCalled();
  });

  it('deleteEvent removes event locally', async () => {
    mockedFetchEvents.mockResolvedValue([
      { id: 1, title: 'A', date: '2024-06-15', categoryId: 1, categoryName: 'S' },
      { id: 2, title: 'B', date: '2024-06-16', categoryId: 1, categoryName: 'S' },
    ]);
    mockedDeleteEvent.mockResolvedValue(undefined);
    const { result } = renderHook(() => useEvents());

    await act(async () => {
      await result.current.fetchEvents({});
    });

    await act(async () => {
      await result.current.deleteEvent({ id: 1 });
    });

    expect(result.current.events).toHaveLength(1);
    expect(result.current.events[0].id).toBe(2);
  });

  it('fetchCategories loads categories', async () => {
    mockedFetchCategories.mockResolvedValue([{ id: 1, name: 'Social', subcategories: [], itemCount: 3 }]);
    const { result } = renderHook(() => useEvents());

    await act(async () => {
      await result.current.fetchCategories();
    });

    expect(result.current.categories).toHaveLength(1);
  });

  it('createCategory calls API and refetches categories', async () => {
    mockedCreateCategory.mockResolvedValue(undefined);
    mockedFetchCategories.mockResolvedValue([]);
    const { result } = renderHook(() => useEvents());

    await act(async () => {
      await result.current.createCategory({ name: 'Work', subcategoryNames: [] });
    });

    expect(mockedCreateCategory).toHaveBeenCalled();
    expect(mockedFetchCategories).toHaveBeenCalled();
  });

  it('refetchEvents uses stored filters', async () => {
    mockedFetchEvents.mockResolvedValue([]);
    const { result } = renderHook(() => useEvents());

    await act(async () => {
      await result.current.fetchEvents({ month: 3, year: 2024 });
    });

    mockedFetchEvents.mockClear();
    mockedFetchEvents.mockResolvedValue([]);

    await act(async () => {
      await result.current.refetchEvents();
    });

    expect(mockedFetchEvents).toHaveBeenCalledWith({ categoryId: undefined, subcategoryId: undefined, month: 3, year: 2024 });
  });
});
