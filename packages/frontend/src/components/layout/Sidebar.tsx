import { useEffect, useState } from 'react';
import { Plus, FileText, FolderOpen, Clock } from 'lucide-react';
import { useCollectionsStore, useTabsStore } from '@/store';
import { CollectionModal } from '@/components/collections/CollectionModal';
import { CollectionItem } from '@/components/collections/CollectionItem';
import { HistoryPanel } from '@/components/history';
import { ResizablePanel } from '@/components/common';
import { NewRequestModal } from '@/components/requests/NewRequestModal';
import type { ICollection } from '@shared/collections';

type TabType = 'collections' | 'history';

/**
 * Боковая панель с коллекциями и запросами
 */
export const Sidebar = () => {
  const { collections, loading, fetchCollections } = useCollectionsStore();
  const { addTab } = useTabsStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNewRequestModalOpen, setIsNewRequestModalOpen] = useState(false);
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
    setIsNewRequestModalOpen(true);
  };

  const handleCreateRequest = (collectionId?: number) => {
    addTab({
      name: 'New Request',
      isDirty: true,
      data: {
        collectionId,
      },
    });
  };

  return (
    <>
      <ResizablePanel defaultWidth={400} minWidth={180} maxWidth={800} storageKey="sidebar-width">
        {(panelWidth) => (
          <div className="h-full bg-gray-50 border-r border-gray-200 flex flex-col">
            {/* Tabs */}
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveTab('collections')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors flex-wrap ${
                  activeTab === 'collections'
                    ? 'bg-white text-primary-600 border-b-2 border-primary-600'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
                title="Collections"
              >
                <FolderOpen 
                  size={20} 
                  color={activeTab === 'collections' ? '#2563eb' : '#4B5563'} 
                  strokeWidth={2.5} 
                  style={{ minWidth: '20px', minHeight: '20px', flexShrink: 0 }} 
                />
                <span>Collections</span>
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors flex-wrap ${
                  activeTab === 'history'
                    ? 'bg-white text-primary-600 border-b-2 border-primary-600'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
                title="History"
              >
                <Clock 
                  size={20} 
                  color={activeTab === 'history' ? '#2563eb' : '#4B5563'} 
                  strokeWidth={2.5} 
                  style={{ minWidth: '20px', minHeight: '20px', flexShrink: 0 }} 
                />
                <span>History</span>
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
                      <Plus size={20} color="#4B5563" strokeWidth={2} style={{ minWidth: '20px', minHeight: '20px' }} />
                    </button>
                  </div>

                  {/* New Request Button */}
                  <button
                    onClick={handleNewRequest}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors text-sm flex-wrap"
                    title="New Request"
                  >
                    <FileText size={18} color="#FFFFFF" strokeWidth={2.5} style={{ minWidth: '18px', minHeight: '18px', flexShrink: 0 }} />
                    <span>New Request</span>
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
        )}
      </ResizablePanel>

      {/* Collection Modal */}
      <CollectionModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        collection={editingCollection}
      />

      {/* New Request Modal */}
      <NewRequestModal
        isOpen={isNewRequestModalOpen}
        onClose={() => setIsNewRequestModalOpen(false)}
        collections={collections}
        onCreateRequest={handleCreateRequest}
      />
    </>
  );
};
