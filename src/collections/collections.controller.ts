import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  NotFoundException,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { CollectionsService } from './collections.service';
import { CreateCollectionDto } from './dto/create-collection.dto';

@ApiTags('Collections')
@Controller('collections')
export class CollectionsController {
  constructor(private readonly service: CollectionsService) {}

  @Post()
  @ApiOperation({ summary: 'Create collection' })
  create(@Body() dto: CreateCollectionDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all collections' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get collection by id' })
  async findOne(@Param('id') id: number) {
    const collection = await this.service.findOne(+id);
    if (!collection) {
      throw new NotFoundException('Collection not found');
    }
    return collection;
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update collection' })
  update(@Param('id') id: number, @Body() dto: Partial<CreateCollectionDto>) {
    return this.service.update(+id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete collection' })
  remove(@Param('id') id: number) {
    return this.service.remove(+id);
  }

  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Import collection from Postman (JSON body or file upload)',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Postman collection JSON file',
        },
      },
    },
  })
  importFromPostman(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
  ) {
    let postmanCollection: any;
    if (file) {
      postmanCollection = JSON.parse(file.buffer.toString());
    } else {
      postmanCollection = body;
    }
    return this.service.importFromPostman(postmanCollection);
  }

  @Get(':id/export')
  @ApiOperation({ summary: 'Export collection to Postman format' })
  async exportToPostman(@Param('id') id: number) {
    const collection = await this.service.findOne(+id);
    if (!collection) {
      throw new NotFoundException('Collection not found');
    }
    return this.service.exportToPostman(collection);
  }
}
