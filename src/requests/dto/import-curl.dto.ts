import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ImportCurlDto {
  @ApiProperty({
    description: 'cURL command to import',
    example:
      "curl -X POST 'https://api.example.com/users' -H 'Content-Type: application/json' -d '{\"name\":\"John\"}'",
  })
  @IsString()
  @IsNotEmpty()
  curlCommand: string;

  @ApiProperty({
    description: 'Optional collection ID to add the request to',
    required: false,
  })
  collectionId?: number;
}
