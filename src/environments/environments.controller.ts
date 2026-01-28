import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Put,
  Delete,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { EnvironmentsService } from './environments.service';
import { CreateEnvironmentDto } from './dto/create-environment.dto';

@ApiTags('Environments')
@Controller('environments')
export class EnvironmentsController {
  constructor(private readonly service: EnvironmentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create environment' })
  create(@Body() dto: CreateEnvironmentDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all environments' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get environment by id' })
  findOne(@Param('id') id: number) {
    return this.service.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update environment' })
  update(@Param('id') id: number, @Body() dto: Partial<CreateEnvironmentDto>) {
    return this.service.update(+id, dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update environment (PUT)' })
  updatePut(
    @Param('id') id: number,
    @Body() dto: Partial<CreateEnvironmentDto>,
  ) {
    return this.service.update(+id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete environment' })
  remove(@Param('id') id: number) {
    return this.service.remove(+id);
  }

  @Patch(':id/variables')
  @ApiOperation({ summary: 'Add or update variables in environment' })
  updateVariables(
    @Param('id') id: number,
    @Body() variables: Record<string, string>,
  ) {
    return this.service.updateVariables(+id, variables);
  }

  @Delete(':id/variables/:key')
  @ApiOperation({ summary: 'Delete a variable from environment' })
  deleteVariable(@Param('id') id: number, @Param('key') key: string) {
    return this.service.deleteVariable(+id, key);
  }

  @Post('import')
  @ApiOperation({ summary: 'Import environment from Postman format' })
  import(@Body() postmanEnv: any) {
    return this.service.importFromPostman(postmanEnv);
  }

  @Get(':id/export')
  @ApiOperation({ summary: 'Export environment to Postman format' })
  export(@Param('id') id: number) {
    return this.service.exportToPostman(+id);
  }
}
