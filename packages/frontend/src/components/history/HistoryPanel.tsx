import { useState, useEffect } from 'react';
import { Clock, Trash2, RefreshCw, Eye, X } from 'lucide-react';
import { useRunsStore, useToastStore } from '@/store';
import { RunDetailsModal } from './RunDetailsModal';
import { CleanupHistoryModal } from './CleanupHistoryModal';
import { ConfirmDialog } from '@/components/common';
import type { IRun } from '@shared/runs';
import { RunStatus } from '@shared/common/enums';

export const HistoryPanel = () => {
  const { runs, loading, fetchRuns, clearHistory, deleteRun } = useRunsStore();
  const { success, error: showError } = useToastStore();
  const [selectedRun, setSelectedRun] = useState<IRun | null>(null);
  const [filter, setFilter] = useState<'all' | 'success' | 'failed'>('all');
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [confirmDeleteRun, setConfirmDeleteRun] = useState<IRun | null>(null);
  const [showCleanupModal, setShowCleanupModal] = useState(false);

  useEffect(() => {
    fetchRuns();
  }, [fetchRuns]);

  const filteredRuns = runs.filter((run) => {
    if (filter === 'all') return true;
    if (filter === 'success') {
      // Success: responseStatus существует и < 400 (200-399)
      return run.responseStatus != null && run.responseStatus < 400;
    }
    if (filter === 'failed') {
      // Failed: есть error ИЛИ responseStatus отсутствует ИЛИ responseStatus >= 400
      return run.error != null || run.responseStatus == null || run.responseStatus >= 400;
    }
    return true;
  });

  const getStatusColor = (run: IRun) => {
    if (run.status === RunStatus.PENDING) return 'text-yellow-600 bg-yellow-50';
    if (run.status === RunStatus.RUNNING) return 'text-blue-600 bg-blue-50';
    if (run.error) return 'text-red-600 bg-red-50';
    if (run.responseStatus && run.responseStatus >= 400) return 'text-orange-600 bg-orange-50';
    return 'text-green-600 bg-green-50';
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleClearHistory = () => {
    setConfirmClearAll(true);
  };

  const handleConfirmClearAll = () => {
    clearHistory();
  };

  const handleDeleteRun = async (e: React.MouseEvent, run: IRun) => {
    e.stopPropagation(); // Предотвращаем открытие детального просмотра
    setConfirmDeleteRun(run);
  };

  const handleConfirmDeleteRun = async () => {
    if (!confirmDeleteRun) return;

    try {
      await deleteRun(confirmDeleteRun.id);
      success('Run deleted');
    } catch {
      showError('Failed to delete run');
    }
  };

  if (loading && runs.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading history...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-3 border-b border-gray-200 space-y-3">
        {/* Title Row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Clock className="w-5 h-5 text-gray-600 flex-shrink-0" />
            <h2 className="text-lg font-semibold text-gray-900 truncate">History</h2>
            <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full flex-shrink-0">
              {filteredRuns.length}
            </span>
          </div>
        </div>

        {/* Filters Row */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 border border-gray-300 rounded-md overflow-hidden flex-shrink-0">
            <button
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 text-xs font-medium ${
                filter === 'all' ? 'bg-primary-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('success')}
              className={`px-2.5 py-1 text-xs font-medium ${
                filter === 'success' ? 'bg-green-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Success
            </button>
            <button
              onClick={() => setFilter('failed')}
              className={`px-2.5 py-1 text-xs font-medium ${
                filter === 'failed' ? 'bg-red-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Failed
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 ml-auto">
            <button
              onClick={fetchRuns}
              className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowCleanupModal(true)}
              className="p-1.5 text-orange-600 hover:bg-orange-50 rounded transition-colors"
              title="Cleanup Old Runs"
              disabled={runs.length === 0}
            >
              <Clock className="w-4 h-4" />
            </button>
            <button
              onClick={handleClearHistory}
              className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
              title="Clear All History"
              disabled={runs.length === 0}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* History List */}
      <div className="flex-1 overflow-y-auto">
        {filteredRuns.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <Clock className="w-16 h-16 mb-4" />
            <p className="text-lg font-medium">No history yet</p>
            <p className="text-sm mt-2">Send a request to see it here</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredRuns.map((run) => (
              <div
                key={run.id}
                className="group p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => setSelectedRun(run)}
              >
                <div className="flex flex-col gap-2">
                  {/* Request Info */}
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono text-xs font-semibold text-gray-600 flex-shrink-0">
                      {run.request?.method || 'GET'}
                    </span>
                    <span className="text-sm text-gray-900 truncate flex-1 min-w-0">
                      {run.request?.url || 'Unknown URL'}
                    </span>
                  </div>

                  {/* Request Name */}
                  {run.request?.name && (
                    <div className="text-sm text-gray-600 truncate">{run.request.name}</div>
                  )}

                  {/* Status & Time */}
                  <div className="flex items-center gap-2 text-xs flex-wrap">
                    <span className={`px-2 py-1 rounded-md font-medium flex-shrink-0 ${getStatusColor(run)}`}>
                      {run.responseStatus || run.status}
                    </span>
                    {run.durationMs && (
                      <span className="text-gray-500 flex-shrink-0">{run.durationMs}ms</span>
                    )}
                    <span className="text-gray-400 flex-shrink-0">{formatDate(run.createdAt.toString())}</span>
                    
                    {/* Action Buttons */}
                    <div className="flex items-center gap-1 ml-auto flex-shrink-0">
                      <button
                        className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedRun(run);
                        }}
                        title="View Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-all"
                        onClick={(e) => handleDeleteRun(e, run)}
                        title="Delete Run"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Error */}
                  {run.error && (
                    <div className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded break-words">
                      {run.error}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Run Details Modal */}
      {selectedRun && (
        <RunDetailsModal
          run={selectedRun}
          onClose={() => setSelectedRun(null)}
        />
      )}

      {/* Cleanup Modal */}
      <CleanupHistoryModal
        isOpen={showCleanupModal}
        onClose={() => setShowCleanupModal(false)}
      />

      {/* Диалоги подтверждения */}
      <ConfirmDialog
        isOpen={confirmClearAll}
        onClose={() => setConfirmClearAll(false)}
        onConfirm={() => {
          handleConfirmClearAll();
          setConfirmClearAll(false);
        }}
        title="Clear All History"
        message="Are you sure you want to clear all history? This action cannot be undone."
        confirmText="Clear All"
        variant="danger"
      />

      <ConfirmDialog
        isOpen={!!confirmDeleteRun}
        onClose={() => setConfirmDeleteRun(null)}
        onConfirm={() => {
          handleConfirmDeleteRun();
          setConfirmDeleteRun(null);
        }}
        title="Delete Run"
        message="Are you sure you want to delete this run?"
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
};
