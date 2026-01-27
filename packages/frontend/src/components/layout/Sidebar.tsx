import { useEffect } from 'react';
import { useCollectionsStore } from '@/store';

/**
 * Боковая пане��ь с коллекциями и запросами
 */
export const Sidebar = () => {
  const { collections, loading, fetchCollections } = useCollectionsStore();

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  return (
    <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Collections</h2>
          <button
            className="p-1 hover:bg-gray-200 rounded"
            title="New Collection"
          >
            <span className="text-xl">+</span>
          </button>
        </div>
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
          <div
            key={collection.id}
            className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded cursor-pointer"
          >
            <span className="text-gray-500">📁</span>
            <span className="text-sm text-gray-900">{collection.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
