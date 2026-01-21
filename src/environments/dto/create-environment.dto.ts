import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsObject, IsString } from 'class-validator';

export class CreateEnvironmentDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: {
      BASE_URL: 'https://api.example.com',
      TOKEN: 'abc123',
    },
  })
  @IsObject()
  variables: Record<string, string>;
}
