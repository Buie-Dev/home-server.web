vi.mock('api/base.api', () => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  del: vi.fn(),
}));

import * as base from 'api/base.api';
import {
  fetchPeople, createPerson, deletePerson,
  fetchCategories, createCategory, updateCategory, deleteCategory,
  createSubcategory, updateSubcategory, deleteSubcategory,
  fetchIdeas, createIdea, updateIdea, deleteIdea,
} from 'api/people.api';

const mockedGet = vi.mocked(base.get);
const mockedPost = vi.mocked(base.post);
const mockedPut = vi.mocked(base.put);
const mockedDel = vi.mocked(base.del);

describe('people.api', () => {
  describe('people', () => {
    it('fetchPeople calls get', async () => {
      mockedGet.mockResolvedValue([]);
      await fetchPeople();
      expect(mockedGet).toHaveBeenCalledWith(expect.stringContaining('/people/'));
    });

    it('createPerson posts name', async () => {
      mockedPost.mockResolvedValue(undefined);
      await createPerson({ name: 'Alice' });
      expect(mockedPost).toHaveBeenCalledWith(expect.stringContaining('/people/'), { name: 'Alice' });
    });

    it('deletePerson deletes person/:id', async () => {
      mockedDel.mockResolvedValue(undefined);
      await deletePerson(1);
      expect(mockedDel).toHaveBeenCalledWith(expect.stringContaining('/people/1'));
    });
  });

  describe('categories', () => {
    it('fetchCategories calls get with personId', async () => {
      mockedGet.mockResolvedValue([]);
      await fetchCategories(1);
      expect(mockedGet).toHaveBeenCalledWith(expect.stringContaining('/people/1/categories'));
    });

    it('createCategory posts name and subcategoryNames', async () => {
      mockedPost.mockResolvedValue(undefined);
      await createCategory(1, { name: 'Gifts', subcategoryNames: ['Birthday'] });
      expect(mockedPost).toHaveBeenCalledWith(expect.stringContaining('/people/1/categories'), { name: 'Gifts', subcategoryNames: ['Birthday'] });
    });

    it('updateCategory puts to categories/:id', async () => {
      mockedPut.mockResolvedValue(undefined);
      await updateCategory(1, 5, { name: 'Updated' });
      expect(mockedPut).toHaveBeenCalledWith(expect.stringContaining('/people/1/categories/5'), { name: 'Updated' });
    });

    it('deleteCategory deletes categories/:id', async () => {
      mockedDel.mockResolvedValue(undefined);
      await deleteCategory(1, 5);
      expect(mockedDel).toHaveBeenCalledWith(expect.stringContaining('/people/1/categories/5'));
    });
  });

  describe('subcategories', () => {
    it('createSubcategory posts to categories/:catId/subcategories', async () => {
      mockedPost.mockResolvedValue(undefined);
      await createSubcategory(1, 2, { name: 'Sub' });
      expect(mockedPost).toHaveBeenCalledWith(expect.stringContaining('/people/1/categories/2/subcategories'), { name: 'Sub' });
    });

    it('updateSubcategory puts to subcategories/:id', async () => {
      mockedPut.mockResolvedValue(undefined);
      await updateSubcategory(1, 5, { name: 'Renamed' });
      expect(mockedPut).toHaveBeenCalledWith(expect.stringContaining('/people/1/subcategories/5'), { name: 'Renamed' });
    });

    it('deleteSubcategory deletes subcategories/:id', async () => {
      mockedDel.mockResolvedValue(undefined);
      await deleteSubcategory(1, 5);
      expect(mockedDel).toHaveBeenCalledWith(expect.stringContaining('/people/1/subcategories/5'));
    });
  });

  describe('ideas', () => {
    it('fetchIdeas calls get with personId', async () => {
      mockedGet.mockResolvedValue([]);
      await fetchIdeas(1);
      expect(mockedGet).toHaveBeenCalledWith(expect.stringContaining('/people/1/ideas'), undefined);
    });

    it('fetchIdeas passes category filter', async () => {
      mockedGet.mockResolvedValue([]);
      await fetchIdeas(1, { categoryId: 2 });
      expect(mockedGet).toHaveBeenCalledWith(expect.stringContaining('/people/1/ideas'), expect.objectContaining({ categoryId: 2 }));
    });

    it('createIdea posts idea data', async () => {
      mockedPost.mockResolvedValue(undefined);
      await createIdea(1, { title: 'Book', categoryId: 2 });
      expect(mockedPost).toHaveBeenCalledWith(expect.stringContaining('/people/1/ideas'), expect.objectContaining({ title: 'Book' }));
    });

    it('updateIdea puts to ideas/:id', async () => {
      mockedPut.mockResolvedValue(undefined);
      await updateIdea(1, 5, { title: 'Updated', categoryId: 2 });
      expect(mockedPut).toHaveBeenCalledWith(expect.stringContaining('/people/1/ideas/5'), expect.objectContaining({ title: 'Updated' }));
    });

    it('deleteIdea deletes ideas/:id', async () => {
      mockedDel.mockResolvedValue(undefined);
      await deleteIdea(1, 5);
      expect(mockedDel).toHaveBeenCalledWith(expect.stringContaining('/people/1/ideas/5'));
    });
  });
});
