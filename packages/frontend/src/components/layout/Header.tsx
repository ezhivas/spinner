import { useState } from 'react';
import { Upload, Download, Database, Sun, Moon } from 'lucide-react';
import { EnvironmentSelector } from '@/components/environments/EnvironmentSelector';
import { ImportModal, ExportModal } from '@/components/import-export';
import { GlobalBackupModal } from '@/components/backup/GlobalBackupModal';
import { useThemeStore } from '@/store';

/**
 * Header приложения с селектором окружений
 */
export const Header = () => {
  const [showImportModal, setShowImportModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const { theme, toggleTheme } = useThemeStore();

  return (
    <>
      <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4">
        {/* Left side - Controls */}
        <div className="flex items-center gap-4">
          {/* Import/Export Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              title="Import Collection"
            >
              <Upload className="w-4 h-4" />
              Import
            </button>
            <button
              onClick={() => setShowExportModal(true)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              title="Export Collection"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>

          {/* Divider */}
          <div className="h-6 w-px bg-gray-300" />

          {/* Global Backup Button */}
          <button
            onClick={() => setShowBackupModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-blue-700 border border-blue-300 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
            title="Global Backup & Restore"
          >
            <Database className="w-4 h-4" />
            Backup
          </button>

          <EnvironmentSelector />
        </div>

        {/* Right side - App Name */}
        <div className="flex items-center gap-4">
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            title="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            {theme === 'dark' ? 'Light' : 'Dark'}
          </button>
          <h1 className="text-xl font-bold text-gray-900">SpinneR</h1>
        </div>
      </div>

      {/* Modals */}
      <ImportModal isOpen={showImportModal} onClose={() => setShowImportModal(false)} />
      <ExportModal isOpen={showExportModal} onClose={() => setShowExportModal(false)} />
      <GlobalBackupModal isOpen={showBackupModal} onClose={() => setShowBackupModal(false)} />
    </>
  );
};
