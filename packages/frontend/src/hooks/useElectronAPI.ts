import { useState, useEffect } from 'react';
import { isElectronMode, getAppMode, AppMode } from '@/utils/api-config';
import type { ElectronAPI } from '@/types/electron';

/**
 * Хук для работы с Electron API
 */
export const useElectronAPI = () => {
  const [isElectron, setIsElectron] = useState(false);
  const [api, setApi] = useState<ElectronAPI | null>(null);

  useEffect(() => {
    const electron = isElectronMode();
    setIsElectron(electron);

    if (electron && window.electron) {
      setApi(window.electron);
    }
  }, []);

  return {
    isElectron,
    api,
    mode: getAppMode(),
  };
};

/**
 * Хук для импорта коллекции через Electron диалог
 */
export const useElectronImportCollection = () => {
  const { api, isElectron } = useElectronAPI();

  const importCollection = async (): Promise<any | null> => {
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

  const exportCollection = async (data: any): Promise<string | null> => {
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

  const importBackup = async (): Promise<any | null> => {
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

  const exportBackup = async (data: any): Promise<string | null> => {
    if (!isElectron || !api) {
      throw new Error('Export backup is only available in Electron mode');
    }

    return await api.exportBackup(data);
  };

  return { exportBackup, isAvailable: isElectron };
};
