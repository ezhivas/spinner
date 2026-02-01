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
    return apiClient.patch<IRequest>(`/api/requests/${id}`, data);
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

  /**
   * Экспортировать запрос как cURL команду
   * @param id - ID запроса
   * @param environmentId - ID окружения для подстановки переменных (опционально)
   */
  exportAsCurl: async (id: number, environmentId?: number): Promise<Blob> => {
    const baseUrl = await apiClient.getBaseUrl();
    const url = environmentId
      ? `${baseUrl}/api/requests/${id}/curl?environmentId=${environmentId}`
      : `${baseUrl}/api/requests/${id}/curl`;

    const response = await fetch(url, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error('Failed to export request as cURL');
    }

    return response.blob();
  },

  /**
   * Импортировать запрос из cURL команды
   */
  importFromCurl: async (curlCommand: string, collectionId?: number): Promise<IRequest> => {
    return apiClient.post<IRequest>('/api/requests/import/curl', {
      curlCommand,
      collectionId,
    });
  },
};
