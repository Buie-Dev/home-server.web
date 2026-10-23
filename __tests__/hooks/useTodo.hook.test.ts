import { renderHook, act } from '@testing-library/react';

vi.mock('api/todo.api', () => ({
  fetchCategories: vi.fn(),
  createCategory: vi.fn(),
  updateCategory: vi.fn(),
  deleteCategory: vi.fn(),
  createSubcategory: vi.fn(),
  updateSubcategory: vi.fn(),
  deleteSubcategory: vi.fn(),
  fetchTemplates: vi.fn(),
  createTemplate: vi.fn(),
  updateTemplate: vi.fn(),
  deleteTemplate: vi.fn(),
  fetchTasks: vi.fn(),
  createTaskFromTemplate: vi.fn(),
  createDirectTask: vi.fn(),
  updateTask: vi.fn(),
  completeTask: vi.fn(),
  archiveTask: vi.fn(),
  archiveAllCompleted: vi.fn(),
  deleteTask: vi.fn(),
  addChecklistItem: vi.fn(),
  updateChecklistItem: vi.fn(),
  deleteChecklistItem: vi.fn(),
  fetchHistory: vi.fn(),
}));

import * as todoApi from 'api/todo.api';
import useTodo from 'hooks/useTodo.hook';

const mockedFetchCategories = vi.mocked(todoApi.fetchCategories);
const mockedCreateCategory = vi.mocked(todoApi.createCategory);
const mockedFetchTemplates = vi.mocked(todoApi.fetchTemplates);
const mockedCreateTemplate = vi.mocked(todoApi.createTemplate);
const mockedDeleteTemplate = vi.mocked(todoApi.deleteTemplate);
const mockedFetchTasks = vi.mocked(todoApi.fetchTasks);
const mockedCreateTaskFromTemplate = vi.mocked(todoApi.createTaskFromTemplate);
const mockedCompleteTask = vi.mocked(todoApi.completeTask);
const mockedArchiveTask = vi.mocked(todoApi.archiveTask);
const mockedArchiveAllCompleted = vi.mocked(todoApi.archiveAllCompleted);
const mockedDeleteTask = vi.mocked(todoApi.deleteTask);
const mockedAddChecklistItem = vi.mocked(todoApi.addChecklistItem);
const mockedUpdateChecklistItem = vi.mocked(todoApi.updateChecklistItem);
const mockedDeleteChecklistItem = vi.mocked(todoApi.deleteChecklistItem);

describe('useTodo', () => {
  it('starts with empty state', () => {
    const { result } = renderHook(() => useTodo());
    expect(result.current.categories).toEqual([]);
    expect(result.current.templates).toEqual([]);
    expect(result.current.tasks).toEqual([]);
    expect(result.current.history).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it('fetchCategories loads categories', async () => {
    mockedFetchCategories.mockResolvedValue([{ id: 1, name: 'Work', subcategories: [], itemCount: 5 }]);
    const { result } = renderHook(() => useTodo());

    await act(async () => {
      await result.current.fetchCategories();
    });

    expect(result.current.categories).toHaveLength(1);
  });

  it('createCategory calls API and refetches', async () => {
    mockedCreateCategory.mockResolvedValue(undefined);
    mockedFetchCategories.mockResolvedValue([]);
    const { result } = renderHook(() => useTodo());

    await act(async () => {
      await result.current.createCategory({ name: 'Work', subcategoryNames: [] });
    });

    expect(mockedCreateCategory).toHaveBeenCalledWith({ name: 'Work', subcategoryNames: [] });
    expect(mockedFetchCategories).toHaveBeenCalled();
  });

  it('fetchTemplates loads templates', async () => {
    mockedFetchTemplates.mockResolvedValue([]);
    const { result } = renderHook(() => useTodo());

    await act(async () => {
      await result.current.fetchTemplates();
    });

    expect(mockedFetchTemplates).toHaveBeenCalled();
  });

  it('createTemplate calls API and refetches templates', async () => {
    mockedCreateTemplate.mockResolvedValue(undefined);
    mockedFetchTemplates.mockResolvedValue([]);
    const { result } = renderHook(() => useTodo());

    await act(async () => {
      await result.current.createTemplate({ data: { title: 'T', categoryId: 1, frequency: 'weekly' as const } });
    });

    expect(mockedCreateTemplate).toHaveBeenCalled();
  });

  it('deleteTemplate removes template locally', async () => {
    mockedFetchTemplates.mockResolvedValue([
      { id: 1, title: 'A', frequency: 'weekly', categoryId: 1, categoryName: 'Work' },
      { id: 2, title: 'B', frequency: 'daily', categoryId: 1, categoryName: 'Work' },
    ]);
    mockedDeleteTemplate.mockResolvedValue(undefined);
    const { result } = renderHook(() => useTodo());

    await act(async () => {
      await result.current.fetchTemplates();
    });

    await act(async () => {
      await result.current.deleteTemplate({ id: 1 });
    });

    expect(result.current.templates).toHaveLength(1);
    expect(result.current.templates[0].id).toBe(2);
  });

  it('fetchTasks loads tasks with loading state', async () => {
    mockedFetchTasks.mockResolvedValue([
      {
        id: 1,
        title: 'Do stuff',
        frequency: 'one_time',
        categoryId: 1,
        categoryName: 'Work',
        completed: false,
        addedAt: '2024-01-01',
      },
    ]);
    const { result } = renderHook(() => useTodo());

    await act(async () => {
      await result.current.fetchTasks();
    });

    expect(result.current.tasks).toHaveLength(1);
    expect(result.current.loading).toBe(false);
  });

  it('createTaskFromTemplate calls API and refetches tasks', async () => {
    mockedCreateTaskFromTemplate.mockResolvedValue(undefined);
    mockedFetchTasks.mockResolvedValue([]);
    const { result } = renderHook(() => useTodo());

    await act(async () => {
      await result.current.createTaskFromTemplate({ templateId: 5 });
    });

    expect(mockedCreateTaskFromTemplate).toHaveBeenCalledWith({ templateId: 5 });
  });

  it('completeTask marks task completed locally', async () => {
    mockedFetchTasks.mockResolvedValue([
      {
        id: 1,
        title: 'Task',
        frequency: 'one_time',
        categoryId: 1,
        categoryName: 'W',
        completed: false,
        addedAt: '2024-01-01',
      },
    ]);
    mockedCompleteTask.mockResolvedValue(undefined);
    const { result } = renderHook(() => useTodo());

    await act(async () => {
      await result.current.fetchTasks();
    });

    await act(async () => {
      await result.current.completeTask({ id: 1 });
    });

    expect(result.current.tasks[0].completed).toBe(true);
  });

  it('archiveTask removes task locally', async () => {
    mockedFetchTasks.mockResolvedValue([
      {
        id: 1,
        title: 'A',
        frequency: 'one_time',
        categoryId: 1,
        categoryName: 'W',
        completed: false,
        addedAt: '2024-01-01',
      },
      {
        id: 2,
        title: 'B',
        frequency: 'one_time',
        categoryId: 1,
        categoryName: 'W',
        completed: false,
        addedAt: '2024-01-01',
      },
    ]);
    mockedArchiveTask.mockResolvedValue(undefined);
    const { result } = renderHook(() => useTodo());

    await act(async () => {
      await result.current.fetchTasks();
    });

    await act(async () => {
      await result.current.archiveTask({ id: 1 });
    });

    expect(result.current.tasks).toHaveLength(1);
    expect(result.current.tasks[0].id).toBe(2);
  });

  it('archiveAllCompleted removes completed tasks locally', async () => {
    mockedFetchTasks.mockResolvedValue([
      {
        id: 1,
        title: 'A',
        frequency: 'one_time',
        categoryId: 1,
        categoryName: 'W',
        completed: true,
        addedAt: '2024-01-01',
      },
      {
        id: 2,
        title: 'B',
        frequency: 'one_time',
        categoryId: 1,
        categoryName: 'W',
        completed: false,
        addedAt: '2024-01-01',
      },
    ]);
    mockedArchiveAllCompleted.mockResolvedValue(undefined);
    const { result } = renderHook(() => useTodo());

    await act(async () => {
      await result.current.fetchTasks();
    });

    await act(async () => {
      await result.current.archiveAllCompleted();
    });

    expect(result.current.tasks).toHaveLength(1);
    expect(result.current.tasks[0].id).toBe(2);
  });

  it('deleteTask removes task locally', async () => {
    mockedFetchTasks.mockResolvedValue([
      {
        id: 1,
        title: 'A',
        frequency: 'one_time',
        categoryId: 1,
        categoryName: 'W',
        completed: false,
        addedAt: '2024-01-01',
      },
    ]);
    mockedDeleteTask.mockResolvedValue(undefined);
    const { result } = renderHook(() => useTodo());

    await act(async () => {
      await result.current.fetchTasks();
    });

    await act(async () => {
      await result.current.deleteTask({ id: 1 });
    });

    expect(result.current.tasks).toEqual([]);
  });

  it('addChecklistItem calls API and refetches', async () => {
    mockedAddChecklistItem.mockResolvedValue(undefined);
    mockedFetchTasks.mockResolvedValue([]);
    const { result } = renderHook(() => useTodo());

    await act(async () => {
      await result.current.addChecklistItem({ taskId: 1, text: 'Step 1' });
    });

    expect(mockedAddChecklistItem).toHaveBeenCalledWith({ taskId: 1, text: 'Step 1' });
  });

  it('toggleChecklistItem updates item locally', async () => {
    mockedFetchTasks.mockResolvedValue([
      {
        id: 1,
        title: 'A',
        frequency: 'one_time' as const,
        categoryId: 1,
        categoryName: 'W',
        completed: false,
        addedAt: '2024-01-01',
        checklistItems: [{ id: 10, text: 'Step', checked: false }],
      },
    ]);
    mockedUpdateChecklistItem.mockResolvedValue(undefined);
    const { result } = renderHook(() => useTodo());

    await act(async () => {
      await result.current.fetchTasks();
    });

    await act(async () => {
      await result.current.toggleChecklistItem({ id: 10, checked: true });
    });

    expect(result.current.tasks[0].checklistItems?.[0].checked).toBe(true);
  });

  it('deleteChecklistItem removes item locally', async () => {
    mockedFetchTasks.mockResolvedValue([
      {
        id: 1,
        title: 'A',
        frequency: 'one_time' as const,
        categoryId: 1,
        categoryName: 'W',
        completed: false,
        addedAt: '2024-01-01',
        checklistItems: [
          { id: 10, text: 'Step 1', checked: false },
          { id: 11, text: 'Step 2', checked: false },
        ],
      },
    ]);
    mockedDeleteChecklistItem.mockResolvedValue(undefined);
    const { result } = renderHook(() => useTodo());

    await act(async () => {
      await result.current.fetchTasks();
    });

    await act(async () => {
      await result.current.deleteChecklistItem({ id: 10 });
    });

    expect(result.current.tasks[0].checklistItems).toHaveLength(1);
    expect(result.current.tasks[0].checklistItems?.[0].id).toBe(11);
  });
});
