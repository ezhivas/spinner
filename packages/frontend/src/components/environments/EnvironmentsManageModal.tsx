import { useEffect, useState } from 'react';
import { Edit, Trash2, Plus } from 'lucide-react';
import { Modal, Button, ConfirmDialog } from '@/components/common';
import { useEnvironmentsStore, useToastStore } from '@/store';
import type { IEnvironment } from '@shared/environments';

interface EnvironmentsManageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEdit: (env: IEnvironment) => void;
  onCreate: () => void;
}

/**
 * Модальное окно для управления всеми environments
 */
export const EnvironmentsManageModal = ({
  isOpen,
  onClose,
  onEdit,
  onCreate,
}: EnvironmentsManageModalProps) => {
  const { environments, fetchEnvironments, deleteEnvironment, loading } = useEnvironmentsStore();
  const { success, error: showError } = useToastStore();
  const [confirmDelete, setConfirmDelete] = useState<IEnvironment | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchEnvironments();
    }
  }, [isOpen, fetchEnvironments]);

  const handleDelete = async (env: IEnvironment) => {
    setConfirmDelete(env);
  };

  const handleConfirmDelete = async () => {
    if (!confirmDelete) return;

    try {
      await deleteEnvironment(confirmDelete.id);
      success('Environment deleted');
    } catch {
      showError('Failed to delete environment');
    }
  };

  const handleEdit = (env: IEnvironment) => {
    onEdit(env);
    onClose();
  };

  const handleCreate = () => {
    onCreate();
    onClose();
  };

  return (
    <>
    <Modal isOpen={isOpen} onClose={onClose} title="Manage Environments" size="lg">
      <div className="space-y-4">
        {/* Create Button */}
        <Button
          onClick={handleCreate}
          icon={<Plus className="w-4 h-4" />}
          className="w-full"
        >
          Create New Environment
        </Button>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        )}

        {/* Empty State */}
        {!loading && environments.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500 mb-4">No environments yet</p>
            <p className="text-sm text-gray-400">Create your first environment to get started</p>
          </div>
        )}

        {/* Environments List */}
        {!loading && environments.length > 0 && (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {environments.map((env) => (
              <div
                key={env.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-gray-900 truncate">
                      {env.name}
                    </h3>
                    <div className="mt-1 text-sm text-gray-600">
                      {Object.keys(env.variables || {}).length} variable(s)
                    </div>

                    {env.variables && Object.keys(env.variables).length > 0 && (
                      <div className="mt-2 space-y-1">
                        {Object.entries(env.variables).slice(0, 2).map(([key, value]) => (
                          <div key={key} className="flex items-center gap-2 text-xs">
                            <code className="px-1.5 py-0.5 bg-gray-100 rounded font-mono">
                              {key}
                            </code>
                            <span className="text-gray-400">=</span>
                            <span className="text-gray-600 truncate max-w-xs">{value}</span>
                          </div>
                        ))}
                        {Object.keys(env.variables).length > 2 && (
                          <div className="text-xs text-gray-500">
                            +{Object.keys(env.variables).length - 2} more
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleEdit(env)}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(env)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex justify-end pt-4 mt-4 border-t border-gray-200">
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      </div>
    </Modal>

    {/* Диалог подтверждения удаления */}
    <ConfirmDialog
      isOpen={!!confirmDelete}
      onClose={() => setConfirmDelete(null)}
      onConfirm={() => {
        handleConfirmDelete();
        setConfirmDelete(null);
      }}
      title="Delete Environment"
      message={confirmDelete ? `Are you sure you want to delete "${confirmDelete.name}"? This action cannot be undone.` : ''}
      confirmText="Delete"
      variant="danger"
    />
    </>
  );
};
