import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
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
}
