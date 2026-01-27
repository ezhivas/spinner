import { apiClient } from './client';
import type { ICollection, CreateCollectionDto, UpdateCollectionDto } from '@shared/collections';

/**
 * API для работы с коллекциями
 */
export const collectionsApi = {
  /**
   * Получить все коллекции
   */
  getAll: async (): Promise<ICollection[]> => {
    return apiClient.get<ICollection[]>('/api/collections');
  },

  /**
   * Получить коллекцию по ID
   */
  getById: async (id: number): Promise<ICollection> => {
    return apiClient.get<ICollection>(`/api/collections/${id}`);
  },

  /**
   * Создать новую коллекцию
   */
  create: async (data: CreateCollectionDto): Promise<ICollection> => {
    return apiClient.post<ICollection>('/api/collections', data);
  },

  /**
   * Обновить коллекцию
   */
  update: async (id: number, data: UpdateCollectionDto): Promise<ICollection> => {
    return apiClient.put<ICollection>(`/api/collections/${id}`, data);
  },

  /**
   * Удалить коллекцию
   */
  delete: async (id: number): Promise<void> => {
    return apiClient.delete<void>(`/api/collections/${id}`);
  },

  /**
   * Импортировать коллекцию
   */
  import: async (data: any): Promise<ICollection> => {
    return apiClient.post<ICollection>('/api/collections/import', data);
  },

  /**
   * Экспортировать коллекцию
   */
  export: async (id: number): Promise<any> => {
    return apiClient.get<any>(`/api/collections/${id}/export`);
  },
};
