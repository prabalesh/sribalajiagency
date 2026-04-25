import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
} from '@nestjs/common';
import { VariantTypesService } from './variant-types.service';
import { CreateVariantTypeDto } from './dto/create-variant-type.dto';
import { UpdateVariantTypeDto } from './dto/update-variant-type.dto';

@Controller('variant-types')
export class VariantTypesController {
  constructor(private readonly variantTypesService: VariantTypesService) {}

  @Post()
  create(@Body() createVariantTypeDto: CreateVariantTypeDto) {
    return this.variantTypesService.create(createVariantTypeDto);
  }

  @Get()
  findAll() {
    return this.variantTypesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.variantTypesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateVariantTypeDto: UpdateVariantTypeDto,
  ) {
    return this.variantTypesService.update(id, updateVariantTypeDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.variantTypesService.remove(id);
  }
}
