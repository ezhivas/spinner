import { RunStatus } from '../common/enums';

/**
 * Entity интерфейс для результата выполнения запроса
 */
export interface IRun {
  id: number;
  requestId?: number;
  status: RunStatus;
  responseStatus?: number;
  responseBody?: unknown;
  responseHeaders?: Record<string, string>;
  error?: string;
  createdAt: Date;
  durationMs?: number;
  scriptOutput?: string;
}

/**
 * DTO для создания нового выполнения
 */
export interface CreateRunDto {
  requestId: number;
  environmentId?: number;
}
