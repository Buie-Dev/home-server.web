import { renderHook, act } from '@testing-library/react';

vi.mock('api/people.api', () => ({
  fetchPeople: vi.fn(),
  createPerson: vi.fn(),
  deletePerson: vi.fn(),
  fetchCategories: vi.fn(),
  createCategory: vi.fn(),
  updateCategory: vi.fn(),
  deleteCategory: vi.fn(),
  createSubcategory: vi.fn(),
  updateSubcategory: vi.fn(),
  deleteSubcategory: vi.fn(),
  fetchIdeas: vi.fn(),
  createIdea: vi.fn(),
  updateIdea: vi.fn(),
  deleteIdea: vi.fn(),
}));

import * as peopleApi from 'api/people.api';
import usePeople from 'hooks/usePeople.hook';

const mockedFetchPeople = vi.mocked(peopleApi.fetchPeople);
const mockedCreatePerson = vi.mocked(peopleApi.createPerson);
const mockedDeletePerson = vi.mocked(peopleApi.deletePerson);
const mockedFetchCategories = vi.mocked(peopleApi.fetchCategories);
const mockedFetchIdeas = vi.mocked(peopleApi.fetchIdeas);
const mockedCreateIdea = vi.mocked(peopleApi.createIdea);
const mockedDeleteIdea = vi.mocked(peopleApi.deleteIdea);

describe('usePeople', () => {
  it('starts with empty state', () => {
    const { result } = renderHook(() => usePeople());
    expect(result.current.people).toEqual([]);
    expect(result.current.categories).toEqual([]);
    expect(result.current.ideas).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it('fetchPeople loads people', async () => {
    mockedFetchPeople.mockResolvedValue([{ id: 1, name: 'Alice' }]);
    const { result } = renderHook(() => usePeople());

    await act(async () => {
      await result.current.fetchPeople();
    });

    expect(result.current.people).toHaveLength(1);
  });

  it('addPerson creates and refetches', async () => {
    mockedCreatePerson.mockResolvedValue(undefined);
    mockedFetchPeople.mockResolvedValue([]);
    const { result } = renderHook(() => usePeople());

    await act(async () => {
      await result.current.addPerson('Bob');
    });

    expect(mockedCreatePerson).toHaveBeenCalledWith({ name: 'Bob' });
    expect(mockedFetchPeople).toHaveBeenCalled();
  });

  it('deletePerson deletes and refetches', async () => {
    mockedDeletePerson.mockResolvedValue(undefined);
    mockedFetchPeople.mockResolvedValue([]);
    const { result } = renderHook(() => usePeople());

    await act(async () => {
      await result.current.deletePerson(1);
    });

    expect(mockedDeletePerson).toHaveBeenCalledWith(1);
  });

  it('fetchCategories loads categories for a person', async () => {
    mockedFetchCategories.mockResolvedValue([{ id: 1, name: 'Gifts', subcategories: [], ideaCount: 3 }]);
    const { result } = renderHook(() => usePeople());

    await act(async () => {
      await result.current.fetchCategories(1);
    });

    expect(result.current.categories).toHaveLength(1);
  });

  it('fetchIdeas loads ideas with loading state', async () => {
    mockedFetchIdeas.mockResolvedValue([{ id: 1, title: 'Book', completed: false, createdAt: '2024-01-01', categoryId: 1, categoryName: 'G' }]);
    const { result } = renderHook(() => usePeople());

    await act(async () => {
      await result.current.fetchIdeas(1);
    });

    expect(result.current.ideas).toHaveLength(1);
    expect(result.current.loading).toBe(false);
  });

  it('createIdea calls API and refetches ideas', async () => {
    mockedCreateIdea.mockResolvedValue(undefined);
    mockedFetchIdeas.mockResolvedValue([]);
    const { result } = renderHook(() => usePeople());

    await act(async () => {
      await result.current.createIdea(1, { title: 'New idea', categoryId: 2 });
    });

    expect(mockedCreateIdea).toHaveBeenCalledWith(1, { title: 'New idea', categoryId: 2 });
    expect(mockedFetchIdeas).toHaveBeenCalledWith(1, { categoryId: undefined, subcategoryId: undefined });
  });

  it('deleteIdea removes idea locally', async () => {
    mockedFetchIdeas.mockResolvedValue([
      { id: 1, title: 'A', completed: false, createdAt: '2024-01-01', categoryId: 1, categoryName: 'G' },
      { id: 2, title: 'B', completed: false, createdAt: '2024-01-01', categoryId: 1, categoryName: 'G' },
    ]);
    mockedDeleteIdea.mockResolvedValue(undefined);
    const { result } = renderHook(() => usePeople());

    await act(async () => {
      await result.current.fetchIdeas(1);
    });

    await act(async () => {
      await result.current.deleteIdea(1, 1);
    });

    expect(result.current.ideas).toHaveLength(1);
    expect(result.current.ideas[0].id).toBe(2);
  });

  it('clearPerson resets categories and ideas', async () => {
    mockedFetchCategories.mockResolvedValue([{ id: 1, name: 'G', subcategories: [], ideaCount: 0 }]);
    mockedFetchIdeas.mockResolvedValue([{ id: 1, title: 'A', completed: false, createdAt: '2024-01-01', categoryId: 1, categoryName: 'G' }]);
    const { result } = renderHook(() => usePeople());

    await act(async () => {
      await result.current.fetchCategories(1);
      await result.current.fetchIdeas(1);
    });

    expect(result.current.categories).toHaveLength(1);
    expect(result.current.ideas).toHaveLength(1);

    act(() => {
      result.current.clearPerson();
    });

    expect(result.current.categories).toEqual([]);
    expect(result.current.ideas).toEqual([]);
  });
});
