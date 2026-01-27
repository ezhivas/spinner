import { apiClient } from './client';
import type { IRequest, CreateRequestDto, UpdateRequestDto } from '@shared/requests';

/**
 * API для работы с запросами
 */
export const requestsApi = {
  /**
   * Получить все запросы
   */
  getAll: async (): Promise<IRequest[]> => {
    return apiClient.get<IRequest[]>('/api/requests');
  },

  /**
   * Получить запрос по ID
   */
  getById: async (id: number): Promise<IRequest> => {
    return apiClient.get<IRequest>(`/api/requests/${id}`);
  },

  /**
   * Создать новый запрос
   */
  create: async (data: CreateRequestDto): Promise<IRequest> => {
    return apiClient.post<IRequest>('/api/requests', data);
  },

  /**
   * Обновить запрос
   */
  update: async (id: number, data: UpdateRequestDto): Promise<IRequest> => {
    return apiClient.put<IRequest>(`/api/requests/${id}`, data);
  },

  /**
   * Удалить запрос
   */
  delete: async (id: number): Promise<void> => {
    return apiClient.delete<void>(`/api/requests/${id}`);
  },

  /**
   * Получить запросы коллекции
   */
  getByCollection: async (collectionId: number): Promise<IRequest[]> => {
    return apiClient.get<IRequest[]>(`/api/collections/${collectionId}/requests`);
  },
};
