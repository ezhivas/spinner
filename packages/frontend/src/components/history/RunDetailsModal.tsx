import { Modal } from '@/components/common';
import { CodeEditor } from '@/components/requests/CodeEditor';
import type { IRun } from '@shared/runs';
import { RunStatus } from '@shared/common/enums';
import { Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface RunDetailsModalProps {
  run: IRun;
  onClose: () => void;
}

export const RunDetailsModal = ({ run, onClose }: RunDetailsModalProps) => {
  const getStatusIcon = () => {
    if (run.error) return <XCircle className="w-6 h-6 text-red-600" />;
    if (run.status === RunStatus.RUNNING) return <Clock className="w-6 h-6 text-blue-600 animate-spin" />;
    if (run.status === RunStatus.COMPLETED) return <CheckCircle className="w-6 h-6 text-green-600" />;
    return <AlertCircle className="w-6 h-6 text-yellow-600" />;
  };

  const getStatusColor = () => {
    if (run.error) return 'bg-red-50 text-red-700 border-red-200';
    if (run.responseStatus && run.responseStatus >= 400) return 'bg-orange-50 text-orange-700 border-orange-200';
    if (run.responseStatus && run.responseStatus >= 200 && run.responseStatus < 300)
      return 'bg-green-50 text-green-700 border-green-200';
    return 'bg-gray-50 text-gray-700 border-gray-200';
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Run Details" size="xl">
      <div className="space-y-6">
        {/* Status Summary */}
        <div className={`flex items-center gap-4 p-4 border rounded-lg ${getStatusColor()}`}>
          {getStatusIcon()}
          <div className="flex-1">
            <h3 className="font-semibold text-lg">
              {run.request?.method} {run.request?.url}
            </h3>
            <p className="text-sm mt-1">{formatDate(run.createdAt)}</p>
          </div>
          {run.responseStatus && (
            <div className="text-3xl font-bold">{run.responseStatus}</div>
          )}
        </div>

        {/* Request Info */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Request</h4>
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600">Name:</span>
              <span className="text-sm text-gray-900">{run.request?.name || 'Unnamed'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600">Method:</span>
              <span className="text-sm font-mono font-semibold text-gray-900">
                {run.request?.method || 'GET'}
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-sm font-medium text-gray-600">URL:</span>
              <span className="text-sm text-gray-900 break-all flex-1">
                {run.request?.url || 'N/A'}
              </span>
            </div>
            {run.duration !== null && run.duration !== undefined && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-600">Duration:</span>
                <span className="text-sm text-gray-900">{run.duration}ms</span>
              </div>
            )}
          </div>
        </div>

        {/* Error */}
        {run.error && (
          <div>
            <h4 className="text-sm font-semibold text-red-700 mb-2">Error</h4>
            <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
              <pre className="text-sm text-red-900 whitespace-pre-wrap font-mono">
                {run.error}
              </pre>
            </div>
          </div>
        )}

        {/* Response Headers */}
        {run.responseHeaders && Object.keys(run.responseHeaders).length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Response Headers</h4>
            <div className="bg-gray-50 p-4 rounded-lg space-y-1 max-h-48 overflow-y-auto">
              {Object.entries(run.responseHeaders).map(([key, value]) => (
                <div key={key} className="flex items-start gap-2 text-sm">
                  <span className="font-mono text-gray-600 font-semibold min-w-40">{key}:</span>
                  <span className="text-gray-900 break-all">{String(value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Response Body */}
        {run.responseBody && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Response Body</h4>
            <CodeEditor
              value={
                typeof run.responseBody === 'string'
                  ? run.responseBody
                  : JSON.stringify(run.responseBody, null, 2)
              }
              onChange={() => {}}
              language="json"
              height="300px"
              readOnly
            />
          </div>
        )}

        {/* Script Logs */}
        {run.scriptLogs && run.scriptLogs.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Script Logs</h4>
            <div className="bg-gray-900 p-4 rounded-lg max-h-48 overflow-y-auto">
              {run.scriptLogs.map((log, index) => (
                <div key={index} className="text-sm font-mono text-green-400">
                  {log}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};
