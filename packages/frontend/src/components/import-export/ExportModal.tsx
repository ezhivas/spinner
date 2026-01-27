import { useState } from 'react';
import { Download, FileJson } from 'lucide-react';
import { Modal, Button } from '@/components/common';
import { useCollectionsStore, useToastStore } from '@/store';
import { exportToPostmanFormat } from '@/utils/postman-parser';
import type { ICollection } from '@shared/collections';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  collection?: ICollection;
}

export const ExportModal = ({ isOpen, onClose, collection }: ExportModalProps) => {
  const { collections, exportCollection } = useCollectionsStore();
  const { success, error: showError } = useToastStore();
  const [selectedId, setSelectedId] = useState<number | null>(collection?.id || null);
  const [loading, setLoading] = useState(false);
  const [format, setFormat] = useState<'postman' | 'spinner'>('postman');

  const handleExport = async () => {
    if (!selectedId) return;

    setLoading(true);
    try {
      const data = await exportCollection(selectedId);

      // Convert to selected format
      const exportData = format === 'postman' ? exportToPostmanFormat(data) : data;

      // Create download
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      const selectedCollection = collections.find((c) => c.id === selectedId);
      const filename = `${selectedCollection?.name || 'collection'}_${format}.json`;
      a.download = filename;

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      success(`Collection exported as ${filename}`);
      onClose();
    } catch (err) {
      showError('Failed to export collection');
    } finally {
      setLoading(false);
    }
  };

  const selectedCollection = collections.find((c) => c.id === selectedId);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Export Collection" size="md">
      <div className="space-y-4">
        {/* Collection Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Collection
          </label>
          <select
            value={selectedId || ''}
            onChange={(e) => setSelectedId(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Select a collection...</option>
            {collections.map((col) => (
              <option key={col.id} value={col.id}>
                {col.name}
              </option>
            ))}
          </select>
        </div>

        {/* Format Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Export Format
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setFormat('postman')}
              className={`flex flex-col items-center gap-2 p-4 border-2 rounded-lg transition-all ${
                format === 'postman'
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <FileJson className={`w-8 h-8 ${format === 'postman' ? 'text-primary-600' : 'text-gray-400'}`} />
              <div className="text-center">
                <p className={`text-sm font-medium ${format === 'postman' ? 'text-primary-900' : 'text-gray-700'}`}>
                  Postman
                </p>
                <p className="text-xs text-gray-500">v2.1 format</p>
              </div>
            </button>

            <button
              onClick={() => setFormat('spinner')}
              className={`flex flex-col items-center gap-2 p-4 border-2 rounded-lg transition-all ${
                format === 'spinner'
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <FileJson className={`w-8 h-8 ${format === 'spinner' ? 'text-primary-600' : 'text-gray-400'}`} />
              <div className="text-center">
                <p className={`text-sm font-medium ${format === 'spinner' ? 'text-primary-900' : 'text-gray-700'}`}>
                  SpinneR
                </p>
                <p className="text-xs text-gray-500">Native format</p>
              </div>
            </button>
          </div>
        </div>

        {/* Preview */}
        {selectedCollection && (
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
            <div className="flex items-start gap-2">
              <Download className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {selectedCollection.name}
                </p>
                {selectedCollection.description && (
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedCollection.description}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  Will be exported as: <code className="bg-gray-200 px-1 rounded">
                    {selectedCollection.name}_{format}.json
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
