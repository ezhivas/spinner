import { create } from 'zustand';
import type { IRequest } from '@shared/requests';
import { requestsApi } from '@/api';

/**
 * Store для управления запросами
 */
interface RequestsStore {
  requests: IRequest[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchRequests: () => Promise<void>;
  fetchRequestsByCollection: (collectionId: number) => Promise<void>;
  getRequestById: (id: number) => Promise<IRequest>;
  createRequest: (data: Partial<IRequest>) => Promise<IRequest>;
  updateRequest: (id: number, data: Partial<IRequest>) => Promise<void>;
  deleteRequest: (id: number) => Promise<void>;
}

export const useRequestsStore = create<RequestsStore>()((set) => ({
  requests: [],
  loading: false,
  error: null,

  fetchRequests: async () => {
    set({ loading: true, error: null });
    try {
      const requests = await requestsApi.getAll();
      set({ requests, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  fetchRequestsByCollection: async (collectionId: number) => {
    set({ loading: true, error: null });
    try {
      const requests = await requestsApi.getByCollection(collectionId);
      set({ requests, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  getRequestById: async (id: number) => {
    set({ loading: true, error: null });
    try {
      const request = await requestsApi.getById(id);
      set({ loading: false });
      return request;
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  createRequest: async (data) => {
    set({ loading: true, error: null });
    try {
      const request = await requestsApi.create(data as IRequest);
      set((state) => ({
        requests: [...state.requests, request],
        loading: false,
      }));
      return request;
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  updateRequest: async (id, data) => {
    set({ loading: true, error: null });
    try {
      const updated = await requestsApi.update(id, data);
      set((state) => ({
        requests: state.requests.map((r) => (r.id === id ? updated : r)),
        loading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  deleteRequest: async (id) => {
    set({ loading: true, error: null });
    try {
      await requestsApi.delete(id);
      set((state) => ({
        requests: state.requests.filter((r) => r.id !== id),
        loading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },
}));
