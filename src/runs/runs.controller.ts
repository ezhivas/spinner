import { Controller, Post, Param, Query, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { RunsService } from './runs.service';

@ApiTags('Runs')
@Controller('runs')
export class RunsController {
  constructor(private readonly service: RunsService) {}

  @Post('requests/:id/run')
  @ApiOperation({ summary: 'Run request' })
  run(
    @Param('id') requestId: number,
    @Query('environmentId') environmentId?: number,
  ) {
    return this.service.runRequest(+requestId, environmentId);
  }

  @Get()
  @ApiOperation({ summary: 'Get runs history' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get run by id' })
  findOne(@Param('id') id: number) {
    return this.service.findOne(+id);
  }
}
