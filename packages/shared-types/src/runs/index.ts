import { RunStatus } from '../common/enums';

/**
 * Entity интерфейс для результата выполнения запроса
 */
export interface IRun {
  id: number;
  requestId: number;
  status: RunStatus;
  statusCode?: number;
  responseBody?: any;
  responseHeaders?: Record<string, string>;
  error?: string;
  startedAt: Date;
  completedAt?: Date;
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
