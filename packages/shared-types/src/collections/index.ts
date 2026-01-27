import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

/**
 * DTO для создания коллекции
 */
export class CreateCollectionDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;
}

/**
 * DTO для обновления коллекции
 */
export class UpdateCollectionDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

/**
 * Entity интерфейс для коллекции
 */
export interface ICollection {
  id: number;
  name: string;
  description?: string;
  createdAt: Date;
  requests?: any[]; // будет типизировано позже
}
