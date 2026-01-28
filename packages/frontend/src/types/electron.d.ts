/**
 * Определение типов для Electron API
 */
export interface ElectronAPI {
  getBackendPort: () => Promise<number>;
  importCollection: () => Promise<{ path: string; data: Record<string, unknown> } | null>;
  exportCollection: (data: Record<string, unknown>) => Promise<string | null>;
  exportBackup: (data: Record<string, unknown>) => Promise<string | null>;
  importBackup: () => Promise<{ path: string; data: Record<string, unknown> } | null>;
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
