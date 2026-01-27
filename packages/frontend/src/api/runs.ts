import { apiClient } from './client';
import type { IRun, CreateRunDto } from '@shared/runs';

/**
 * API для работы с выполнением запросов
 */
export const runsApi = {
  /**
   * Получить все запуски
   */
  getAll: async (): Promise<IRun[]> => {
    return apiClient.get<IRun[]>('/api/runs');
  },

  /**
   * Получить запуск по ID
   */
  getById: async (id: number): Promise<IRun> => {
    return apiClient.get<IRun>(`/api/runs/${id}`);
  },

  /**
   * Создать новый запуск (выполнить запрос)
   */
  create: async (data: CreateRunDto): Promise<IRun> => {
    return apiClient.post<IRun>('/api/runs', data);
  },

  /**
   * Получить историю запусков для запроса
   */
  getByRequest: async (requestId: number): Promise<IRun[]> => {
    return apiClient.get<IRun[]>(`/api/runs/request/${requestId}`);
  },

  /**
   * Удалить запуск
   */
  delete: async (id: number): Promise<void> => {
    return apiClient.delete<void>(`/api/runs/${id}`);
  },
};
