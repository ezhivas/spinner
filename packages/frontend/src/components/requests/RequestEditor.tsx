import { useState, useEffect } from 'react';
import { RequestForm } from './RequestForm';
import { RequestTabs } from './RequestTabs';
import { ResponseViewer } from './ResponseViewer';
import { ResizableSplit } from '@/components/common';
import { useRequestsStore, useRunsStore, useEnvironmentsStore, useToastStore } from '@/store';
import type { IRequest } from '@shared/requests';
import { HttpMethod } from '@shared/common/enums';

interface KeyValuePair {
  key: string;
  value: string;
  enabled: boolean;
}

interface RequestEditorProps {
  requestId?: number;
  initialCollectionId?: number;
  onSave?: (request: IRequest) => void;
}

/**
 * Главный компонент редактора запросов
 */
export const RequestEditor = ({ requestId, initialCollectionId, onSave }: RequestEditorProps) => {
  const { getRequestById, createRequest, updateRequest } = useRequestsStore();
  const { createRun, pollRunUntilComplete, cancelRun, currentRun, setCurrentRun } = useRunsStore();
  const { activeEnvironmentId } = useEnvironmentsStore();
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
    collectionId: initialCollectionId,
  });

  // Сохраняем оригинальные данные для сравнения
  const [originalRequest, setOriginalRequest] = useState<Partial<IRequest> | null>(null);
  const [originalQueryParams, setOriginalQueryParams] = useState<KeyValuePair[]>([]);
  const [originalHeaders, setOriginalHeaders] = useState<KeyValuePair[]>([]);

  // Преобразование объекта в массив пар ключ-значение
  const objectToKeyValueArray = (obj?: Record<string, string> | null): KeyValuePair[] => {
    if (!obj || typeof obj !== 'object') return [];
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
    if (requestId && requestId > 0) {
      setLoading(true);
      getRequestById(requestId)
        .then((req) => {
          // Normalize body to string
          const normalizedReq = {
            ...req,
            headers: req.headers && typeof req.headers === 'object' ? req.headers : {},
            queryParams: req.queryParams && typeof req.queryParams === 'object' ? req.queryParams : {},
            body: typeof req.body === 'string'
              ? req.body
              : req.body != null
                ? JSON.stringify(req.body, null, 2)
                : '',
          };

          setRequest(normalizedReq);
          setOriginalRequest(normalizedReq);
          const qp = objectToKeyValueArray(normalizedReq.queryParams);
          const hd = objectToKeyValueArray(normalizedReq.headers);
          setQueryParams(qp);
          setHeaders(hd);
          setOriginalQueryParams(qp);
          setOriginalHeaders(hd);
          if (normalizedReq.body) {
            setBodyType('json');
          }
        })
        .catch((error) => {
          showError(`Failed to load request: ${error.message || 'Unknown error'}`);
        })
        .finally(() => {
          setLoading(false);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestId]);

  // Проверка наличия изменений
  const hasChanges = () => {
    // Для нового запроса (нет requestId) - всегда показываем кнопку Save
    if (!requestId) return true;
    
    if (!originalRequest) return false;

    // Проверяем основные поля
    if (
      request.name !== originalRequest.name ||
      request.method !== originalRequest.method ||
      request.url !== originalRequest.url ||
      request.body !== originalRequest.body ||
      request.preRequestScript !== originalRequest.preRequestScript ||
      request.postRequestScript !== originalRequest.postRequestScript ||
      request.collectionId !== originalRequest.collectionId ||
      JSON.stringify(request.auth) !== JSON.stringify(originalRequest.auth)
    ) {
      return true;
    }

    // Проверяем queryParams
    const currentQP = JSON.stringify(keyValueArrayToObject(queryParams));
    const originalQP = JSON.stringify(keyValueArrayToObject(originalQueryParams));
    if (currentQP !== originalQP) return true;

    // Проверяем headers
    const currentHD = JSON.stringify(keyValueArrayToObject(headers));
    const originalHD = JSON.stringify(keyValueArrayToObject(originalHeaders));
    if (currentHD !== originalHD) return true;

    return false;
  };

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
        } as Partial<IRequest>);
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

      // Создать запрос (получим PENDING статус)
      const initialRun = await createRun(savedRequestId, activeEnvironmentId || undefined);

      // Опрашивать статус пока запрос не завершится
      const finalRun = await pollRunUntilComplete(initialRun.id);

      // Показать результат
      if (finalRun.error) {
        showError(`Request failed: ${finalRun.error}`);
      } else {
        success(`Request completed: ${finalRun.responseStatus || 'N/A'}`);
      }
    } catch (error) {
      showError(`Failed to send request: ${(error as Error).message || 'Unknown error'}`);
    } finally {
      setSending(false);
    }
  };

  // Обработка отмены запроса
  const handleCancel = async () => {
    if (!currentRun?.id) return;

    try {
      await cancelRun(currentRun.id);
      success('Request cancelled');
      setSending(false);
    } catch (error) {
      showError(`Failed to cancel request: ${(error as Error).message || 'Unknown error'}`);
    }
  };

  // Обработка сохранения
  const handleSave = async (formData: { name: string; method: HttpMethod; url: string; collectionId?: number }) => {
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
        // Обновляем original данные после сохранения
        setOriginalRequest(requestData);
        setOriginalQueryParams(queryParams);
        setOriginalHeaders(headers);
      } else {
        const newRequest = await createRequest(requestData as Partial<IRequest>);
        success('Request created');
        // Устанавливаем original данные для нового запроса
        setOriginalRequest(newRequest);
        setOriginalQueryParams(queryParams);
        setOriginalHeaders(headers);
        if (onSave) onSave(newRequest);
      }
    } catch (error) {
      showError(`Failed to save request: ${(error as Error).message || 'Unknown error'}`);
    }
  };

  // Обработка изменений в форме
  const handleFormChange = (formData: Partial<{ name: string; method: HttpMethod; url: string; collectionId?: number }>) => {
    setRequest((prev) => ({ ...prev, ...formData }));
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
            collectionId: request.collectionId,
          }}
          onSubmit={handleSave}
          onChange={handleFormChange}
          onSend={handleSend}
          onCancel={handleCancel}
          loading={sending}
          isDirtyExternal={hasChanges()}
        />
      </div>

      {/* Request Configuration & Response */}
      <ResizableSplit
        className="flex-1 p-4 gap-4 overflow-hidden"
        defaultLeftWidth={50}
        minLeftWidth={30}
        minRightWidth={30}
        left={
          <div className="border border-gray-200 rounded-lg overflow-hidden h-full">
            <RequestTabs
              queryParams={queryParams}
              headers={headers}
              body={request.body || ''}
              bodyType={bodyType}
              preRequestScript={request.preRequestScript || ''}
              postRequestScript={request.postRequestScript || ''}
              auth={request.auth}
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
              onAuthChange={(auth) => setRequest({ ...request, auth })}
            />
          </div>
        }
        right={
          <div className="h-full">
            <ResponseViewer run={currentRun} loading={sending} />
          </div>
        }
      />
    </div>
  );
};
