import { get, post, put, del } from 'api/base.api';
import { TODO } from 'api/routes';

type CategoryPayload = { name: string; subcategoryNames?: string[] };

export const fetchCategories = () => get(`${TODO}/categories`);
export const createCategory = ({ name, subcategoryNames }: CategoryPayload) =>
  post(`${TODO}/categories`, { name, subcategoryNames: subcategoryNames ?? [] });
export const updateCategory = ({ id, name }: { id: number; name: string }) => put(`${TODO}/categories/${id}`, { name });
export const deleteCategory = ({ id }: { id: number }) => del(`${TODO}/categories/${id}`);
export const createSubcategory = ({ categoryId, name }: { categoryId: number; name: string }) =>
  post(`${TODO}/categories/${categoryId}/subcategories`, { name });
export const updateSubcategory = ({ id, name }: { id: number; name: string }) =>
  put(`${TODO}/subcategories/${id}`, { name });
export const deleteSubcategory = ({ id }: { id: number }) => del(`${TODO}/subcategories/${id}`);

type TemplatePayload = {
  title: string;
  notes?: string;
  categoryId: number;
  subcategoryId?: number;
  frequency: string;
  month?: number;
  checklistItems?: string[];
};
export const fetchTemplates = ({ categoryId, subcategoryId }: { categoryId?: number; subcategoryId?: number } = {}) => {
  const params = new URLSearchParams();
  if (categoryId) params.set('categoryId', String(categoryId));
  if (subcategoryId) params.set('subcategoryId', String(subcategoryId));
  const qs = params.toString();
  return get(`${TODO}/templates${qs ? `?${qs}` : ''}`);
};
export const createTemplate = (data: TemplatePayload) => post(`${TODO}/templates`, data as any);
export const updateTemplate = ({ id, data }: { id: number; data: TemplatePayload }) =>
  put(`${TODO}/templates/${id}`, data as any);
export const deleteTemplate = ({ id }: { id: number }) => del(`${TODO}/templates/${id}`);

export const fetchTasks = ({ categoryId, subcategoryId }: { categoryId?: number; subcategoryId?: number } = {}) => {
  const params = new URLSearchParams();
  if (categoryId) params.set('categoryId', String(categoryId));
  if (subcategoryId) params.set('subcategoryId', String(subcategoryId));
  const qs = params.toString();
  return get(`${TODO}/tasks${qs ? `?${qs}` : ''}`);
};
export const createTaskFromTemplate = ({ templateId }: { templateId: number }) => post(`${TODO}/tasks`, { templateId });
export const createDirectTask = (data: {
  title: string;
  notes?: string;
  categoryId: number;
  subcategoryId?: number;
  frequency?: string;
}) => post(`${TODO}/tasks/direct`, data as any);
export const updateTask = ({
  id,
  data,
}: {
  id: number;
  data: { title: string; notes?: string; categoryId: number; subcategoryId?: number };
}) => put(`${TODO}/tasks/${id}`, data as any);
export const completeTask = ({ id }: { id: number }) => put(`${TODO}/tasks/${id}/complete`, {});
export const archiveTask = ({ id }: { id: number }) => put(`${TODO}/tasks/${id}/archive`, {});
export const archiveAllCompleted = () => put(`${TODO}/tasks/archive-completed`, {});
export const deleteTask = ({ id }: { id: number }) => del(`${TODO}/tasks/${id}`);

export const fetchHistory = ({ categoryId, subcategoryId }: { categoryId?: number; subcategoryId?: number } = {}) => {
  const params = new URLSearchParams();
  if (categoryId) params.set('categoryId', String(categoryId));
  if (subcategoryId) params.set('subcategoryId', String(subcategoryId));
  const qs = params.toString();
  return get(`${TODO}/history${qs ? `?${qs}` : ''}`);
};

export const addChecklistItem = ({ taskId, text }: { taskId: number; text: string }) =>
  post(`${TODO}/tasks/${taskId}/checklist`, { text });
export const updateChecklistItem = ({ id, text, checked }: { id: number; text?: string; checked?: boolean }) =>
  put(`${TODO}/checklist/${id}`, { text, checked } as any);
export const deleteChecklistItem = ({ id }: { id: number }) => del(`${TODO}/checklist/${id}`);
