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
    const { requestId, environmentId } = data;
    const url = environmentId 
      ? `/api/runs/requests/${requestId}/run?environmentId=${environmentId}`
      : `/api/runs/requests/${requestId}/run`;
    return apiClient.post<IRun>(url, {});
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

  /**
   * Отменить выполняющийся запрос
   */
  cancel: async (id: number): Promise<{ cancelled: boolean; message: string }> => {
    return apiClient.post(`/api/runs/${id}/cancel`, {});
  },

  /**
   * Удалить записи старше указанного количества часов
   */
  cleanup: async (hours: number): Promise<{ deleted: number; cutoffDate: string; hoursKept: number }> => {
    return apiClient.delete(`/api/runs/cleanup?hours=${hours}`);
  },
};
