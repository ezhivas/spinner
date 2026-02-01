import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { RequestsService } from './requests.service';
import { CreateRequestDto } from './dto/create-request.dto';
import { UpdateRequestDto } from './dto/update-request.dto';
import { ImportCurlDto } from './dto/import-curl.dto';
import { CurlConverterService } from './curl-converter-httpsnippet.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EnvironmentEntity } from '../environments/environment.entity';

@ApiTags('Requests')
@Controller('requests')
export class RequestsController {
  constructor(
    private readonly service: RequestsService,
    private readonly curlConverter: CurlConverterService,
    @InjectRepository(EnvironmentEntity)
    private readonly environmentRepo: Repository<EnvironmentEntity>,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create request' })
  create(@Body() dto: CreateRequestDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all requests' })
  findAll(@Query('collectionId') collectionId?: string) {
    return this.service.findAll(collectionId ? +collectionId : undefined);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get request by id' })
  findOne(@Param('id') id: number) {
    return this.service.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update request' })
  update(@Param('id') id: number, @Body() dto: UpdateRequestDto) {
    return this.service.update(+id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete request' })
  remove(@Param('id') id: number) {
    return this.service.remove(+id);
  }

  @Get(':id/curl')
  @ApiOperation({ summary: 'Export request as cURL command' })
  async exportAsCurl(
    @Param('id') id: number,
    @Query('environmentId') environmentId: string,
    @Res() res: Response,
  ) {
    const request = await this.service.findOne(+id);

    console.log(
      '[exportAsCurl] Request loaded from DB, body type:',
      typeof request.body,
    );
    console.log(
      '[exportAsCurl] Request body length:',
      typeof request.body === 'string'
        ? request.body.length
        : JSON.stringify(request.body)?.length,
    );
    console.log('[exportAsCurl] Request body:', request.body);

    // Clone request to avoid modifying original
    const requestToExport = { ...request };

    // If environmentId is provided, resolve variables
    if (environmentId) {
      const environment = await this.environmentRepo.findOne({
        where: { id: +environmentId },
      });

      if (environment && environment.variables) {
        // Resolve variables in URL
        requestToExport.url = this.resolveVariables(
          request.url,
          environment.variables,
        );

        // Resolve variables in headers
        if (request.headers) {
          requestToExport.headers = {};
          for (const [key, value] of Object.entries(request.headers)) {
            requestToExport.headers[key] = this.resolveVariables(
              value,
              environment.variables,
            );
          }
        }

        // Resolve variables in body (if string or JSON)
        if (request.body) {
          const bodyString =
            typeof request.body === 'string'
              ? request.body
              : JSON.stringify(request.body);
          const resolvedBody = this.resolveVariables(
            bodyString,
            environment.variables,
          );
          try {
            requestToExport.body = JSON.parse(resolvedBody);
          } catch {
            requestToExport.body = resolvedBody;
          }
        }
      }
    }

    const curlCommand = this.curlConverter.requestToCurl(requestToExport);

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${request.name.replace(/[^a-zA-Z0-9]/g, '_')}.sh"`,
    );
    res.send(curlCommand);
  }

  private resolveVariables(
    text: string,
    variables: Record<string, string>,
  ): string {
    if (!text) return text;

    let resolved = text;
    const regex = /\{\{([^}]+)\}\}/g;

    resolved = resolved.replace(regex, (match, varName) => {
      const trimmedVarName = varName.trim();
      return variables[trimmedVarName] ?? match;
    });

    return resolved;
  }

  @Post('import/curl')
  @ApiOperation({ summary: 'Import request from cURL command' })
  async importFromCurl(@Body() dto: ImportCurlDto) {
    const requestData = this.curlConverter.curlToRequest(dto.curlCommand);

    return this.service.create({
      ...requestData,
      collectionId: dto.collectionId,
    });
  }
}
