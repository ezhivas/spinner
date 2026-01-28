import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsNotEmpty,
  IsString,
  IsNumber,
  IsObject,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { HttpMethod } from '../request.entity';

export class CreateRequestDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: HttpMethod })
  @IsEnum(HttpMethod)
  method: HttpMethod;

  @ApiProperty()
  @IsString()
  url: string;

  @ApiProperty({ required: false })
  @IsOptional()
  headers?: Record<string, string>;

  @ApiProperty({ required: false })
  @IsOptional()
  queryParams?: Record<string, string>;

  @ApiProperty({ required: false })
  @IsOptional()
  body?: any;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (value === '' ? undefined : value))
  bodyType?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (value === '' ? undefined : value))
  preRequestScript?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (value === '' ? undefined : value))
  postRequestScript?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  auth?: {
    type: 'noauth' | 'bearer' | 'basic' | 'apikey' | 'oauth2';
    bearer?: { token: string };
    basic?: { username: string; password: string };
    apikey?: { key: string; value: string; addTo: 'header' | 'query' };
    oauth2?: { accessToken: string };
  };

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  collectionId?: number;
}
