import { useElectronAPI } from '@/hooks/useElectronAPI';

/**
 * Футер с информацией о статусе и режиме работы
 */
export const StatusFooter = () => {
  const { mode, isElectron } = useElectronAPI();

  return (
    <div className="h-6 bg-primary-600 text-white px-4 flex items-center justify-between text-xs">
      <div className="flex items-center gap-4">
        <span>Mode: {isElectron ? '🖥️ Desktop' : '🌐 Web'}</span>
      </div>
      <div className="flex items-center gap-4">
        <span>SpinneR API Client v0.0.1</span>
      </div>
    </div>
  );
};
