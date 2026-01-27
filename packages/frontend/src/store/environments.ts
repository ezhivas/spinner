import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { IEnvironment } from '@shared/environments';
import { environmentsApi } from '@/api';

/**
 * Store для управления окружениями
 */
interface EnvironmentsStore {
  environments: IEnvironment[];
  activeEnvironmentId: number | null;
  loading: boolean;
  error: string | null;

  // Actions
  fetchEnvironments: () => Promise<void>;
  createEnvironment: (name: string, variables?: Record<string, string>) => Promise<IEnvironment>;
  updateEnvironment: (id: number, name?: string, variables?: Record<string, string>) => Promise<void>;
  deleteEnvironment: (id: number) => Promise<void>;
  importEnvironment: (data: any) => Promise<IEnvironment>;
  exportEnvironment: (id: number) => Promise<any>;
  setActiveEnvironment: (id: number | null) => void;
  getActiveEnvironment: () => IEnvironment | null;
  resolveVariables: (text: string) => string;
}

export const useEnvironmentsStore = create<EnvironmentsStore>()(
  persist(
    (set, get) => ({
      environments: [],
      activeEnvironmentId: null,
      loading: false,
      error: null,

      fetchEnvironments: async () => {
        set({ loading: true, error: null });
        try {
          const environments = await environmentsApi.getAll();
          set({ environments, loading: false });
        } catch (error) {
          set({ error: (error as Error).message, loading: false });
        }
      },

      createEnvironment: async (name, variables = {}) => {
        set({ loading: true, error: null });
        try {
          const environment = await environmentsApi.create({ name, variables });
          set((state) => ({
            environments: [...state.environments, environment],
            loading: false,
          }));
          return environment;
        } catch (error) {
          set({ error: (error as Error).message, loading: false });
          throw error;
        }
      },

      updateEnvironment: async (id, name, variables) => {
        set({ loading: true, error: null });
        try {
          const updated = await environmentsApi.update(id, { name, variables });
          set((state) => ({
            environments: state.environments.map((e) =>
              e.id === id ? updated : e
            ),
            loading: false,
          }));
        } catch (error) {
          set({ error: (error as Error).message, loading: false });
          throw error;
        }
      },

      deleteEnvironment: async (id) => {
        set({ loading: true, error: null });
        try {
          await environmentsApi.delete(id);
          set((state) => ({
            environments: state.environments.filter((e) => e.id !== id),
            activeEnvironmentId: state.activeEnvironmentId === id ? null : state.activeEnvironmentId,
            loading: false,
          }));
        } catch (error) {
          set({ error: (error as Error).message, loading: false });
          throw error;
        }
      },

      importEnvironment: async (data) => {
        set({ loading: true, error: null });
        try {
          const environment = await environmentsApi.import(data);
          set((state) => ({
            environments: [...state.environments, environment],
            loading: false,
          }));
          return environment;
        } catch (error) {
          set({ error: (error as Error).message, loading: false });
          throw error;
        }
      },

      exportEnvironment: async (id) => {
        set({ loading: true, error: null });
        try {
          const data = await environmentsApi.export(id);
          set({ loading: false });
          return data;
        } catch (error) {
          set({ error: (error as Error).message, loading: false });
          throw error;
        }
      },

      setActiveEnvironment: (id) => {
        set({ activeEnvironmentId: id });
      },

      getActiveEnvironment: () => {
        const state = get();
        return state.environments.find((e) => e.id === state.activeEnvironmentId) || null;
      },

      /**
       * Разрешение переменных вида {{VAR_NAME}} в тексте
       */
      resolveVariables: (text: string): string => {
        const activeEnv = get().getActiveEnvironment();
        if (!activeEnv) return text;

        let resolved = text;
        const variableRegex = /\{\{([^}]+)\}\}/g;

        resolved = resolved.replace(variableRegex, (match, varName) => {
          const trimmedName = varName.trim();
          return activeEnv.variables[trimmedName] ?? match;
        });

        return resolved;
      },
    }),
    {
      name: 'environments-storage',
      partialize: (state) => ({
        activeEnvironmentId: state.activeEnvironmentId,
      }),
    }
  )
);
