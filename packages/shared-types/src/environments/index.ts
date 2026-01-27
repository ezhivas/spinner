import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

/**
 * DTO для создания окружения
 */
export class CreateEnvironmentDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  variables?: Record<string, string>;
}

/**
 * DTO для обновления окружения
 */
export class UpdateEnvironmentDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  variables?: Record<string, string>;
}

/**
 * Entity интерфейс для окружения
 */
export interface IEnvironment {
  id: number;
  name: string;
  variables: Record<string, string>;
  createdAt: Date;
}
