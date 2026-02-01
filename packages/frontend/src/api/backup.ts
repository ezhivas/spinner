import { apiClient } from './client';

/**
 * API для работы с бэкапами (экспорт/импорт всех данных)
 */
export const backupApi = {
  /**
   * Экспортировать все данные приложения
   * @param includeEnvironments - включить ли окружения в экспорт (по умолчанию true)
   */
  exportAll: async (includeEnvironments: boolean = true): Promise<Blob> => {
    const baseUrl = await apiClient.getBaseUrl();
    const response = await fetch(baseUrl + `/api/backup/export?includeEnvironments=${includeEnvironments}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to export data');
    }

    return response.blob();
  },

  /**
   * Импортировать данные в приложение
   */
  importAll: async (data: unknown): Promise<{ message: string; imported: Record<string, number> }> => {
    return apiClient.post('/api/backup/import', data);
  },
};
