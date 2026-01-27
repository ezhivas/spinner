/**
 * Определение типов для Electron API
 */
export interface ElectronAPI {
  getBackendPort: () => Promise<number>;
  importCollection: () => Promise<{ path: string; data: any } | null>;
  exportCollection: (data: any) => Promise<string | null>;
  exportBackup: (data: any) => Promise<string | null>;
  importBackup: () => Promise<{ path: string; data: any } | null>;
}

/**
 * Расширение window для Electron API
 */
declare global {
  interface Window {
    electron?: ElectronAPI;
  }
}

export {};
