import { useState, useEffect } from 'react';
import { Clock, Filter, Trash2, RefreshCw, Eye } from 'lucide-react';
import { useRunsStore } from '@/store';
import { RunDetailsModal } from './RunDetailsModal';
import type { IRun } from '@shared/runs';

export const HistoryPanel = () => {
  const { runs, loading, fetchRuns, clearHistory } = useRunsStore();
  const [selectedRun, setSelectedRun] = useState<IRun | null>(null);
  const [filter, setFilter] = useState<'all' | 'success' | 'failed'>('all');

  useEffect(() => {
    fetchRuns();
  }, [fetchRuns]);

  const filteredRuns = runs.filter((run) => {
    if (filter === 'all') return true;
    if (filter === 'success') return run.status === 'completed' && !run.error;
    if (filter === 'failed') return run.status === 'failed' || run.error;
    return true;
  });

  const getStatusColor = (run: IRun) => {
    if (run.status === 'pending') return 'text-yellow-600 bg-yellow-50';
    if (run.status === 'running') return 'text-blue-600 bg-blue-50';
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
    if (confirm('Are you sure you want to clear all history?')) {
      clearHistory();
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
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">History</h2>
          <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
            {filteredRuns.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Filters */}
          <div className="flex items-center gap-1 border border-gray-300 rounded-md overflow-hidden">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 text-sm ${
                filter === 'all' ? 'bg-primary-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('success')}
              className={`px-3 py-1 text-sm ${
                filter === 'success' ? 'bg-green-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Success
            </button>
            <button
              onClick={() => setFilter('failed')}
              className={`px-3 py-1 text-sm ${
                filter === 'failed' ? 'bg-red-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Failed
            </button>
          </div>

          {/* Actions */}
          <button
            onClick={fetchRuns}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleClearHistory}
            className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
            title="Clear History"
            disabled={runs.length === 0}
          >
            <Trash2 className="w-4 h-4" />
          </button>
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
                className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => setSelectedRun(run)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Request Info */}
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs font-semibold text-gray-600">
                        {run.request?.method || 'GET'}
                      </span>
                      <span className="text-sm text-gray-900 truncate">
                        {run.request?.url || 'Unknown URL'}
                      </span>
                    </div>

                    {/* Request Name */}
                    {run.request?.name && (
                      <div className="text-sm text-gray-600 mb-2">{run.request.name}</div>
                    )}

                    {/* Status & Time */}
                    <div className="flex items-center gap-3 text-xs">
                      <span className={`px-2 py-1 rounded-md font-medium ${getStatusColor(run)}`}>
                        {run.responseStatus || run.status}
                      </span>
                      {run.duration && (
                        <span className="text-gray-500">{run.duration}ms</span>
                      )}
                      <span className="text-gray-400">{formatDate(run.createdAt)}</span>
                    </div>

                    {/* Error */}
                    {run.error && (
                      <div className="mt-2 text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                        {run.error}
                      </div>
                    )}
                  </div>

                  {/* View Button */}
                  <button
                    className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedRun(run);
                    }}
                    title="View Details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
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
    </div>
  );
};
