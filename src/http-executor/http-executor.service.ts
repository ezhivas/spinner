import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';

interface ExecutionResult {
  status: 'SUCCESS' | 'ERROR';
  responseStatus: number | undefined;
  responseHeaders: Record<string, unknown> | undefined;
  responseBody: unknown;
  error?: string;
  durationMs: number;
}

@Injectable()
export class HttpExecutorService {
  constructor(private readonly configService: ConfigService) {}

  async execute(config: AxiosRequestConfig): Promise<ExecutionResult> {
    const start = Date.now();

    // Set default timeout if not provided
    if (!config.timeout) {
      config.timeout =
        this.configService.get<number>('REQUEST_TIMEOUT') || 60000;
    }

    try {
      const response: AxiosResponse = await axios(config);

      return {
        status: 'SUCCESS',
        responseStatus: response.status,
        responseHeaders: response.headers as Record<string, unknown>,
        responseBody: response.data as unknown,
        durationMs: Date.now() - start,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return {
          status: 'ERROR',
          responseStatus: error.response?.status,
          responseHeaders: error.response?.headers as
            | Record<string, unknown>
            | undefined,
          responseBody: error.response?.data as unknown,
          error: error.message,
          durationMs: Date.now() - start,
        };
      }

      // Handle non-Axios errors
      return {
        status: 'ERROR',
        responseStatus: undefined,
        responseHeaders: undefined,
        responseBody: undefined,
        error: error instanceof Error ? error.message : 'Unknown error',
        durationMs: Date.now() - start,
      };
    }
  }
}
