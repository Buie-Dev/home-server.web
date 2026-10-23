vi.mock('api/base.api', () => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  del: vi.fn(),
}));

import * as base from 'api/base.api';
import {
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory,
  fetchTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  fetchTasks,
  createTaskFromTemplate,
  createDirectTask,
  updateTask,
  completeTask,
  archiveTask,
  archiveAllCompleted,
  deleteTask,
  addChecklistItem,
  updateChecklistItem,
  deleteChecklistItem,
  fetchHistory,
} from 'api/todo.api';

const mockedGet = vi.mocked(base.get);
const mockedPost = vi.mocked(base.post);
const mockedPut = vi.mocked(base.put);
const mockedDel = vi.mocked(base.del);

describe('todo.api', () => {
  describe('categories', () => {
    it('fetchCategories calls get', async () => {
      mockedGet.mockResolvedValue([]);
      await fetchCategories();
      expect(mockedGet).toHaveBeenCalledWith(expect.stringContaining('/todo/categories'));
    });

    it('createCategory posts name and subcategoryNames', async () => {
      mockedPost.mockResolvedValue(undefined);
      await createCategory({ name: 'Work', subcategoryNames: ['Urgent'] });
      expect(mockedPost).toHaveBeenCalledWith(expect.stringContaining('/todo/categories'), {
        name: 'Work',
        subcategoryNames: ['Urgent'],
      });
    });

    it('createCategory defaults subcategoryNames to empty array', async () => {
      mockedPost.mockResolvedValue(undefined);
      await createCategory({ name: 'Personal' });
      expect(mockedPost).toHaveBeenCalledWith(expect.stringContaining('/todo/categories'), {
        name: 'Personal',
        subcategoryNames: [],
      });
    });

    it('updateCategory puts to categories/:id', async () => {
      mockedPut.mockResolvedValue(undefined);
      await updateCategory({ id: 1, name: 'Updated' });
      expect(mockedPut).toHaveBeenCalledWith(expect.stringContaining('/todo/categories/1'), { name: 'Updated' });
    });

    it('deleteCategory deletes categories/:id', async () => {
      mockedDel.mockResolvedValue(undefined);
      await deleteCategory({ id: 1 });
      expect(mockedDel).toHaveBeenCalledWith(expect.stringContaining('/todo/categories/1'));
    });
  });

  describe('subcategories', () => {
    it('createSubcategory posts to categories/:id/subcategories', async () => {
      mockedPost.mockResolvedValue(undefined);
      await createSubcategory({ categoryId: 1, name: 'Sub' });
      expect(mockedPost).toHaveBeenCalledWith(expect.stringContaining('/todo/categories/1/subcategories'), {
        name: 'Sub',
      });
    });

    it('updateSubcategory puts to subcategories/:id', async () => {
      mockedPut.mockResolvedValue(undefined);
      await updateSubcategory({ id: 5, name: 'Renamed' });
      expect(mockedPut).toHaveBeenCalledWith(expect.stringContaining('/todo/subcategories/5'), { name: 'Renamed' });
    });

    it('deleteSubcategory deletes subcategories/:id', async () => {
      mockedDel.mockResolvedValue(undefined);
      await deleteSubcategory({ id: 5 });
      expect(mockedDel).toHaveBeenCalledWith(expect.stringContaining('/todo/subcategories/5'));
    });
  });

  describe('templates', () => {
    it('fetchTemplates calls get with no filters', async () => {
      mockedGet.mockResolvedValue([]);
      await fetchTemplates();
      expect(mockedGet).toHaveBeenCalledWith(expect.stringContaining('/todo/templates'));
    });

    it('fetchTemplates appends query string for categoryId', async () => {
      mockedGet.mockResolvedValue([]);
      await fetchTemplates({ categoryId: 3 });
      expect(mockedGet).toHaveBeenCalledWith(expect.stringContaining('/todo/templates?categoryId=3'));
    });

    it('createTemplate posts data', async () => {
      mockedPost.mockResolvedValue(undefined);
      await createTemplate({ title: 'T', categoryId: 1, frequency: 'weekly' });
      expect(mockedPost).toHaveBeenCalledWith(
        expect.stringContaining('/todo/templates'),
        expect.objectContaining({ title: 'T' })
      );
    });

    it('updateTemplate puts to templates/:id', async () => {
      mockedPut.mockResolvedValue(undefined);
      await updateTemplate({ id: 1, data: { title: 'U', categoryId: 1, frequency: 'daily' } });
      expect(mockedPut).toHaveBeenCalledWith(
        expect.stringContaining('/todo/templates/1'),
        expect.objectContaining({ title: 'U' })
      );
    });

    it('deleteTemplate deletes templates/:id', async () => {
      mockedDel.mockResolvedValue(undefined);
      await deleteTemplate({ id: 1 });
      expect(mockedDel).toHaveBeenCalledWith(expect.stringContaining('/todo/templates/1'));
    });
  });

  describe('tasks', () => {
    it('fetchTasks calls get with no filters', async () => {
      mockedGet.mockResolvedValue([]);
      await fetchTasks();
      expect(mockedGet).toHaveBeenCalledWith(expect.stringContaining('/todo/tasks'));
    });

    it('createTaskFromTemplate posts templateId', async () => {
      mockedPost.mockResolvedValue(undefined);
      await createTaskFromTemplate({ templateId: 5 });
      expect(mockedPost).toHaveBeenCalledWith(expect.stringContaining('/todo/tasks'), { templateId: 5 });
    });

    it('createDirectTask posts to tasks/direct', async () => {
      mockedPost.mockResolvedValue(undefined);
      await createDirectTask({ title: 'Quick', categoryId: 1 });
      expect(mockedPost).toHaveBeenCalledWith(
        expect.stringContaining('/todo/tasks/direct'),
        expect.objectContaining({ title: 'Quick' })
      );
    });

    it('updateTask puts to tasks/:id', async () => {
      mockedPut.mockResolvedValue(undefined);
      await updateTask({ id: 1, data: { title: 'Updated', categoryId: 1 } });
      expect(mockedPut).toHaveBeenCalledWith(
        expect.stringContaining('/todo/tasks/1'),
        expect.objectContaining({ title: 'Updated' })
      );
    });

    it('completeTask puts to tasks/:id/complete', async () => {
      mockedPut.mockResolvedValue(undefined);
      await completeTask({ id: 1 });
      expect(mockedPut).toHaveBeenCalledWith(expect.stringContaining('/todo/tasks/1/complete'), {});
    });

    it('archiveTask puts to tasks/:id/archive', async () => {
      mockedPut.mockResolvedValue(undefined);
      await archiveTask({ id: 1 });
      expect(mockedPut).toHaveBeenCalledWith(expect.stringContaining('/todo/tasks/1/archive'), {});
    });

    it('archiveAllCompleted puts to tasks/archive-completed', async () => {
      mockedPut.mockResolvedValue(undefined);
      await archiveAllCompleted();
      expect(mockedPut).toHaveBeenCalledWith(expect.stringContaining('/todo/tasks/archive-completed'), {});
    });

    it('deleteTask deletes tasks/:id', async () => {
      mockedDel.mockResolvedValue(undefined);
      await deleteTask({ id: 1 });
      expect(mockedDel).toHaveBeenCalledWith(expect.stringContaining('/todo/tasks/1'));
    });
  });

  describe('checklist', () => {
    it('addChecklistItem posts to tasks/:id/checklist', async () => {
      mockedPost.mockResolvedValue(undefined);
      await addChecklistItem({ taskId: 1, text: 'Step 1' });
      expect(mockedPost).toHaveBeenCalledWith(expect.stringContaining('/todo/tasks/1/checklist'), { text: 'Step 1' });
    });

    it('updateChecklistItem puts to checklist/:id', async () => {
      mockedPut.mockResolvedValue(undefined);
      await updateChecklistItem({ id: 5, checked: true });
      expect(mockedPut).toHaveBeenCalledWith(
        expect.stringContaining('/todo/checklist/5'),
        expect.objectContaining({ checked: true })
      );
    });

    it('deleteChecklistItem deletes checklist/:id', async () => {
      mockedDel.mockResolvedValue(undefined);
      await deleteChecklistItem({ id: 5 });
      expect(mockedDel).toHaveBeenCalledWith(expect.stringContaining('/todo/checklist/5'));
    });
  });

  describe('history', () => {
    it('fetchHistory calls get with no filters', async () => {
      mockedGet.mockResolvedValue([]);
      await fetchHistory();
      expect(mockedGet).toHaveBeenCalledWith(expect.stringContaining('/todo/history'));
    });

    it('fetchHistory appends query string for filters', async () => {
      mockedGet.mockResolvedValue([]);
      await fetchHistory({ categoryId: 2, subcategoryId: 3 });
      expect(mockedGet).toHaveBeenCalledWith(expect.stringContaining('categoryId=2'));
    });
  });
});
