import { useState, useEffect } from 'react';
import { RequestForm } from './RequestForm';
import { RequestTabs } from './RequestTabs';
import { ResponseViewer } from './ResponseViewer';
import { useRequestsStore, useRunsStore, useEnvironmentsStore, useToastStore } from '@/store';
import type { IRequest } from '@shared/requests';
import type { IRun } from '@shared/runs';
import { HttpMethod } from '@shared/common/enums';

interface KeyValuePair {
  key: string;
  value: string;
  enabled: boolean;
}

interface RequestEditorProps {
  requestId?: number;
  onSave?: (request: IRequest) => void;
}

/**
 * Главный компонент редактора запросов
 */
export const RequestEditor = ({ requestId, onSave }: RequestEditorProps) => {
  const { getRequestById, createRequest, updateRequest } = useRequestsStore();
  const { createRun, currentRun, setCurrentRun } = useRunsStore();
  const { activeEnvironmentId, resolveVariables } = useEnvironmentsStore();
  const { success, error: showError } = useToastStore();

  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [request, setRequest] = useState<Partial<IRequest>>({
    name: 'New Request',
    method: HttpMethod.GET,
    url: '',
    queryParams: {},
    headers: {},
    body: '',
    preRequestScript: '',
    postRequestScript: '',
  });

  // Преобразование объекта в массив пар ключ-значение
  const objectToKeyValueArray = (obj: Record<string, string> = {}): KeyValuePair[] => {
    return Object.entries(obj).map(([key, value]) => ({
      key,
      value,
      enabled: true,
    }));
  };

  // Преобразование массива в объект
  const keyValueArrayToObject = (arr: KeyValuePair[]): Record<string, string> => {
    return arr
      .filter((item) => item.enabled && item.key.trim())
      .reduce((acc, item) => {
        acc[item.key] = item.value;
        return acc;
      }, {} as Record<string, string>);
  };

  const [queryParams, setQueryParams] = useState<KeyValuePair[]>([]);
  const [headers, setHeaders] = useState<KeyValuePair[]>([]);
  const [bodyType, setBodyType] = useState<'json' | 'text' | 'none'>('none');

  // Загрузка запроса
  useEffect(() => {
    if (requestId) {
      setLoading(true);
      getRequestById(requestId)
        .then((req) => {
          setRequest(req);
          setQueryParams(objectToKeyValueArray(req.queryParams));
          setHeaders(objectToKeyValueArray(req.headers));
          if (req.body) {
            setBodyType('json');
          }
        })
        .catch((err) => {
          showError('Failed to load request');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [requestId]);

  // Обработка отправки запроса
  const handleSend = async () => {
    if (!request.url) {
      showError('URL is required');
      return;
    }

    setSending(true);
    setCurrentRun(null);

    try {
      // Сохранить запрос перед отправкой
      let savedRequestId = requestId;
      if (!savedRequestId) {
        const newRequest = await createRequest({
          ...request,
          queryParams: keyValueArrayToObject(queryParams),
          headers: keyValueArrayToObject(headers),
        } as any);
        savedRequestId = newRequest.id;
        success('Request saved');
        if (onSave) onSave(newRequest);
      } else {
        await updateRequest(savedRequestId, {
          ...request,
          queryParams: keyValueArrayToObject(queryParams),
          headers: keyValueArrayToObject(headers),
        });
      }

      // Выполнить запрос
      const run = await createRun(savedRequestId, activeEnvironmentId || undefined);

      // Показать результат
      if (run.error) {
        showError(`Request failed: ${run.error}`);
      } else {
        success(`Request completed: ${run.statusCode}`);
      }
    } catch (err) {
      showError('Failed to send request');
    } finally {
      setSending(false);
    }
  };

  // Обработка сохранения
  const handleSave = async (formData: { name: string; method: HttpMethod; url: string }) => {
    const requestData = {
      ...request,
      ...formData,
      queryParams: keyValueArrayToObject(queryParams),
      headers: keyValueArrayToObject(headers),
    };

    try {
      if (requestId) {
        await updateRequest(requestId, requestData);
        success('Request updated');
      } else {
        const newRequest = await createRequest(requestData as any);
        success('Request created');
        if (onSave) onSave(newRequest);
      }
    } catch (err) {
      showError('Failed to save request');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Loading request...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Request Form */}
      <div className="p-4 border-b border-gray-200">
        <RequestForm
          initialData={{
            name: request.name || 'New Request',
            method: request.method || HttpMethod.GET,
            url: request.url || '',
          }}
          onSubmit={handleSave}
          onSend={handleSend}
          loading={sending}
        />
      </div>

      {/* Request Configuration & Response */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 overflow-hidden">
        {/* Left: Request Configuration */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <RequestTabs
            queryParams={queryParams}
            headers={headers}
            body={request.body || ''}
            bodyType={bodyType}
            preRequestScript={request.preRequestScript || ''}
            postRequestScript={request.postRequestScript || ''}
            onQueryParamsChange={setQueryParams}
            onHeadersChange={setHeaders}
            onBodyChange={(body) => setRequest({ ...request, body })}
            onBodyTypeChange={setBodyType}
            onPreRequestScriptChange={(script) =>
              setRequest({ ...request, preRequestScript: script })
            }
            onPostRequestScriptChange={(script) =>
              setRequest({ ...request, postRequestScript: script })
            }
          />
        </div>

        {/* Right: Response */}
        <div>
          <ResponseViewer run={currentRun} loading={sending} />
        </div>
      </div>
    </div>
  );
};
