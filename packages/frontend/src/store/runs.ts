import { create } from 'zustand';
import type { IRun } from '@shared/runs';
import { runsApi } from '@/api';

/**
 * Store для управления выполнением запросов и историей
 */
interface RunsStore {
  runs: IRun[];
  currentRun: IRun | null;
  loading: boolean;
  error: string | null;

  // Actions
  fetchRuns: () => Promise<void>;
  fetchRunsByRequest: (requestId: number) => Promise<void>;
  createRun: (requestId: number, environmentId?: number) => Promise<IRun>;
  getRunById: (id: number) => Promise<IRun>;
  deleteRun: (id: number) => Promise<void>;
  clearHistory: () => Promise<void>;
  setCurrentRun: (run: IRun | null) => void;
}

export const useRunsStore = create<RunsStore>((set, get) => ({
  runs: [],
  currentRun: null,
  loading: false,
  error: null,

  fetchRuns: async () => {
    set({ loading: true, error: null });
    try {
      const runs = await runsApi.getAll();
      set({ runs, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  fetchRunsByRequest: async (requestId: number) => {
    set({ loading: true, error: null });
    try {
      const runs = await runsApi.getByRequest(requestId);
      set({ runs, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  createRun: async (requestId: number, environmentId?: number) => {
    set({ loading: true, error: null });
    try {
      const run = await runsApi.create({ requestId, environmentId });
      set((state) => ({
        runs: [run, ...state.runs],
        currentRun: run,
        loading: false,
      }));
      return run;
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  getRunById: async (id: number) => {
    set({ loading: true, error: null });
    try {
      const run = await runsApi.getById(id);
      set({ loading: false });
      return run;
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  deleteRun: async (id: number) => {
    set({ loading: true, error: null });
    try {
      await runsApi.delete(id);
      set((state) => ({
        runs: state.runs.filter((r) => r.id !== id),
        currentRun: state.currentRun?.id === id ? null : state.currentRun,
        loading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  clearHistory: async () => {
    set({ loading: true, error: null });
    try {
      // Delete all runs
      const { runs } = get();
      await Promise.all(runs.map((run) => runsApi.delete(run.id)));
      set({ runs: [], currentRun: null, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  setCurrentRun: (run: IRun | null) => {
    set({ currentRun: run });
  },
}));
