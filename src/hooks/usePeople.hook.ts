import { useState } from 'react';
import * as peopleApi from 'api/people.api';

export type TrackedPerson = { id: number; name: string };

export type PersonSubcategory = { id: number; name: string; categoryId: number };

export type PersonCategory = {
  id: number;
  name: string;
  subcategories: PersonSubcategory[];
  ideaCount: number;
};

export type PersonIdea = {
  id: number;
  title: string;
  notes?: string;
  completed: boolean;
  createdAt: string;
  categoryId: number;
  categoryName: string;
  subcategoryId?: number;
  subcategoryName?: string;
};

function usePeople() {
  const [people, setPeople] = useState<TrackedPerson[]>([]);
  const [categories, setCategories] = useState<PersonCategory[]>([]);
  const [ideas, setIdeas] = useState<PersonIdea[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPeople = async (): Promise<void> => {
    try {
      const data = await peopleApi.fetchPeople();
      setPeople(data as TrackedPerson[]);
    } catch (e) {
      console.error(e);
    }
  };

  const addPerson = async (name: string): Promise<void> => {
    await peopleApi.createPerson({ name });
    await fetchPeople();
  };

  const deletePerson = async (personId: number): Promise<void> => {
    await peopleApi.deletePerson(personId);
    await fetchPeople();
  };

  const fetchCategories = async (personId: number): Promise<void> => {
    try {
      const data = await peopleApi.fetchCategories(personId);
      setCategories(data as PersonCategory[]);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchIdeas = async (personId: number, categoryId?: number, subcategoryId?: number): Promise<void> => {
    setLoading(true);
    try {
      const data = await peopleApi.fetchIdeas(personId, { categoryId, subcategoryId });
      setIdeas(data as PersonIdea[]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const createCategory = async (personId: number, name: string, subcategoryNames: string[]): Promise<void> => {
    await peopleApi.createCategory(personId, { name, subcategoryNames });
    await fetchCategories(personId);
  };

  const createSubcategory = async (personId: number, categoryId: number, name: string): Promise<void> => {
    await peopleApi.createSubcategory(personId, categoryId, { name });
    await fetchCategories(personId);
  };

  const updateCategory = async (personId: number, id: number, name: string): Promise<void> => {
    await peopleApi.updateCategory(personId, id, { name });
    await fetchCategories(personId);
  };

  const updateSubcategory = async (personId: number, id: number, name: string): Promise<void> => {
    await peopleApi.updateSubcategory(personId, id, { name });
    await fetchCategories(personId);
  };

  const deleteSubcategory = async (personId: number, id: number): Promise<void> => {
    await peopleApi.deleteSubcategory(personId, id);
    await fetchCategories(personId);
  };

  const deleteCategory = async (personId: number, id: number): Promise<void> => {
    await peopleApi.deleteCategory(personId, id);
    await fetchCategories(personId);
  };

  const createIdea = async (personId: number, data: { title: string; categoryId: number; subcategoryId?: number; notes?: string }): Promise<void> => {
    await peopleApi.createIdea(personId, data);
    await fetchIdeas(personId);
  };

  const updateIdea = async (personId: number, id: number, data: { title: string; categoryId: number; subcategoryId?: number; notes?: string }): Promise<void> => {
    await peopleApi.updateIdea(personId, id, data);
  };

  const deleteIdea = async (personId: number, id: number): Promise<void> => {
    await peopleApi.deleteIdea(personId, id);
    setIdeas((prev) => prev.filter((i) => i.id !== id));
  };

  const clearPerson = (): void => {
    setCategories([]);
    setIdeas([]);
  };

  return {
    people, categories, ideas, loading,
    fetchPeople, addPerson, deletePerson,
    fetchCategories, fetchIdeas, clearPerson,
    createCategory, createSubcategory, updateCategory,
    updateSubcategory, deleteSubcategory, deleteCategory,
    createIdea, updateIdea, deleteIdea,
  };
}

export default usePeople;
