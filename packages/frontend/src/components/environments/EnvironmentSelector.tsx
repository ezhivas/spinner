import { useState, useEffect } from 'react';
import { Settings, Plus, Check, Upload, Download } from 'lucide-react';
import { useEnvironmentsStore } from '@/store';
import { EnvironmentModal } from './EnvironmentModal';
import { EnvironmentImportModal } from './EnvironmentImportModal';
import { EnvironmentExportModal } from './EnvironmentExportModal';
import type { IEnvironment } from '@shared/environments';

/**
 * Селектор окружения в header
 */
export const EnvironmentSelector = () => {
  const {
    environments,
    activeEnvironmentId,
    setActiveEnvironment,
    fetchEnvironments,
  } = useEnvironmentsStore();

  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEnvironment, setEditingEnvironment] = useState<IEnvironment | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  useEffect(() => {
    fetchEnvironments();
  }, [fetchEnvironments]);

  const activeEnv = environments.find((e) => e.id === activeEnvironmentId);

  const handleSelect = (id: number) => {
    setActiveEnvironment(id);
    setIsOpen(false);
  };

  const handleManage = () => {
    setEditingEnvironment(null);
    setIsModalOpen(true);
    setIsOpen(false);
  };

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          <Settings className="w-4 h-4" />
          <span>{activeEnv ? activeEnv.name : 'No Environment'}</span>
        </button>

        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown */}
            <div className="absolute right-0 top-10 z-20 w-64 bg-white border border-gray-200 rounded-md shadow-lg py-1">
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
                Select Environment
              </div>

              <button
                onClick={() => handleSelect(null as any)}
                className="w-full flex items-center justify-between px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <span>No Environment</span>
                {!activeEnvironmentId && <Check className="w-4 h-4 text-primary-600" />}
              </button>

              {environments.map((env) => (
                <button
                  key={env.id}
                  onClick={() => handleSelect(env.id)}
                  className="w-full flex items-center justify-between px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <span>{env.name}</span>
                  {activeEnvironmentId === env.id && (
                    <Check className="w-4 h-4 text-primary-600" />
                  )}
                </button>
              ))}

              <hr className="my-1 border-gray-200" />

              <button
                onClick={() => {
                  setShowImportModal(true);
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <Upload className="w-4 h-4" />
                Import Environment
              </button>

              <button
                onClick={() => {
                  setShowExportModal(true);
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <Download className="w-4 h-4" />
                Export Environment
              </button>

              <hr className="my-1 border-gray-200" />

              <button
                onClick={handleManage}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-primary-600 hover:bg-primary-50"
              >
                <Plus className="w-4 h-4" />
                Manage Environments
              </button>
            </div>
          </>
        )}
      </div>

      {/* Environment Modal */}
      <EnvironmentModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingEnvironment(null);
        }}
        environment={editingEnvironment}
      />

      {/* Import Modal */}
      <EnvironmentImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
      />

      {/* Export Modal */}
      <EnvironmentExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
      />
    </>
  );
};
