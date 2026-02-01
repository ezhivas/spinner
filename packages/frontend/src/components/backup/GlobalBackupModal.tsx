import { useState } from 'react';
import { Database, Upload, Download, AlertTriangle } from 'lucide-react';
import { Modal, Button } from '@/components/common';
import { backupApi } from '@/api';
import { useToastStore } from '@/store';

interface GlobalBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Модальное окно для глобального экспорта/импорта всех данных приложения
 */
export const GlobalBackupModal = ({ isOpen, onClose }: GlobalBackupModalProps) => {
  const { success, error: showError } = useToastStore();
  const [loading, setLoading] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [includeEnvironments, setIncludeEnvironments] = useState(true);

  const handleExport = async () => {
    setLoading(true);
    try {
      const blob = await backupApi.exportAll(includeEnvironments);

      // Создаем ссылку для скачивания
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `spinner-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      success('Data exported successfully');
    } catch {
      showError('Failed to export data');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImportFile(file);
    }
  };

  const handleImport = async () => {
    if (!importFile) return;

    setLoading(true);
    try {
      const text = await importFile.text();
      const data = JSON.parse(text);
      
      const result = await backupApi.importAll(data);
      
      success(`Data imported successfully! ${Object.entries(result.imported).map(([key, count]) => `${key}: ${count}`).join(', ')}`);
      setImportFile(null);
      onClose();
      
      // Перезагружаем страницу чтобы обновить все данные
      setTimeout(() => window.location.reload(), 1000);
    } catch {
      showError('Failed to import data. Make sure the file is valid.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Global Backup & Restore" size="lg">
      <div className="space-y-6">
        {/* Warning */}
        <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-medium text-yellow-900 mb-1">Important Notice</h3>
            <p className="text-sm text-yellow-700">
              This will export or import ALL data including collections, requests, and environments.
              Import will replace existing data with the same IDs.
            </p>
          </div>
        </div>

        {/* Export Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-medium text-gray-900">Export All Data</h3>
          </div>
          <p className="text-sm text-gray-600">
            Download a complete backup of all your data as a JSON file. This includes:
          </p>
          <ul className="text-sm text-gray-600 list-disc list-inside ml-2 space-y-1">
            <li>All collections and requests</li>
            <li>All environments and variables (optional)</li>
          </ul>

          {/* Checkbox for including environments */}
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={includeEnvironments}
              onChange={(e) => setIncludeEnvironments(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span>Include environments in export</span>
          </label>

          <Button
            onClick={handleExport}
            disabled={loading}
            icon={<Download className="w-4 h-4" />}
            className="w-full"
          >
            Export All Data
          </Button>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200" />

        {/* Import Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-medium text-gray-900">Import Data</h3>
          </div>
          <p className="text-sm text-gray-600">
            Restore data from a previously exported backup file. The application will reload after import.
          </p>
          
          {/* File Input */}
          <div className="space-y-2">
            <label className="block">
              <div className="flex items-center justify-center w-full px-4 py-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors cursor-pointer">
                <div className="text-center">
                  <Database className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    {importFile ? importFile.name : 'Click to select backup file'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">JSON files only</p>
                </div>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            </label>

            {importFile && (
              <Button
                onClick={handleImport}
                disabled={loading}
                variant="primary"
                icon={<Upload className="w-4 h-4" />}
                className="w-full"
              >
                Import Data from {importFile.name}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-2 pt-4 mt-4 border-t border-gray-200">
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          Close
        </Button>
      </div>
    </Modal>
  );
};
