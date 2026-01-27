import { apiClient } from './client';
import type { IEnvironment, CreateEnvironmentDto, UpdateEnvironmentDto } from '@shared/environments';

/**
 * API для работы с окружениями
 */
export const environmentsApi = {
  /**
   * Получить все окружения
   */
  getAll: async (): Promise<IEnvironment[]> => {
    return apiClient.get<IEnvironment[]>('/api/environments');
  },

  /**
   * Получить окружение по ID
   */
  getById: async (id: number): Promise<IEnvironment> => {
    return apiClient.get<IEnvironment>(`/api/environments/${id}`);
  },

  /**
   * Создать ново�� окружение
   */
  create: async (data: CreateEnvironmentDto): Promise<IEnvironment> => {
    return apiClient.post<IEnvironment>('/api/environments', data);
  },

  /**
   * Обновить окружение
   */
  update: async (id: number, data: UpdateEnvironmentDto): Promise<IEnvironment> => {
    return apiClient.put<IEnvironment>(`/api/environments/${id}`, data);
  },

  /**
   * Удалить окружение
   */
  delete: async (id: number): Promise<void> => {
    return apiClient.delete<void>(`/api/environments/${id}`);
  },
};
