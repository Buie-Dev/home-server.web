vi.mock('api/base.api', () => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  del: vi.fn(),
}));

import * as base from 'api/base.api';
import {
  fetchEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory,
} from 'api/events.api';

const mockedGet = vi.mocked(base.get);
const mockedPost = vi.mocked(base.post);
const mockedPut = vi.mocked(base.put);
const mockedDel = vi.mocked(base.del);

describe('events.api', () => {
  describe('events', () => {
    it('fetchEvents calls get with filters', async () => {
      mockedGet.mockResolvedValue([]);
      await fetchEvents({ month: 6, year: 2024 });
      expect(mockedGet).toHaveBeenCalledWith(expect.stringContaining('/events'), {
        categoryId: undefined,
        subcategoryId: undefined,
        month: 6,
        year: 2024,
      });
    });

    it('createEvent posts event data', async () => {
      mockedPost.mockResolvedValue(undefined);
      await createEvent({ title: 'BBQ', date: '2024-06-15', categoryId: 1 });
      expect(mockedPost).toHaveBeenCalledWith(
        expect.stringContaining('/events'),
        expect.objectContaining({ title: 'BBQ' })
      );
    });

    it('updateEvent puts to events/:id', async () => {
      mockedPut.mockResolvedValue(undefined);
      await updateEvent({ id: 1, data: { title: 'Updated', date: '2024-06-16', categoryId: 1 } });
      expect(mockedPut).toHaveBeenCalledWith(
        expect.stringContaining('/events/1'),
        expect.objectContaining({ title: 'Updated' })
      );
    });

    it('deleteEvent deletes events/:id', async () => {
      mockedDel.mockResolvedValue(undefined);
      await deleteEvent({ id: 1 });
      expect(mockedDel).toHaveBeenCalledWith(expect.stringContaining('/events/1'));
    });
  });

  describe('categories', () => {
    it('fetchCategories calls get', async () => {
      mockedGet.mockResolvedValue([]);
      await fetchCategories();
      expect(mockedGet).toHaveBeenCalledWith(expect.stringContaining('/events/categories'));
    });

    it('createCategory posts name and subcategoryNames', async () => {
      mockedPost.mockResolvedValue(undefined);
      await createCategory({ name: 'Social', subcategoryNames: ['Party'] });
      expect(mockedPost).toHaveBeenCalledWith(expect.stringContaining('/events/categories'), {
        name: 'Social',
        subcategoryNames: ['Party'],
      });
    });

    it('updateCategory puts to categories/:id', async () => {
      mockedPut.mockResolvedValue(undefined);
      await updateCategory({ id: 1, name: 'Updated' });
      expect(mockedPut).toHaveBeenCalledWith(expect.stringContaining('/events/categories/1'), { name: 'Updated' });
    });

    it('deleteCategory deletes categories/:id', async () => {
      mockedDel.mockResolvedValue(undefined);
      await deleteCategory({ id: 1 });
      expect(mockedDel).toHaveBeenCalledWith(expect.stringContaining('/events/categories/1'));
    });
  });

  describe('subcategories', () => {
    it('createSubcategory posts to categories/:id/subcategories', async () => {
      mockedPost.mockResolvedValue(undefined);
      await createSubcategory({ categoryId: 1, name: 'Sub' });
      expect(mockedPost).toHaveBeenCalledWith(expect.stringContaining('/events/categories/1/subcategories'), {
        name: 'Sub',
      });
    });

    it('updateSubcategory puts to subcategories/:id', async () => {
      mockedPut.mockResolvedValue(undefined);
      await updateSubcategory({ id: 5, name: 'Renamed' });
      expect(mockedPut).toHaveBeenCalledWith(expect.stringContaining('/events/subcategories/5'), { name: 'Renamed' });
    });

    it('deleteSubcategory deletes subcategories/:id', async () => {
      mockedDel.mockResolvedValue(undefined);
      await deleteSubcategory({ id: 5 });
      expect(mockedDel).toHaveBeenCalledWith(expect.stringContaining('/events/subcategories/5'));
    });
  });
});
