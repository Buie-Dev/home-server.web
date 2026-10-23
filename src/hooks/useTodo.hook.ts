import { useRef, useState } from 'react';
import * as todoApi from 'api/todo.api';

export type TodoSubcategory = { id: number; name: string; categoryId: number };
export type TodoCategory = { id: number; name: string; subcategories: TodoSubcategory[]; itemCount: number };

export type Frequency = 'one_time' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export type ChecklistItem = { id: number; text: string; checked: boolean };

export type TodoTemplate = {
  id: number;
  title: string;
  notes?: string;
  frequency: Frequency;
  month?: number;
  categoryId: number;
  categoryName: string;
  subcategoryId?: number;
  subcategoryName?: string;
  checklistItems?: { id: number; text: string; sortOrder: number }[];
};

export type TodoTask = {
  id: number;
  templateId?: number;
  title: string;
  notes?: string;
  frequency: Frequency;
  categoryId: number;
  categoryName: string;
  subcategoryId?: number;
  subcategoryName?: string;
  completed: boolean;
  addedAt: string;
  completedAt?: string;
  checklistItems?: ChecklistItem[];
};

export type TodoHistoryItem = {
  id: number;
  title: string;
  frequency: Frequency;
  categoryId: number;
  categoryName: string;
  subcategoryId?: number;
  subcategoryName?: string;
  completedAt: string;
};

type TemplatePayload = {
  title: string;
  notes?: string;
  categoryId: number;
  subcategoryId?: number;
  frequency: Frequency;
  month?: number;
  checklistItems?: string[];
};

type TaskFilter = { categoryId?: number; subcategoryId?: number };

function useTodo() {
  const [categories, setCategories] = useState<TodoCategory[]>([]);
  const [templates, setTemplates] = useState<TodoTemplate[]>([]);
  const [tasks, setTasks] = useState<TodoTask[]>([]);
  const [history, setHistory] = useState<TodoHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const filterRef = useRef<TaskFilter>({});

  const fetchCategories = async () => {
    try {
      const data = await todoApi.fetchCategories();
      setCategories(data as TodoCategory[]);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchTemplates = async ({ categoryId, subcategoryId }: TaskFilter = {}) => {
    try {
      const data = await todoApi.fetchTemplates({ categoryId, subcategoryId });
      setTemplates(data as TodoTemplate[]);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchTasks = async ({ categoryId, subcategoryId }: TaskFilter = {}) => {
    filterRef.current = { categoryId, subcategoryId };
    setLoading(true);
    try {
      const data = await todoApi.fetchTasks({ categoryId, subcategoryId });
      setTasks(data as TodoTask[]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const refetchTasks = async () => {
    const { categoryId, subcategoryId } = filterRef.current;
    try {
      const data = await todoApi.fetchTasks({ categoryId, subcategoryId });
      setTasks(data as TodoTask[]);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchHistory = async ({ categoryId, subcategoryId }: TaskFilter = {}) => {
    setLoading(true);
    try {
      const data = await todoApi.fetchHistory({ categoryId, subcategoryId });
      setHistory(data as TodoHistoryItem[]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const createCategory = async ({ name, subcategoryNames }: { name: string; subcategoryNames: string[] }) => {
    await todoApi.createCategory({ name, subcategoryNames });
    await fetchCategories();
  };
  const updateCategory = async ({ id, name }: { id: number; name: string }) => {
    await todoApi.updateCategory({ id, name });
    await fetchCategories();
  };
  const deleteCategory = async ({ id }: { id: number }) => {
    await todoApi.deleteCategory({ id });
    await fetchCategories();
  };
  const createSubcategory = async ({ categoryId, name }: { categoryId: number; name: string }) => {
    await todoApi.createSubcategory({ categoryId, name });
    await fetchCategories();
  };
  const updateSubcategory = async ({ id, name }: { id: number; name: string }) => {
    await todoApi.updateSubcategory({ id, name });
    await fetchCategories();
  };
  const deleteSubcategory = async ({ id }: { id: number }) => {
    await todoApi.deleteSubcategory({ id });
    await fetchCategories();
  };

  const createTemplate = async ({ data }: { data: TemplatePayload }) => {
    await todoApi.createTemplate(data);
    await fetchTemplates(filterRef.current);
  };
  const updateTemplate = async ({ id, data }: { id: number; data: TemplatePayload }) => {
    await todoApi.updateTemplate({ id, data });
    await fetchTemplates(filterRef.current);
  };
  const deleteTemplate = async ({ id }: { id: number }) => {
    await todoApi.deleteTemplate({ id });
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  };

  const createTaskFromTemplate = async ({ templateId }: { templateId: number }) => {
    await todoApi.createTaskFromTemplate({ templateId });
    await refetchTasks();
  };
  const createDirectTask = async ({
    data,
  }: {
    data: { title: string; notes?: string; categoryId: number; subcategoryId?: number };
  }) => {
    await todoApi.createDirectTask(data);
    await refetchTasks();
  };
  const completeTask = async ({ id }: { id: number }) => {
    await todoApi.completeTask({ id });
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completed: true } : t)));
  };
  const archiveTask = async ({ id }: { id: number }) => {
    await todoApi.archiveTask({ id });
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };
  const archiveAllCompleted = async () => {
    await todoApi.archiveAllCompleted();
    setTasks((prev) => prev.filter((t) => !t.completed));
  };
  const deleteTask = async ({ id }: { id: number }) => {
    await todoApi.deleteTask({ id });
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };
  const updateTask = async ({
    id,
    data,
  }: {
    id: number;
    data: { title: string; notes?: string; categoryId: number; subcategoryId?: number };
  }) => {
    await todoApi.updateTask({ id, data });
    await refetchTasks();
  };

  const addChecklistItem = async ({ taskId, text }: { taskId: number; text: string }) => {
    await todoApi.addChecklistItem({ taskId, text });
    await refetchTasks();
  };
  const toggleChecklistItem = async ({ id, checked }: { id: number; checked: boolean }) => {
    await todoApi.updateChecklistItem({ id, checked });
    setTasks((prev) =>
      prev.map((t) => ({
        ...t,
        checklistItems: t.checklistItems?.map((c) => (c.id === id ? { ...c, checked } : c)),
      }))
    );
  };
  const deleteChecklistItem = async ({ id }: { id: number }) => {
    await todoApi.deleteChecklistItem({ id });
    setTasks((prev) =>
      prev.map((t) => ({
        ...t,
        checklistItems: t.checklistItems?.filter((c) => c.id !== id),
      }))
    );
  };

  return {
    categories,
    templates,
    tasks,
    history,
    loading,
    fetchCategories,
    fetchTemplates,
    fetchTasks,
    fetchHistory,
    createCategory,
    updateCategory,
    deleteCategory,
    createSubcategory,
    updateSubcategory,
    deleteSubcategory,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    createTaskFromTemplate,
    createDirectTask,
    completeTask,
    archiveTask,
    archiveAllCompleted,
    deleteTask,
    updateTask,
    addChecklistItem,
    toggleChecklistItem,
    deleteChecklistItem,
  };
}

export default useTodo;
