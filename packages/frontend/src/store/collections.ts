import { create } from 'zustand';
import type { ICollection } from '@shared/collections';
import { collectionsApi } from '@/api';

/**
 * Store для управления коллекциями
 */
interface CollectionsStore {
  collections: ICollection[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchCollections: () => Promise<void>;
  createCollection: (name: string, description?: string) => Promise<ICollection>;
  updateCollection: (id: number, name: string, description?: string) => Promise<void>;
  deleteCollection: (id: number) => Promise<void>;
  importCollection: (data: Record<string, unknown>) => Promise<void>;
  exportCollection: (id: number) => Promise<Record<string, unknown>>;
}

export const useCollectionsStore = create<CollectionsStore>()((set) => ({
  collections: [],
  loading: false,
  error: null,

  fetchCollections: async () => {
    set({ loading: true, error: null });
    try {
      const collections = await collectionsApi.getAll();
      set({ collections, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  createCollection: async (name, description) => {
    set({ loading: true, error: null });
    try {
      const collection = await collectionsApi.create({ name, description });
      set((state) => ({
        collections: [...state.collections, collection],
        loading: false,
      }));
      return collection;
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  updateCollection: async (id, name, description) => {
    set({ loading: true, error: null });
    try {
      const updated = await collectionsApi.update(id, { name, description });
      set((state) => ({
        collections: state.collections.map((c) =>
          c.id === id ? updated : c
        ),
        loading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  deleteCollection: async (id) => {
    set({ loading: true, error: null });
    try {
      await collectionsApi.delete(id);
      set((state) => ({
        collections: state.collections.filter((c) => c.id !== id),
        loading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  importCollection: async (data) => {
    set({ loading: true, error: null });
    try {
      const collection = await collectionsApi.import(data);
      set((state) => ({
        collections: [...state.collections, collection],
        loading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  exportCollection: async (id) => {
    set({ loading: true, error: null });
    try {
      const data = await collectionsApi.export(id);
      set({ loading: false });
      return data;
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },
}));
