import { useState } from 'react';
import { Folder, MoreVertical, Edit, Trash2, Download, ChevronRight, ChevronDown, FileText, X, FileCode, Copy } from 'lucide-react';
import type { ICollection } from '@shared/collections';
import type { IRequest } from '@shared/requests';
import { useCollectionsStore, useToastStore, useTabsStore, useRequestsStore, useEnvironmentsStore } from '@/store';
import { requestsApi } from '@/api';
import { ConfirmDialog } from '@/components/common';
import { HttpMethod } from '@shared/common/enums';

interface CollectionItemProps {
  collection: ICollection;
  onEdit: (collection: ICollection) => void;
}

/**
 * Компонент элемента коллекции в списке
 */
export const CollectionItem = ({ collection, onEdit }: CollectionItemProps) => {
  const [showMenu, setShowMenu] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [confirmDeleteCollection, setConfirmDeleteCollection] = useState(false);
  const [confirmDeleteRequest, setConfirmDeleteRequest] = useState<IRequest | null>(null);
  const { deleteCollection, exportCollection, fetchCollections } = useCollectionsStore();
  const { deleteRequest } = useRequestsStore();
  const { success, error: showError } = useToastStore();
  const { addTab } = useTabsStore();
  const { activeEnvironmentId } = useEnvironmentsStore();

  const handleDelete = () => {
    setConfirmDeleteCollection(true);
    setShowMenu(false);
  };

  const handleConfirmDeleteCollection = async () => {
    try {
      await deleteCollection(collection.id);
      success('Collection deleted');
    } catch {
      showError('Failed to delete collection');
    }
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
    } catch {
      showError('Failed to export collection');
    }
    setShowMenu(false);
  };

  const handleOpenRequest = (request: IRequest) => {
    addTab({
      name: request.name,
      requestId: request.id,
      isDirty: false,
      data: request,
    });
  };

  const handleDeleteRequest = (e: React.MouseEvent, request: IRequest) => {
    e.stopPropagation(); // Предотвращаем открытие запроса
    setConfirmDeleteRequest(request);
  };

  const handleConfirmDeleteRequest = async () => {
    if (!confirmDeleteRequest) return;

    try {
      await deleteRequest(confirmDeleteRequest.id);
      success('Request deleted');
      // Обновляем список коллекций чтобы увидеть изменения
      await fetchCollections();
    } catch {
      showError('Failed to delete request');
    }
  };

  const handleExportRequestAsCurl = async (e: React.MouseEvent, request: IRequest) => {
    e.stopPropagation(); // Предотвращаем открытие запроса

    try {
      const blob = await requestsApi.exportAsCurl(request.id, activeEnvironmentId ?? undefined);

      // Создаем ссылку для скачивания
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${request.name.replace(/[^a-zA-Z0-9]/g, '_')}.sh`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      const envMessage = activeEnvironmentId ? ' (with environment variables resolved)' : '';
      success(`Request exported as cURL${envMessage}`);
    } catch {
      showError('Failed to export request as cURL');
    }
  };

  const handleCopyCurlToClipboard = async (e: React.MouseEvent, request: IRequest) => {
    e.stopPropagation(); // Предотвращаем открытие запроса

    try {
      const blob = await requestsApi.exportAsCurl(request.id, activeEnvironmentId ?? undefined);
      const text = await blob.text();

      await navigator.clipboard.writeText(text);
      const envMessage = activeEnvironmentId ? ' (with environment variables resolved)' : '';
      success(`cURL command copied to clipboard${envMessage}`);
    } catch {
      showError('Failed to copy cURL to clipboard');
    }
  };

  const requests = collection.requests || [];

  return (
    <div className="mb-1">
      {/* Collection Header */}
      <div className="group relative flex items-center gap-2 p-2 hover:bg-gray-100 rounded">
        {/* Expand/Collapse Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-0.5 hover:bg-gray-200 rounded transition-colors"
        >
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-500" />
          )}
        </button>

        <Folder className="w-4 h-4 text-gray-500" />
        <span className="flex-1 text-sm text-gray-900 truncate">
          {collection.name}
          {requests.length > 0 && (
            <span className="ml-2 text-xs text-gray-500">({requests.length})</span>
          )}
        </span>

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

      {/* Requests List */}
      {isExpanded && requests.length > 0 && (
        <div className="ml-6 mt-1 space-y-1">
          {requests.map((request: IRequest) => (
            <div
              key={request.id}
              className="group/request flex items-center gap-2 p-2 hover:bg-gray-100 rounded transition-colors"
            >
              <button
                onClick={() => handleOpenRequest(request)}
                className="flex-1 flex items-center gap-2 text-left min-w-0"
              >
                <FileText className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                <span
                  className={`text-xs font-mono px-1.5 py-0.5 rounded flex-shrink-0 ${
                    request.method === HttpMethod.GET
                      ? 'bg-green-100 text-green-700'
                      : request.method === HttpMethod.POST
                      ? 'bg-blue-100 text-blue-700'
                      : request.method === HttpMethod.PUT
                      ? 'bg-yellow-100 text-yellow-700'
                      : request.method === HttpMethod.PATCH
                      ? 'bg-orange-100 text-orange-700'
                      : request.method === HttpMethod.DELETE
                      ? 'bg-red-100 text-red-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {request.method}
                </span>
                <span className="flex-1 text-sm text-gray-700 truncate">
                  {request.name}
                </span>
              </button>
              
              {/* Copy cURL to Clipboard Button */}
              <button
                onClick={(e) => handleCopyCurlToClipboard(e, request)}
                className="opacity-0 group-hover/request:opacity-100 p-1 text-green-600 hover:bg-green-50 rounded transition-all"
                title="Copy cURL to clipboard"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>

              {/* Export as cURL Button */}
              <button
                onClick={(e) => handleExportRequestAsCurl(e, request)}
                className="opacity-0 group-hover/request:opacity-100 p-1 text-blue-600 hover:bg-blue-50 rounded transition-all"
                title="Export as cURL (download)"
              >
                <FileCode className="w-3.5 h-3.5" />
              </button>

              {/* Delete Button */}
              <button
                onClick={(e) => handleDeleteRequest(e, request)}
                className="opacity-0 group-hover/request:opacity-100 p-1 text-red-600 hover:bg-red-50 rounded transition-all"
                title="Delete request"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Empty state when expanded but no requests */}
      {isExpanded && requests.length === 0 && (
        <div className="ml-6 mt-1 p-2 text-xs text-gray-400 italic">
          No requests in this collection
        </div>
      )}

      {/* Диалоги подтверждения */}
      <ConfirmDialog
        isOpen={confirmDeleteCollection}
        onClose={() => setConfirmDeleteCollection(false)}
        onConfirm={() => {
          handleConfirmDeleteCollection();
          setConfirmDeleteCollection(false);
        }}
        title="Delete Collection"
        message={`Are you sure you want to delete "${collection.name}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />

      <ConfirmDialog
        isOpen={!!confirmDeleteRequest}
        onClose={() => setConfirmDeleteRequest(null)}
        onConfirm={() => {
          handleConfirmDeleteRequest();
          setConfirmDeleteRequest(null);
        }}
        title="Delete Request"
        message={confirmDeleteRequest ? `Are you sure you want to delete "${confirmDeleteRequest.name}"?` : ''}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
};
