import { EnvironmentSelector } from '@/components/environments/EnvironmentSelector';

/**
 * Header приложения с селектором окружений
 */
export const Header = () => {
  return (
    <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold text-gray-900">SpinneR</h1>
      </div>

      <div className="flex items-center gap-4">
        <EnvironmentSelector />
      </div>
    </div>
  );
};
