import { create } from 'zustand';
import type { IRun } from '@shared/runs';
import { RunStatus } from '@shared/common/enums';
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
  pollRunUntilComplete: (runId: number, maxAttempts?: number) => Promise<IRun>;
  cancelRun: (id: number) => Promise<void>;
  deleteRun: (id: number) => Promise<void>;
  clearHistory: () => Promise<void>;
  cleanupOldRuns: (hours: number) => Promise<{ deleted: number }>;
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

  pollRunUntilComplete: async (runId: number, maxAttempts = 60) => {
    const pollInterval = 500; // 500ms между попытками
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        const run = await runsApi.getById(runId);
        
        // Обновляем currentRun в store
        set({ currentRun: run });

        // Проверяем, завершился ли запрос (SUCCESS, ERROR или CANCELLED)
        if (run.status === RunStatus.SUCCESS || run.status === RunStatus.ERROR || run.status === RunStatus.CANCELLED) {
          set({ loading: false });
          return run;
        }

        // Ждем перед следующей попыткой
        await new Promise(resolve => setTimeout(resolve, pollInterval));
        attempts++;
      } catch (error) {
        set({ error: (error as Error).message, loading: false });
        throw error;
      }
    }

    // Timeout - запрос не завершился за отведенное время
    set({ loading: false, error: 'Request timeout' });
    throw new Error('Request execution timeout');
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

  cleanupOldRuns: async (hours: number) => {
    set({ loading: true, error: null });
    try {
      const result = await runsApi.cleanup(hours);
      // Обновляем список после удаления
      await get().fetchRuns();
      set({ loading: false });
      return { deleted: result.deleted };
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  cancelRun: async (id: number) => {
    set({ loading: true, error: null });
    try {
      await runsApi.cancel(id);
      // Обновляем статус в локальном списке
      set((state) => ({
        runs: state.runs.map((run) =>
          run.id === id ? { ...run, status: 'CANCELLED' as RunStatus } : run
        ),
        currentRun:
          state.currentRun?.id === id
            ? { ...state.currentRun, status: 'CANCELLED' as RunStatus }
            : state.currentRun,
        loading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  setCurrentRun: (run: IRun | null) => {
    set({ currentRun: run });
  },
}));
