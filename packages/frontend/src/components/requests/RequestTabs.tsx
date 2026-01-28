import { useState } from 'react';
import { KeyValueEditor } from './KeyValueEditor';
import { CodeEditor } from './CodeEditor';
import { AuthTab, type AuthConfig } from './AuthTab';

interface KeyValuePair {
  key: string;
  value: string;
  enabled: boolean;
}

interface RequestTabsProps {
  queryParams: KeyValuePair[];
  headers: KeyValuePair[];
  body: string;
  bodyType: 'json' | 'text' | 'none';
  preRequestScript: string;
  postRequestScript: string;
  auth?: AuthConfig;
  onQueryParamsChange: (params: KeyValuePair[]) => void;
  onHeadersChange: (headers: KeyValuePair[]) => void;
  onBodyChange: (body: string) => void;
  onBodyTypeChange: (type: 'json' | 'text' | 'none') => void;
  onPreRequestScriptChange: (script: string) => void;
  onPostRequestScriptChange: (script: string) => void;
  onAuthChange: (auth: AuthConfig) => void;
}

/**
 * Вкладки для настройки запроса
 */
export const RequestTabs = ({
  queryParams,
  headers,
  body,
  bodyType,
  preRequestScript,
  postRequestScript,
  auth,
  onQueryParamsChange,
  onHeadersChange,
  onBodyChange,
  onBodyTypeChange,
  onPreRequestScriptChange,
  onPostRequestScriptChange,
  onAuthChange,
}: RequestTabsProps) => {
  const [activeTab, setActiveTab] = useState<'params' | 'headers' | 'auth' | 'body' | 'scripts'>('params');

  const tabs = [
    { id: 'params', label: 'Query Params', count: queryParams.filter(p => p.enabled).length },
    { id: 'headers', label: 'Headers', count: headers.filter(h => h.enabled).length },
    { id: 'auth', label: 'Authorization' },
    { id: 'body', label: 'Body' },
    { id: 'scripts', label: 'Scripts' },
  ] as const;

  return (
    <div className="flex flex-col h-full">
      {/* Tabs Header */}
      <div className="flex border-b border-gray-200 bg-gray-50 overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex-shrink-0 px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
              ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600 bg-white'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }
            `}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-primary-100 text-primary-700 rounded-full">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tabs Content */}
      <div className="flex-1 p-4 overflow-y-auto">
        {activeTab === 'params' && (
          <KeyValueEditor
            title="Query Parameters"
            items={queryParams}
            onChange={onQueryParamsChange}
            placeholder={{ key: 'param_name', value: 'value' }}
          />
        )}

        {activeTab === 'headers' && (
          <KeyValueEditor
            title="Headers"
            items={headers}
            onChange={onHeadersChange}
            placeholder={{ key: 'Header-Name', value: 'value' }}
          />
        )}

        {activeTab === 'auth' && (
          <AuthTab auth={auth} onChange={onAuthChange} />
        )}

        {activeTab === 'body' && (
          <div className="space-y-4">
            {/* Body Type Selector */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onBodyTypeChange('none')}
                className={`px-3 py-1.5 text-sm rounded ${
                  bodyType === 'none'
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                None
              </button>
              <button
                type="button"
                onClick={() => onBodyTypeChange('json')}
                className={`px-3 py-1.5 text-sm rounded ${
                  bodyType === 'json'
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                JSON
              </button>
              <button
                type="button"
                onClick={() => onBodyTypeChange('text')}
                className={`px-3 py-1.5 text-sm rounded ${
                  bodyType === 'text'
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Text
              </button>
            </div>

            {/* Body Editor */}
            {bodyType !== 'none' && (
              <CodeEditor
                value={body}
                onChange={onBodyChange}
                language={bodyType === 'json' ? 'json' : 'text'}
                height="400px"
              />
            )}
          </div>
        )}

        {activeTab === 'scripts' && (
          <div className="space-y-6">
            {/* Pre-Request Script */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">Pre-Request Script</h4>
              <p className="text-xs text-gray-500">
                Script will run before the request is sent
              </p>
              <CodeEditor
                value={preRequestScript}
                onChange={onPreRequestScriptChange}
                language="javascript"
                height="200px"
              />
            </div>

            {/* Post-Request Script */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">Post-Request Script</h4>
              <p className="text-xs text-gray-500">
                Script will run after the response is received. Use <code className="bg-gray-100 px-1">pm.response</code> and{' '}
                <code className="bg-gray-100 px-1">pm.environment</code>
              </p>
              <CodeEditor
                value={postRequestScript}
                onChange={onPostRequestScriptChange}
                language="javascript"
                height="200px"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
