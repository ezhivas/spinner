import { useState } from 'react';
import { Modal } from '@/components/common';
import { FolderOpen, FileText } from 'lucide-react';
import type { ICollection } from '@shared/collections';

interface NewRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  collections: ICollection[];
  onCreateRequest: (collectionId?: number) => void;
}

/**
 * Модальное окно для выбора коллекции при создании нового запроса
 */
export const NewRequestModal = ({
  isOpen,
  onClose,
  collections,
  onCreateRequest,
}: NewRequestModalProps) => {
  const [selectedCollectionId, setSelectedCollectionId] = useState<number | undefined>();

  const handleCreate = () => {
    onCreateRequest(selectedCollectionId);
    onClose();
    setSelectedCollectionId(undefined);
  };

  const handleCreateWithoutCollection = () => {
    onCreateRequest(undefined);
    onClose();
    setSelectedCollectionId(undefined);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Request">
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Select a collection to add the request to, or create without a collection.
        </p>

        {/* Collection Selection */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Collection (Optional)
          </label>
          <select
            value={selectedCollectionId ?? ''}
            onChange={(e) =>
              setSelectedCollectionId(e.target.value ? Number(e.target.value) : undefined)
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">No Collection</option>
            {collections.map((collection) => (
              <option key={collection.id} value={collection.id}>
                {collection.name}
              </option>
            ))}
          </select>
        </div>

        {/* Info Text */}
        {selectedCollectionId && (
          <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <FolderOpen className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-blue-800">
              Request will be added to{' '}
              <strong>
                {collections.find((c) => c.id === selectedCollectionId)?.name}
              </strong>
            </p>
          </div>
        )}

        {!selectedCollectionId && (
          <div className="flex items-start gap-2 p-3 bg-gray-50 border border-gray-200 rounded-md">
            <FileText className="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-gray-600">
              Request will be created without a collection. You can add it to a collection
              later.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 transition-colors"
          >
            Create Request
          </button>
        </div>
      </div>
    </Modal>
  );
};
