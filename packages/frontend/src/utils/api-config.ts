/**
 * Утилита для определения режима работы и получения API URL
 */

/**
 * Проверка, запущено ли приложение в Electron
 */
export const isElectronMode = (): boolean => {
  return typeof window !== 'undefined' && !!window.electron;
};

/**
 * Получение базового URL для API
 */
export const getApiBaseUrl = async (): Promise<string> => {
  if (isElectronMode()) {
    try {
      // В Electron режиме получаем динамический порт бэкенда
      const port = await window.electron!.getBackendPort();
      return `http://localhost:${port}`;
    } catch (error) {
      console.error('Failed to get backend port:', error);
      // Fallback на стандартный порт
      return 'http://localhost:3000';
    }
  }

  // В Docker/Web режиме используем относительный путь
  return '';
};

/**
 * Режим работы приложения
 */
export enum AppMode {
  ELECTRON = 'electron',
  WEB = 'web',
}

/**
 * Получение текущего режима работы
 */
export const getAppMode = (): AppMode => {
  return isElectronMode() ? AppMode.ELECTRON : AppMode.WEB;
};
