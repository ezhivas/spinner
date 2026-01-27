import { useEffect, useState } from 'react';
import { Plus, FileText, FolderOpen, Clock } from 'lucide-react';
import { useCollectionsStore, useTabsStore } from '@/store';
import { CollectionModal } from '@/components/collections/CollectionModal';
import { CollectionItem } from '@/components/collections/CollectionItem';
import { HistoryPanel } from '@/components/history';
import type { ICollection } from '@shared/collections';

type TabType = 'collections' | 'history';

/**
 * Боковая панель с коллекциями и запросами
 */
export const Sidebar = () => {
  const { collections, loading, fetchCollections } = useCollectionsStore();
  const { addTab } = useTabsStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<ICollection | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('collections');

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  const handleOpenModal = () => {
    setEditingCollection(null);
    setIsModalOpen(true);
  };

  const handleEdit = (collection: ICollection) => {
    setEditingCollection(collection);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCollection(null);
  };

  const handleNewRequest = () => {
    // Создать новую вкладку для запроса
    addTab({
      name: 'New Request',
      isDirty: true,
      data: {},
    });
  };

  return (
    <>
      <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col">
        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('collections')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'collections'
                ? 'bg-white text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <FolderOpen className="w-4 h-4" />
            Collections
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'history'
                ? 'bg-white text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Clock className="w-4 h-4" />
            History
          </button>
        </div>

        {/* Collections Tab */}
        {activeTab === 'collections' && (
          <>
            {/* Header */}
            <div className="p-4 border-b border-gray-200 space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Collections</h2>
                <button
                  onClick={handleOpenModal}
                  className="p-1 hover:bg-gray-200 rounded transition-colors"
                  title="New Collection"
                >
                  <Plus className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              {/* New Request Button */}
              <button
                onClick={handleNewRequest}
                className="w-full flex items-center gap-2 px-3 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors text-sm"
              >
                <FileText className="w-4 h-4" />
                New Request
              </button>
            </div>

            {/* Collections List */}
            <div className="flex-1 overflow-y-auto p-2">
              {loading && (
                <div className="text-center py-4 text-gray-500">Loading...</div>
              )}

              {!loading && collections.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-sm">No collections yet</p>
                  <p className="text-xs mt-2">Click + to create one</p>
                </div>
              )}

              {collections.map((collection) => (
                <CollectionItem
                  key={collection.id}
                  collection={collection}
                  onEdit={handleEdit}
                />
              ))}
            </div>
          </>
        )}

        {/* History Tab */}
        {activeTab === 'history' && <HistoryPanel />}
      </div>

      {/* Collection Modal */}
      <CollectionModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        collection={editingCollection}
      />
    </>
  );
};
