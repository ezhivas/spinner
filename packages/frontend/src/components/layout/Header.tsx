import { useState } from 'react';
import { Upload, Download } from 'lucide-react';
import { EnvironmentSelector } from '@/components/environments/EnvironmentSelector';
import { ImportModal, ExportModal } from '@/components/import-export';

/**
 * Header приложения с селектором окружений
 */
export const Header = () => {
  const [showImportModal, setShowImportModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  return (
    <>
      <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-gray-900">SpinneR</h1>
        </div>

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

          <EnvironmentSelector />
        </div>
      </div>

      {/* Modals */}
      <ImportModal isOpen={showImportModal} onClose={() => setShowImportModal(false)} />
      <ExportModal isOpen={showExportModal} onClose={() => setShowExportModal(false)} />
    </>
  );
};
