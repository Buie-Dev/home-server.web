import { del, get, post, put } from 'api/base.api';
import { PEOPLE } from 'api/routes';

export const fetchPeople = () => get<any[]>(`${PEOPLE}/`);
export const createPerson = (data: { name: string }) => post(`${PEOPLE}/`, data);
export const deletePerson = (personId: number) => del(`${PEOPLE}/${personId}`);

export const fetchCategories = (personId: number) => get<any[]>(`${PEOPLE}/${personId}/categories`);
export const createCategory = (personId: number, data: { name: string; subcategoryNames: string[] }) =>
  post(`${PEOPLE}/${personId}/categories`, data);
export const updateCategory = (personId: number, id: number, data: { name: string }) =>
  put(`${PEOPLE}/${personId}/categories/${id}`, data);
export const deleteCategory = (personId: number, id: number) => del(`${PEOPLE}/${personId}/categories/${id}`);

export const createSubcategory = (personId: number, categoryId: number, data: { name: string }) =>
  post(`${PEOPLE}/${personId}/categories/${categoryId}/subcategories`, data);
export const updateSubcategory = (personId: number, id: number, data: { name: string }) =>
  put(`${PEOPLE}/${personId}/subcategories/${id}`, data);
export const deleteSubcategory = (personId: number, id: number) => del(`${PEOPLE}/${personId}/subcategories/${id}`);

export const fetchIdeas = (personId: number, params?: { categoryId?: number; subcategoryId?: number }) =>
  get<any[]>(`${PEOPLE}/${personId}/ideas`, params as Record<string, unknown>);
export const createIdea = (
  personId: number,
  data: { title: string; categoryId: number; subcategoryId?: number; notes?: string }
) => post(`${PEOPLE}/${personId}/ideas`, data as Record<string, unknown>);
export const updateIdea = (
  personId: number,
  id: number,
  data: { title: string; categoryId: number; subcategoryId?: number; notes?: string }
) => put(`${PEOPLE}/${personId}/ideas/${id}`, data as Record<string, unknown>);
export const deleteIdea = (personId: number, id: number) => del(`${PEOPLE}/${personId}/ideas/${id}`);
