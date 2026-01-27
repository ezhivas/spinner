import { useState } from 'react';
import { CodeEditor } from './CodeEditor';
import type { IRun } from '@shared/runs';

interface ResponseViewerProps {
  run: IRun | null;
  loading?: boolean;
}

/**
 * Компонент для отображения ответа от сервера
 */
export const ResponseViewer = ({ run, loading }: ResponseViewerProps) => {
  const [activeTab, setActiveTab] = useState<'body' | 'headers'>('body');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Sending request...</p>
        </div>
      </div>
    );
  }

  if (!run) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <div className="text-center text-gray-400">
          <p>No response yet</p>
          <p className="text-sm mt-2">Click "Send" to execute the request</p>
        </div>
      </div>
    );
  }

  const statusColor =
    run.statusCode >= 200 && run.statusCode < 300
      ? 'text-green-600'
      : run.statusCode >= 400
      ? 'text-red-600'
      : 'text-yellow-600';

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Status Bar */}
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className={`text-sm font-semibold ${statusColor}`}>
            Status: {run.statusCode || 'N/A'}
          </span>
          <span className="text-sm text-gray-600">
            Time: {run.responseTime ? `${run.responseTime}ms` : 'N/A'}
          </span>
          <span className="text-sm text-gray-600">
            Size: {run.responseSize ? `${(run.responseSize / 1024).toFixed(2)} KB` : 'N/A'}
          </span>
        </div>
        {run.error && (
          <span className="text-sm text-red-600">Error: {run.error}</span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-gray-50">
        <button
          onClick={() => setActiveTab('body')}
          className={`
            px-4 py-2 text-sm font-medium border-b-2 transition-colors
            ${
              activeTab === 'body'
                ? 'border-primary-500 text-primary-600 bg-white'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }
          `}
        >
          Body
        </button>
        <button
          onClick={() => setActiveTab('headers')}
          className={`
            px-4 py-2 text-sm font-medium border-b-2 transition-colors
            ${
              activeTab === 'headers'
                ? 'border-primary-500 text-primary-600 bg-white'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }
          `}
        >
          Headers
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {activeTab === 'body' && (
          <div>
            {run.responseBody ? (
              <CodeEditor
                value={
                  typeof run.responseBody === 'string'
                    ? run.responseBody
                    : JSON.stringify(run.responseBody, null, 2)
                }
                onChange={() => {}}
                language="json"
                height="400px"
                readOnly
              />
            ) : (
              <div className="text-center py-8 text-gray-400">
                No response body
              </div>
            )}
          </div>
        )}

        {activeTab === 'headers' && (
          <div className="space-y-2">
            {run.responseHeaders && Object.keys(run.responseHeaders).length > 0 ? (
              Object.entries(run.responseHeaders).map(([key, value]) => (
                <div
                  key={key}
                  className="flex items-start gap-4 p-2 bg-gray-50 rounded"
                >
                  <span className="font-mono text-sm text-gray-700 font-semibold">
                    {key}:
                  </span>
                  <span className="font-mono text-sm text-gray-600 flex-1">
                    {String(value)}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-400">
                No response headers
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
