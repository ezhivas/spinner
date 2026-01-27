import { useState } from 'react';
import { Download, FileJson } from 'lucide-react';
import { Modal, Button } from '@/components/common';
import { useEnvironmentsStore, useToastStore } from '@/store';

interface EnvironmentExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EnvironmentExportModal = ({ isOpen, onClose }: EnvironmentExportModalProps) => {
  const { environments, exportEnvironment } = useEnvironmentsStore();
  const { success, error: showError } = useToastStore();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    if (!selectedId) return;

    setLoading(true);
    try {
      const data = await exportEnvironment(selectedId);

      // Create download
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      const selectedEnvironment = environments.find((e) => e.id === selectedId);
      const filename = `${selectedEnvironment?.name || 'environment'}_postman.json`;
      a.download = filename;

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      success(`Environment exported as ${filename}`);
      onClose();
    } catch (err) {
      showError('Failed to export environment');
    } finally {
      setLoading(false);
    }
  };

  const selectedEnvironment = environments.find((e) => e.id === selectedId);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Export Environment" size="md">
      <div className="space-y-4">
        {/* Environment Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Environment
          </label>
          <select
            value={selectedId || ''}
            onChange={(e) => setSelectedId(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Select an environment...</option>
            {environments.map((env) => (
              <option key={env.id} value={env.id}>
                {env.name}
              </option>
            ))}
          </select>
        </div>

        {/* Format Info */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-start gap-2">
            <FileJson className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900">Export Format</p>
              <p className="text-sm text-blue-700 mt-1">
                Environment will be exported in Postman format, compatible with Postman and other API clients.
              </p>
            </div>
          </div>
        </div>

        {/* Preview */}
        {selectedEnvironment && (
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
            <div className="flex items-start gap-2">
              <Download className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {selectedEnvironment.name}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Variables: {Object.keys(selectedEnvironment.variables || {}).length}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Will be exported as:{' '}
                  <code className="bg-gray-200 px-1 rounded">
                    {selectedEnvironment.name}_postman.json
                  </code>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleExport}
            disabled={!selectedId || loading}
            loading={loading}
            icon={<Download className="w-4 h-4" />}
          >
            Export
          </Button>
        </div>
      </div>
    </Modal>
  );
};
