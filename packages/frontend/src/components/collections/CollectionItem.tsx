import { useState } from 'react';
import { Folder, MoreVertical, Edit, Trash2, Download } from 'lucide-react';
import type { ICollection } from '@shared/collections';
import { useCollectionsStore, useToastStore } from '@/store';

interface CollectionItemProps {
  collection: ICollection;
  onEdit: (collection: ICollection) => void;
}

/**
 * Компонент элемента коллекции в списке
 */
export const CollectionItem = ({ collection, onEdit }: CollectionItemProps) => {
  const [showMenu, setShowMenu] = useState(false);
  const { deleteCollection, exportCollection } = useCollectionsStore();
  const { success, error: showError } = useToastStore();

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${collection.name}"?`)) {
      return;
    }

    try {
      await deleteCollection(collection.id);
      success('Collection deleted');
    } catch (err) {
      showError('Failed to delete collection');
    }
    setShowMenu(false);
  };

  const handleExport = async () => {
    try {
      const data = await exportCollection(collection.id);

      // В браузере - скачать как файл
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${collection.name}.json`;
      a.click();
      URL.revokeObjectURL(url);

      success('Collection exported');
    } catch (err) {
      showError('Failed to export collection');
    }
    setShowMenu(false);
  };

  return (
    <div className="group relative flex items-center gap-2 p-2 hover:bg-gray-100 rounded cursor-pointer">
      <Folder className="w-4 h-4 text-gray-500" />
      <span className="flex-1 text-sm text-gray-900 truncate">{collection.name}</span>

      {/* Menu Button */}
      <div className="relative">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded transition-opacity"
        >
          <MoreVertical className="w-4 h-4 text-gray-600" />
        </button>

        {/* Dropdown Menu */}
        {showMenu && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowMenu(false)}
            />

            {/* Menu */}
            <div className="absolute right-0 top-8 z-20 w-48 bg-white border border-gray-200 rounded-md shadow-lg py-1">
              <button
                onClick={() => {
                  onEdit(collection);
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <Edit className="w-4 h-4" />
                Edit
              </button>

              <button
                onClick={handleExport}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <Download className="w-4 h-4" />
                Export
              </button>

              <hr className="my-1 border-gray-200" />

              <button
                onClick={handleDelete}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
