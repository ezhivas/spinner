import { Injectable } from '@nestjs/common';
import { HttpMethod } from './request.entity';
import { HarRequest } from 'httpsnippet';
import { parseCurlToRequest } from './curl-shell-parser';

interface CurlConversionResult {
  name: string;
  method: HttpMethod;
  url: string;
  headers?: Record<string, string>;
  queryParams?: Record<string, string>;
  body?: any;
  bodyType?: string;
  auth?: {
    type: 'noauth' | 'bearer' | 'basic' | 'apikey' | 'oauth2';
    bearer?: { token: string };
    basic?: { username: string; password: string };
    apikey?: { key: string; value: string; addTo: 'header' | 'query' };
    oauth2?: { accessToken: string };
  };
}

@Injectable()
export class CurlConverterService {
  /**
   * Конвертирует request в cURL команду
   */
  requestToCurl(request: {
    name: string;
    method: HttpMethod;
    url: string;
    headers?: Record<string, string>;
    queryParams?: Record<string, string>;
    body?: any;
    bodyType?: string;
    auth?: {
      type: 'noauth' | 'bearer' | 'basic' | 'apikey' | 'oauth2';
      bearer?: { token: string };
      basic?: { username: string; password: string };
      apikey?: { key: string; value: string; addTo: 'header' | 'query' };
      oauth2?: { accessToken: string };
    };
  }): string {
    // Build URL with query params first
    let url = request.url;
    const queryParams = { ...(request.queryParams || {}) };

    // Process auth and add to headers/queryParams
    const headers = { ...(request.headers || {}) };

    if (request.auth && request.auth.type !== 'noauth') {
      switch (request.auth.type) {
        case 'bearer':
          if (request.auth.bearer?.token) {
            headers['Authorization'] = `Bearer ${request.auth.bearer.token}`;
          }
          break;

        case 'basic':
          if (request.auth.basic?.username && request.auth.basic?.password) {
            const credentials = Buffer.from(
              `${request.auth.basic.username}:${request.auth.basic.password}`,
            ).toString('base64');
            headers['Authorization'] = `Basic ${credentials}`;
          }
          break;

        case 'apikey':
          if (request.auth.apikey?.key && request.auth.apikey?.value) {
            if (request.auth.apikey.addTo === 'query') {
              queryParams[request.auth.apikey.key] = request.auth.apikey.value;
            } else {
              headers[request.auth.apikey.key] = request.auth.apikey.value;
            }
          }
          break;

        case 'oauth2':
          if (request.auth.oauth2?.accessToken) {
            headers['Authorization'] =
              `Bearer ${request.auth.oauth2.accessToken}`;
          }
          break;
      }
    }

    // Add query params to URL
    if (Object.keys(queryParams).length > 0) {
      const params = new URLSearchParams(queryParams).toString();
      url += (url.includes('?') ? '&' : '?') + params;
    }

    // Build HAR request for httpsnippet
    const harRequest: HarRequest = {
      method: request.method,
      url: url,
      httpVersion: 'HTTP/1.1',
      headers: Object.entries(headers).map(([name, value]) => ({
        name,
        value,
      })),
      queryString: [],
      cookies: [],
      headersSize: -1,
      bodySize: -1,
    };

    // Add body
    if (
      request.body &&
      (request.method === HttpMethod.POST ||
        request.method === HttpMethod.PUT ||
        request.method === HttpMethod.PATCH)
    ) {
      console.log('[requestToCurl] Body type:', typeof request.body);
      console.log('[requestToCurl] Body before stringify:', request.body);

      // Use minified JSON (no line breaks) like Postman does
      const bodyString =
        typeof request.body === 'string'
          ? request.body
          : JSON.stringify(request.body); // No formatting - minified

      console.log(
        '[requestToCurl] Body string after stringify, length:',
        bodyString.length,
      );
      console.log('[requestToCurl] Body string after stringify:', bodyString);

      // NOTE: Removed comment cleaning logic as it incorrectly treats URLs with // (like https://) as comments
      // and truncates the body. If you need to support JSON with actual comments, use a proper JSON-with-comments parser.

      console.log(
        '[requestToCurl] Final body string length:',
        bodyString.length,
      );
      console.log('[requestToCurl] Final body string:', bodyString);

      harRequest.postData = {
        mimeType: headers['Content-Type'] || 'application/json',
        text: bodyString,
      };
    }

    // Use manual generation instead of httpsnippet for more reliable output
    // httpsnippet sometimes truncates long bodies, so we generate it manually
    return this.generateCurlManual(harRequest);
  }

  /**
   * Конвертирует cURL команду в request объект (shell-aware парсер)
   */
  curlToRequest(curlCommand: string): CurlConversionResult {
    const parsed = parseCurlToRequest(curlCommand);
    // Генерируем name если не задан
    let name = '';
    if (parsed.name && typeof parsed.name === 'string') {
      name = parsed.name;
    } else {
      // Используем метод и url для генерации имени
      const urlPart = parsed.url
        ? parsed.url.replace(/https?:\/\//, '').split(/[/?#]/)[0]
        : 'request';
      name = `Imported ${parsed.method || 'GET'} ${urlPart}`;
    }
    // Автоматически заполняем auth по Authorization header
    let auth: any = undefined;
    if (parsed.headers && parsed.headers['Authorization']) {
      const value = parsed.headers['Authorization'];
      if (value.startsWith('Bearer ')) {
        auth = { type: 'bearer', bearer: { token: value.slice(7).trim() } };
      } else if (value.startsWith('Basic ')) {
        // Basic base64 decode
        try {
          const decoded = Buffer.from(value.slice(6).trim(), 'base64').toString(
            'utf-8',
          );
          const [username, password] = decoded.split(':');
          if (username && password) {
            auth = { type: 'basic', basic: { username, password } };
          }
        } catch (e) {
          console.error(
            '[curlToRequest] Failed to decode Basic auth header',
            e,
          );
        }
      }
    }
    return {
      name,
      method: (parsed.method || 'GET') as HttpMethod,
      url: parsed.url,
      headers:
        parsed.headers && typeof parsed.headers === 'object'
          ? parsed.headers
          : {},
      body: parsed.data,
      bodyType: typeof parsed.data === 'object' ? 'json' : 'raw',
      auth,
    };
  }

  /**
   * Generate cURL manually in Postman format - long flags, proper escaping
   */
  private generateCurlManual(harRequest: HarRequest): string {
    // Start with curl --location and URL (Postman format)
    let curl = `curl --location '${harRequest.url}'`;

    // Add method using --request (Postman format)
    if (harRequest.method !== 'GET') {
      curl += ` \\\n--request ${harRequest.method}`;
    }

    // Add headers using --header (Postman format)
    if (harRequest.headers && harRequest.headers.length > 0) {
      for (const header of harRequest.headers) {
        // Escape single quotes using '\'' method (Postman style)
        const escapedValue = header.value.replace(/'/g, "'\\''");
        curl += ` \\\n--header '${header.name}: ${escapedValue}'`;
      }
    }

    // Add body using --data (Postman format)
    if (harRequest.postData && harRequest.postData.text) {
      const bodyText = harRequest.postData.text;

      // Keep body as-is (don't reformat JSON)
      // Postman shows formatted JSON in UI but exports minified

      console.log('[CURL DEBUG] Original body length:', bodyText.length);
      console.log('[CURL DEBUG] Original body:', bodyText);

      // Escape single quotes using '\'' method (Postman style)
      const escapedBody = bodyText.replace(/'/g, "'\\''");

      console.log('[CURL DEBUG] Escaped body length:', escapedBody.length);
      console.log('[CURL DEBUG] Escaped body:', escapedBody);

      curl += ` \\\n--data '${escapedBody}'`;

      console.log('[CURL DEBUG] Final curl length:', curl.length);
    }

    return curl;
  }

  /**
   * Fallback метод для генерации cURL если httpsnippet не сработал
   */
  private generateCurlFallback(
    request: {
      method: HttpMethod;
      url: string;
      headers?: Record<string, string>;
      body?: any;
    },
    harRequest: HarRequest,
  ): string {
    // Start with curl and URL
    let curl = `curl '${harRequest.url}'`;

    // Add method (if not GET)
    if (request.method !== HttpMethod.GET) {
      curl += ` \\\n  -X ${request.method}`;
    }

    // Add headers
    if (harRequest.headers && harRequest.headers.length > 0) {
      for (const header of harRequest.headers) {
        curl += ` \\\n  -H '${header.name}: ${header.value}'`;
      }
    }

    // Add body
    if (harRequest.postData) {
      // Escape single quotes using '\'' method
      const escapedBody = harRequest.postData.text.replace(/'/g, "'\\''");
      curl += ` \\\n  -d '${escapedBody}'`;
    }

    return curl;
  }

  /**
   * Парсер cURL - поддерживает формат Postman (длинные флаги) и обычный формат
   */
  private parseComplexCurl(curlCommand: string): CurlConversionResult {
    // Normalize line breaks: replace backslash-newline (curl line continuation) with space
    const normalized = curlCommand.replace(/\\\n/g, ' ').trim();

    console.log('[parseComplexCurl] Normalized command:', normalized);

    // Extract method - support both -X and --request
    const methodMatch = normalized.match(/(?:-X|--request)\s+(\w+)/i);
    const method = (methodMatch?.[1]?.toUpperCase() || 'GET') as HttpMethod;

    // Extract URL - support both --location 'url' and plain 'url'
    let url = '';
    const locationMatch = normalized.match(/--location\s+['"]([^'"]+)['"]/);
    if (locationMatch) {
      url = locationMatch[1];
    } else {
      const curlMatch = normalized.match(/curl\s+['"]([^'"]+)['"]/);
      if (curlMatch) {
        url = curlMatch[1];
      } else {
        const curlMatch2 = normalized.match(/curl\s+(\S+)/);
        if (curlMatch2) {
          url = curlMatch2[1];
        }
      }
    }

    // Extract query params from URL
    const queryParams: Record<string, string> = {};
    const urlObj = this.parseUrl(url);
    url = urlObj.baseUrl;
    Object.assign(queryParams, urlObj.params);

    // Extract headers - support both -H and --header
    const headers: Record<string, string> = {};

    // Find all header occurrences manually to handle complex values
    const headerRegex = /(?:-H|--header)\s+'/g;
    let match;

    while ((match = headerRegex.exec(normalized)) !== null) {
      const startPos = match.index + match[0].length;
      let endPos = startPos;

      // Find matching closing quote, handling '\'' escapes
      for (let i = startPos; i < normalized.length; i++) {
        if (
          normalized[i] === "'" &&
          normalized.substring(i, i + 4) === "'\\''"
        ) {
          // Skip the '\'' escape sequence
          i += 3;
          endPos = i + 1;
        } else if (normalized[i] === "'") {
          // Found closing quote
          endPos = i;
          break;
        }
      }

      const headerContent = normalized.substring(startPos, endPos);
      const colonIndex = headerContent.indexOf(':');
      if (colonIndex > 0) {
        const name = headerContent.substring(0, colonIndex).trim();
        let value = headerContent.substring(colonIndex + 1).trim();

        // Unescape '\'' back to '
        value = value.replace(/'\\'''/g, "'");

        headers[name] = value;
        console.log(`[parseComplexCurl] Parsed header: ${name} = ${value}`);
      }
    }

    // Extract body - support -d, --data, --data-raw
    let body: any = null;
    let bodyType = 'json';

    // Find --data manually to handle complex values with '\''
    const dataMatch = normalized.match(/(?:-d|--data|--data-raw)\s+'/);
    if (dataMatch && dataMatch.index !== undefined) {
      const startPos = dataMatch.index + dataMatch[0].length;
      let endPos = startPos;

      // Find matching closing quote, handling '\'' escapes
      for (let i = startPos; i < normalized.length; i++) {
        if (
          normalized[i] === "'" &&
          normalized.substring(i, i + 4) === "'\\''"
        ) {
          // Skip the '\'' escape sequence
          i += 3;
          endPos = i + 1;
        } else if (normalized[i] === "'") {
          // Found closing quote
          endPos = i;
          break;
        }
      }

      let rawBody = normalized.substring(startPos, endPos);

      console.log('[parseComplexCurl] Raw body before unescape:', rawBody);

      // Unescape Postman-style '\'' quotes back to single quotes
      rawBody = rawBody.replace(/'\\'''/g, "'");

      console.log(
        "[parseComplexCurl] Raw body after '\\'\\'\\'' unescape:",
        rawBody,
      );

      // Try to parse as JSON first
      // JSON.parse() will handle \\n, \\", \\\\ etc. automatically
      try {
        body = JSON.parse(rawBody);
        bodyType = 'json';
        console.log('[parseComplexCurl] Parsed as JSON successfully');
      } catch (err) {
        // Not valid JSON, treat as raw string and unescape manually
        console.log(
          '[parseComplexCurl] Not valid JSON, treating as raw string',
          err,
        );

        // Unescape common escape sequences for raw strings
        rawBody = rawBody
          .replace(/\\n/g, '\n')
          .replace(/\\t/g, '\t')
          .replace(/\\r/g, '\r')
          .replace(/\\"/g, '"')
          .replace(/\\\\/g, '\\');

        body = rawBody;
        bodyType = 'raw';
        console.log(
          '[parseComplexCurl] Raw body after escape processing:',
          rawBody,
        );
      }
    }

    // Generate name from URL
    const name = this.generateNameFromUrl(url);

    return {
      name,
      method,
      url,
      headers: Object.keys(headers).length > 0 ? headers : undefined,
      queryParams:
        Object.keys(queryParams).length > 0 ? queryParams : undefined,
      body,
      bodyType,
    };
  }

  /**
   * Remove JavaScript-style comments from JSON string
   */
  private removeCommentsFromJson(jsonString: string): string {
    // Remove single-line comments (// ...)
    let cleaned = jsonString.replace(/\/\/.*$/gm, '');

    // Remove multi-line comments (/* ... */)
    cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, '');

    // Remove trailing commas before closing braces/brackets
    cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1');

    return cleaned.trim();
  }

  private parseUrl(url: string): {
    baseUrl: string;
    params: Record<string, string>;
  } {
    try {
      const urlObj = new URL(url);
      const params: Record<string, string> = {};

      urlObj.searchParams.forEach((value, key) => {
        params[key] = value;
      });

      return {
        baseUrl: urlObj.origin + urlObj.pathname,
        params,
      };
    } catch {
      // If URL parsing fails, try simple split
      const [baseUrl, queryString] = url.split('?');
      const params: Record<string, string> = {};

      if (queryString) {
        queryString.split('&').forEach((param) => {
          const [key, value] = param.split('=');
          if (key) {
            params[decodeURIComponent(key)] = decodeURIComponent(value || '');
          }
        });
      }

      return { baseUrl: baseUrl || url, params };
    }
  }

  private generateNameFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/').filter(Boolean);

      if (pathParts.length > 0) {
        return pathParts[pathParts.length - 1] || 'New Request';
      }

      return urlObj.hostname || 'New Request';
    } catch {
      return 'New Request';
    }
  }
}
