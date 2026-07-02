import { get, post, put, del } from 'api/base.api';
import { EVENTS } from 'api/routes';

type FetchEventsParams = { categoryId?: number; subcategoryId?: number; month?: number; year?: number };
type EventPayload = { title: string; description?: string; date: string; time?: string; categoryId: number; subcategoryId?: number };

export const fetchEvents = ({ categoryId, subcategoryId, month, year }: FetchEventsParams) =>
  get<any[]>(EVENTS, { categoryId, subcategoryId, month, year });
export const createEvent = (data: EventPayload) => post(EVENTS, data as Record<string, unknown>);
export const updateEvent = ({ id, data }: { id: number; data: EventPayload }) =>
  put(`${EVENTS}/${id}`, data as Record<string, unknown>);
export const deleteEvent = ({ id }: { id: number }) => del(`${EVENTS}/${id}`);

export const fetchCategories = () => get<any[]>(`${EVENTS}/categories`);
export const createCategory = ({ name, subcategoryNames }: { name: string; subcategoryNames: string[] }) =>
  post(`${EVENTS}/categories`, { name, subcategoryNames });
export const updateCategory = ({ id, name }: { id: number; name: string }) =>
  put(`${EVENTS}/categories/${id}`, { name });
export const deleteCategory = ({ id }: { id: number }) => del(`${EVENTS}/categories/${id}`);
export const createSubcategory = ({ categoryId, name }: { categoryId: number; name: string }) =>
  post(`${EVENTS}/categories/${categoryId}/subcategories`, { name });
export const updateSubcategory = ({ id, name }: { id: number; name: string }) =>
  put(`${EVENTS}/subcategories/${id}`, { name });
export const deleteSubcategory = ({ id }: { id: number }) => del(`${EVENTS}/subcategories/${id}`);
