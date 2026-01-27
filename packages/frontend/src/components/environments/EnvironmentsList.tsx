import { useState, useEffect } from 'react';
import { Edit, Trash2, Plus, Upload, Download } from 'lucide-react';
import { useEnvironmentsStore, useToastStore } from '@/store';
import { Button } from '@/components/common';
import { EnvironmentModal } from './EnvironmentModal';
import { EnvironmentImportModal } from './EnvironmentImportModal';
import { EnvironmentExportModal } from './EnvironmentExportModal';
import type { IEnvironment } from '@shared/environments';

/**
 * Список всех окружений (для отдельной страницы управления)
 */
export const EnvironmentsList = () => {
  const { environments, fetchEnvironments, deleteEnvironment, loading } = useEnvironmentsStore();
  const { success, error: showError } = useToastStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEnvironment, setEditingEnvironment] = useState<IEnvironment | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  useEffect(() => {
    fetchEnvironments();
  }, [fetchEnvironments]);

  const handleDelete = async (env: IEnvironment) => {
    if (!confirm(`Are you sure you want to delete "${env.name}"?`)) {
      return;
    }

    try {
      await deleteEnvironment(env.id);
      success('Environment deleted');
    } catch (err) {
      showError('Failed to delete environment');
    }
  };

  const handleEdit = (env: IEnvironment) => {
    setEditingEnvironment(env);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setEditingEnvironment(null);
    setIsModalOpen(true);
  };

  return (
    <>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Environments</h2>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setShowImportModal(true)}
              variant="secondary"
              icon={<Upload className="w-4 h-4" />}
            >
              Import
            </Button>
            <Button
              onClick={() => setShowExportModal(true)}
              variant="secondary"
              icon={<Download className="w-4 h-4" />}
            >
              Export
            </Button>
            <Button
              onClick={handleCreate}
              icon={<Plus className="w-4 h-4" />}
            >
              New Environment
            </Button>
          </div>
        </div>

        {loading && (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        )}

        {!loading && environments.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500 mb-4">No environments yet</p>
            <Button onClick={handleCreate}>Create First Environment</Button>
          </div>
        )}

        <div className="grid gap-4">
          {environments.map((env) => (
            <div
              key={env.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{env.name}</h3>
                  <div className="mt-2 text-sm text-gray-600">
                    {Object.keys(env.variables || {}).length} variable(s)
                  </div>

                  {env.variables && Object.keys(env.variables).length > 0 && (
                    <div className="mt-3 space-y-1">
                      {Object.entries(env.variables).slice(0, 3).map(([key, value]) => (
                        <div key={key} className="flex items-center gap-2 text-sm">
                          <code className="px-2 py-0.5 bg-gray-100 rounded text-xs font-mono">
                            {key}
                          </code>
                          <span className="text-gray-400">=</span>
                          <span className="text-gray-600 truncate">{value}</span>
                        </div>
                      ))}
                      {Object.keys(env.variables).length > 3 && (
                        <div className="text-xs text-gray-500">
                          +{Object.keys(env.variables).length - 3} more
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
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
      </div>

      <EnvironmentModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingEnvironment(null);
        }}
        environment={editingEnvironment}
      />

      <EnvironmentImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
      />

      <EnvironmentExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
      />
    </>
  );
};
