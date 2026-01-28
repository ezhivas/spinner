import { useMemo } from 'react';
import { isElectronMode, getAppMode } from '@/utils/api-config';

/**
 * Хук для работы с Electron API
 */
export const useElectronAPI = () => {
  const isElectron = useMemo(() => isElectronMode(), []);
  const api = useMemo(() => (isElectron && window.electron) ? window.electron : null, [isElectron]);
  const mode = useMemo(() => getAppMode(), []);

  return {
    isElectron,
    api,
    mode,
  };
};

/**
 * Хук для импорта коллекции через Electron диалог
 */
export const useElectronImportCollection = () => {
  const { api, isElectron } = useElectronAPI();

  const importCollection = async (): Promise<Record<string, unknown> | null> => {
    if (!isElectron || !api) {
      throw new Error('Import is only available in Electron mode');
    }

    const result = await api.importCollection();
    return result?.data || null;
  };

  return { importCollection, isAvailable: isElectron };
};

/**
 * Хук для экспорта коллекции через Electron диалог
 */
export const useElectronExportCollection = () => {
  const { api, isElectron } = useElectronAPI();

  const exportCollection = async (data: Record<string, unknown>): Promise<string | null> => {
    if (!isElectron || !api) {
      throw new Error('Export is only available in Electron mode');
    }

    return await api.exportCollection(data);
  };

  return { exportCollection, isAvailable: isElectron };
};

/**
 * Хук для импорта бэкапа
 */
export const useElectronImportBackup = () => {
  const { api, isElectron } = useElectronAPI();

  const importBackup = async (): Promise<Record<string, unknown> | null> => {
    if (!isElectron || !api) {
      throw new Error('Import backup is only available in Electron mode');
    }

    const result = await api.importBackup();
    return result?.data || null;
  };

  return { importBackup, isAvailable: isElectron };
};

/**
 * Хук для экспорта бэкапа
 */
export const useElectronExportBackup = () => {
  const { api, isElectron } = useElectronAPI();

  const exportBackup = async (data: Record<string, unknown>): Promise<string | null> => {
    if (!isElectron || !api) {
      throw new Error('Export backup is only available in Electron mode');
    }

    return await api.exportBackup(data);
  };

  return { exportBackup, isAvailable: isElectron };
};
