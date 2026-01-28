import type React from 'react';

export type AuthType = 'noauth' | 'bearer' | 'basic' | 'apikey' | 'oauth2';

export interface AuthConfig {
  type: AuthType;
  bearer?: { token: string };
  basic?: { username: string; password: string };
  apikey?: { key: string; value: string; addTo: 'header' | 'query' };
  oauth2?: { accessToken: string };
}

interface AuthTabProps {
  auth?: AuthConfig;
  onChange: (auth: AuthConfig) => void;
}

export const AuthTab: React.FC<AuthTabProps> = ({ auth, onChange }) => {
  const authType = auth?.type || 'noauth';

  const handleTypeChange = (type: AuthType) => {
    onChange({ type });
  };

  const handleBearerChange = (token: string) => {
    onChange({
      type: 'bearer',
      bearer: { token },
    });
  };

  const handleBasicChange = (field: 'username' | 'password', value: string) => {
    onChange({
      type: 'basic',
      basic: {
        username: field === 'username' ? value : auth?.basic?.username || '',
        password: field === 'password' ? value : auth?.basic?.password || '',
      },
    });
  };

  const handleApiKeyChange = (
    field: 'key' | 'value' | 'addTo',
    value: string,
  ) => {
    onChange({
      type: 'apikey',
      apikey: {
        key: field === 'key' ? value : auth?.apikey?.key || '',
        value: field === 'value' ? value : auth?.apikey?.value || '',
        addTo:
          field === 'addTo'
            ? (value as 'header' | 'query')
            : auth?.apikey?.addTo || 'header',
      },
    });
  };

  const handleOAuth2Change = (accessToken: string) => {
    onChange({
      type: 'oauth2',
      oauth2: { accessToken },
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Type
        </label>
        <select
          value={authType}
          onChange={(e) => handleTypeChange(e.target.value as AuthType)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        >
          <option value="noauth">No Auth</option>
          <option value="bearer">Bearer Token</option>
          <option value="basic">Basic Auth</option>
          <option value="apikey">API Key</option>
          <option value="oauth2">OAuth 2.0</option>
        </select>
      </div>

      {authType === 'bearer' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Token
          </label>
          <input
            type="text"
            value={auth?.bearer?.token || ''}
            onChange={(e) => handleBearerChange(e.target.value)}
            placeholder="Enter bearer token or {{variable}}"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-mono text-sm"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            You can use environment variables like {`{{token}}`}
          </p>
        </div>
      )}

      {authType === 'basic' && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Username
            </label>
            <input
              type="text"
              value={auth?.basic?.username || ''}
              onChange={(e) => handleBasicChange('username', e.target.value)}
              placeholder="Username"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Password
            </label>
            <input
              type="password"
              value={auth?.basic?.password || ''}
              onChange={(e) => handleBasicChange('password', e.target.value)}
              placeholder="Password"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>
        </div>
      )}

      {authType === 'apikey' && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Key
            </label>
            <input
              type="text"
              value={auth?.apikey?.key || ''}
              onChange={(e) => handleApiKeyChange('key', e.target.value)}
              placeholder="API key name (e.g., X-API-Key)"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Value
            </label>
            <input
              type="text"
              value={auth?.apikey?.value || ''}
              onChange={(e) => handleApiKeyChange('value', e.target.value)}
              placeholder="API key value"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-mono text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Add to
            </label>
            <select
              value={auth?.apikey?.addTo || 'header'}
              onChange={(e) => handleApiKeyChange('addTo', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              <option value="header">Header</option>
              <option value="query">Query Params</option>
            </select>
          </div>
        </div>
      )}

      {authType === 'oauth2' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Access Token
          </label>
          <input
            type="text"
            value={auth?.oauth2?.accessToken || ''}
            onChange={(e) => handleOAuth2Change(e.target.value)}
            placeholder="Enter access token or {{variable}}"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-mono text-sm"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            You can use environment variables like {`{{accessToken}}`}
          </p>
        </div>
      )}

      {authType === 'noauth' && (
        <div className="text-sm text-gray-500 dark:text-gray-400 py-4">
          This request does not use any authorization.
        </div>
      )}
    </div>
  );
};
