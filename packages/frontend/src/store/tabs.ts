import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { IRequest } from '@shared/requests';

/**
 * Вкладка с запросом
 */
export interface RequestTab {
  id: string; // уникальный ID вкладки
  requestId?: number; // ID запроса (если сохранен)
  name: string;
  isDirty: boolean; // есть несохраненные изменения
  data: Partial<IRequest>; // данные запроса (могут быть несохраненными)
}

/**
 * Store для управления вкладками
 */
interface TabsStore {
  tabs: RequestTab[];
  activeTabId: string | null;

  // Actions
  addTab: (tab: Omit<RequestTab, 'id'>) => string;
  updateTab: (id: string, data: Partial<RequestTab>) => void;
  closeTab: (id: string) => void;
  setActiveTab: (id: string) => void;
  closeAllTabs: () => void;
  getActiveTab: () => RequestTab | null;
}

/**
 * Генерация уникального ID для вкладки
 */
const generateTabId = (): string => {
  return `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const useTabsStore = create<TabsStore>()(
  persist(
    (set, get) => ({
      tabs: [],
      activeTabId: null,

      addTab: (tabData) => {
        const id = generateTabId();
        const newTab: RequestTab = {
          id,
          ...tabData,
        };

        set((state) => ({
          tabs: [...state.tabs, newTab],
          activeTabId: id,
        }));

        return id;
      },

      updateTab: (id, data) => {
        set((state) => ({
          tabs: state.tabs.map((tab) =>
            tab.id === id ? { ...tab, ...data } : tab
          ),
        }));
      },

      closeTab: (id) => {
        set((state) => {
          const newTabs = state.tabs.filter((tab) => tab.id !== id);
          let newActiveTabId = state.activeTabId;

          // Если закрыта активная вкладка, переключаемся на последнюю
          if (state.activeTabId === id && newTabs.length > 0) {
            newActiveTabId = newTabs[newTabs.length - 1].id;
          } else if (newTabs.length === 0) {
            newActiveTabId = null;
          }

          return {
            tabs: newTabs,
            activeTabId: newActiveTabId,
          };
        });
      },

      setActiveTab: (id) => {
        set({ activeTabId: id });
      },

      closeAllTabs: () => {
        set({ tabs: [], activeTabId: null });
      },

      getActiveTab: () => {
        const state = get();
        return state.tabs.find((tab) => tab.id === state.activeTabId) || null;
      },
    }),
    {
      name: 'tabs-storage',
      // Сохраняем только ID вкладок и активную вкладку
      partialize: (state) => ({
        activeTabId: state.activeTabId,
        tabs: state.tabs.map((tab) => ({
          id: tab.id,
          requestId: tab.requestId,
          name: tab.name,
          isDirty: false, // Не сохраняем dirty состояние
        })),
      }),
    }
  )
);
