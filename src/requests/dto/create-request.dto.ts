import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsNotEmpty, IsString, IsNumber } from 'class-validator';
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
  @IsNumber()
  collectionId?: number;
}
