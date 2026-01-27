import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { HttpMethod, BodyType } from '../common/enums';

/**
 * DTO для создания нового запроса
 */
export class CreateRequestDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(HttpMethod)
  method: HttpMethod;

  @IsString()
  url: string;

  @IsOptional()
  headers?: Record<string, string>;

  @IsOptional()
  queryParams?: Record<string, string>;

  @IsOptional()
  body?: any;

  @IsOptional()
  @IsString()
  bodyType?: BodyType;

  @IsOptional()
  @IsString()
  postRequestScript?: string;

  @IsOptional()
  @IsNumber()
  collectionId?: number;
}

/**
 * DTO для обновления запроса
 */
export class UpdateRequestDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(HttpMethod)
  method?: HttpMethod;

  @IsOptional()
  @IsString()
  url?: string;

  @IsOptional()
  headers?: Record<string, string>;

  @IsOptional()
  queryParams?: Record<string, string>;

  @IsOptional()
  body?: any;

  @IsOptional()
  @IsString()
  bodyType?: BodyType;

  @IsOptional()
  @IsString()
  postRequestScript?: string;

  @IsOptional()
  @IsNumber()
  collectionId?: number;
}

/**
 * Entity интерфейс для запроса (без TypeORM декораторов)
 */
export interface IRequest {
  id: number;
  name: string;
  method: HttpMethod;
  url: string;
  headers?: Record<string, string>;
  queryParams?: Record<string, string>;
  body?: any;
  bodyType?: BodyType;
  collectionId?: number;
  postRequestScript?: string;
  createdAt: Date;
}
