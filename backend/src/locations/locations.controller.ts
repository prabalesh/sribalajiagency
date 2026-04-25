import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { LocationsService } from './locations.service';
import { CreateLocationRestrictionDto } from './dto/create-location-restriction.dto';
import { UpdateLocationRestrictionDto } from './dto/update-location-restriction.dto';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

// add docs
@Controller('locations')
export class LocationsController {
  constructor(private locationsService: LocationsService) { }

  @Get()
  findAll() {
    return this.locationsService.findAll();
  }

  @Get('check')
  check(
    @Query('state') state: string,
    @Query('city') city?: string,
    @Query('zipcode') zipcode?: string,
  ) {
    return this.locationsService.isLocationAllowed(state, city, zipcode);
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @Permissions('VIEW_LOCATIONS')
  findOne(@Param('id') id: string) {
    return this.locationsService.findOne(id);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @Permissions('CREATE_LOCATION')
  create(@Body() data: CreateLocationRestrictionDto) {
    return this.locationsService.create(data);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @Permissions('UPDATE_LOCATION')
  update(@Param('id') id: string, @Body() data: UpdateLocationRestrictionDto) {
    return this.locationsService.update(id, data);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @Permissions('DELETE_LOCATION')
  delete(@Param('id') id: string) {
    return this.locationsService.delete(id);
  }
}
