/**
 * Parser для Postman Collection Format v2.1
 * Конвертирует Postman коллекции в формат SpinneR
 */

interface PostmanRequest {
  name: string;
  request: {
    method: string;
    url: string | { raw: string };
    header?: Array<{ key: string; value: string }>;
    body?: {
      mode: string;
      raw?: string;
      formdata?: Array<{ key: string; value: string }>;
      urlencoded?: Array<{ key: string; value: string }>;
    };
  };
  event?: Array<{
    listen: string;
    script: { exec: string[] };
  }>;
}

interface PostmanCollection {
  info: {
    name: string;
    description?: string;
    schema: string;
  };
  item: PostmanRequest[];
}

interface PostmanFolder {
  name: string;
  item: PostmanRequest[];
}

interface SpinnerRequest {
  name: string;
  method: string;
  url: string;
  headers: Record<string, string>;
  queryParams: Record<string, string>;
  body: string;
  bodyType: 'json' | 'text' | 'form' | 'none';
  preRequestScript: string;
  postRequestScript: string;
}

interface SpinnerCollection {
  name: string;
  description: string;
  requests: SpinnerRequest[];
}

interface SpinnerCollectionInput {
  name: string;
  description?: string;
  requests?: Array<{
    name: string;
    method: string;
    url: string;
    headers?: Record<string, unknown>;
    queryParams?: Record<string, unknown>;
    body?: string;
    preRequestScript?: string;
    postRequestScript?: string;
  }>;
}

/**
 * Parse Postman collection URL
 */
function parsePostmanUrl(url: string | { raw: string }): { url: string; queryParams: Record<string, string> } {
  const rawUrl = typeof url === 'string' ? url : url.raw;

  try {
    const urlObj = new URL(rawUrl);
    const queryParams: Record<string, string> = {};

    urlObj.searchParams.forEach((value, key) => {
      queryParams[key] = value;
    });

    // Remove query params from URL
    urlObj.search = '';

    return {
      url: urlObj.toString(),
      queryParams,
    };
  } catch {
    // If URL is invalid, return as is
    return {
      url: rawUrl,
      queryParams: {},
    };
  }
}

/**
 * Parse Postman headers
 */
function parsePostmanHeaders(headers?: Array<{ key: string; value: string; disabled?: boolean }>): Record<string, string> {
  if (!headers) return {};

  const result: Record<string, string> = {};

  headers.forEach((header) => {
    if (!header.disabled) {
      result[header.key] = header.value;
    }
  });

  return result;
}

/**
 * Parse Postman body
 */
function parsePostmanBody(body?: PostmanRequest['request']['body']): { body: string; bodyType: SpinnerRequest['bodyType'] } {
  if (!body) {
    return { body: '', bodyType: 'none' };
  }

  switch (body.mode) {
    case 'raw':
      return {
        body: body.raw || '',
        bodyType: 'json',
      };

    case 'formdata':
      if (body.formdata) {
        const formData: Record<string, string> = {};
        body.formdata.forEach((item) => {
          formData[item.key] = item.value;
        });
        return {
          body: JSON.stringify(formData, null, 2),
          bodyType: 'form',
        };
      }
      return { body: '', bodyType: 'form' };

    case 'urlencoded':
      if (body.urlencoded) {
        const formData: Record<string, string> = {};
        body.urlencoded.forEach((item) => {
          formData[item.key] = item.value;
        });
        return {
          body: JSON.stringify(formData, null, 2),
          bodyType: 'form',
        };
      }
      return { body: '', bodyType: 'form' };

    default:
      return { body: '', bodyType: 'none' };
  }
}

/**
 * Parse Postman scripts
 */
function parsePostmanScripts(events?: PostmanRequest['event']): { preRequestScript: string; postRequestScript: string } {
  if (!events) {
    return { preRequestScript: '', postRequestScript: '' };
  }

  let preRequestScript = '';
  let postRequestScript = '';

  events.forEach((event) => {
    const script = event.script.exec.join('\n');

    if (event.listen === 'prerequest') {
      preRequestScript = script;
    } else if (event.listen === 'test') {
      postRequestScript = script;
    }
  });

  return { preRequestScript, postRequestScript };
}

/**
 * Parse single Postman request
 */
function parsePostmanRequest(item: PostmanRequest): SpinnerRequest {
  const { url, queryParams } = parsePostmanUrl(item.request.url);
  const headers = parsePostmanHeaders(item.request.header);
  const { body, bodyType } = parsePostmanBody(item.request.body);
  const { preRequestScript, postRequestScript } = parsePostmanScripts(item.event);

  return {
    name: item.name,
    method: item.request.method,
    url,
    headers,
    queryParams,
    body,
    bodyType,
    preRequestScript,
    postRequestScript,
  };
}

/**
 * Main parser function
 * Converts Postman Collection v2.1 to SpinneR format
 */
export function parsePostmanCollection(data: Record<string, unknown>): SpinnerCollection {
  // Validate schema
  if (!data.info || !data.info.schema) {
    throw new Error('Invalid Postman collection: missing schema');
  }

  if (!data.info.schema.includes('v2.1')) {
    throw new Error('Only Postman Collection v2.1 format is supported');
  }

  const postmanCollection = data as PostmanCollection;

  // Parse collection info
  const name = postmanCollection.info.name;
  const description = postmanCollection.info.description || '';

  // Parse requests
  const requests: SpinnerRequest[] = [];

  if (postmanCollection.item && Array.isArray(postmanCollection.item)) {
    postmanCollection.item.forEach((item) => {
      // Handle nested folders (flatten for now)
      if ('item' in item && Array.isArray((item as unknown as PostmanFolder).item)) {
        // It's a folder, recursively parse items
        (item as unknown as PostmanFolder).item.forEach((nestedItem: PostmanRequest) => {
          requests.push(parsePostmanRequest(nestedItem));
        });
      } else {
        // It's a request
        requests.push(parsePostmanRequest(item));
      }
    });
  }

  return {
    name,
    description,
    requests,
  };
}

/**
 * Export SpinneR collection to Postman format
 */
export function exportToPostmanFormat(collection: SpinnerCollectionInput): PostmanCollection {
  const postmanItems: PostmanRequest[] = [];

  if (collection.requests && Array.isArray(collection.requests)) {
    collection.requests.forEach((request) => {
      const headers: Array<{ key: string; value: string }> = [];

      if (request.headers) {
        Object.entries(request.headers).forEach(([key, value]) => {
          headers.push({ key, value: String(value) });
        });
      }

      const events: PostmanRequest['event'] = [];

      if (request.preRequestScript) {
        events.push({
          listen: 'prerequest',
          script: { exec: request.preRequestScript.split('\n') },
        });
      }

      if (request.postRequestScript) {
        events.push({
          listen: 'test',
          script: { exec: request.postRequestScript.split('\n') },
        });
      }

      // Build URL with query params
      let fullUrl = request.url;
      if (request.queryParams && Object.keys(request.queryParams).length > 0) {
        const params = new URLSearchParams(request.queryParams);
        fullUrl = `${request.url}?${params.toString()}`;
      }

      postmanItems.push({
        name: request.name,
        request: {
          method: request.method,
          url: { raw: fullUrl },
          header: headers,
          body: request.body
            ? {
                mode: 'raw',
                raw: request.body,
              }
            : undefined,
        },
        event: events.length > 0 ? events : undefined,
      });
    });
  }

  return {
    info: {
      name: collection.name,
      description: collection.description || '',
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
    },
    item: postmanItems,
  };
}
