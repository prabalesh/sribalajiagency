import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { LocationsService } from './locations.service';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@Controller('locations')
export class LocationsController {
    constructor(private locationsService: LocationsService) { }

    @Get()
    findAll() {
        return this.locationsService.findAll();
    }

    @Get('check')
    check(@Query('state') state: string, @Query('city') city?: string) {
        return this.locationsService.isLocationAllowed(state, city);
    }

    @Get(':id')
    @UseGuards(AuthGuard('jwt'), PermissionsGuard)
    @Permissions('MANAGE_PRODUCTS')
    findOne(@Param('id') id: string) {
        return this.locationsService.findOne(id);
    }

    @Post()
    @UseGuards(AuthGuard('jwt'), PermissionsGuard)
    @Permissions('MANAGE_PRODUCTS')
    create(@Body() data: any) {
        return this.locationsService.create(data);
    }

    @Put(':id')
    @UseGuards(AuthGuard('jwt'), PermissionsGuard)
    @Permissions('MANAGE_PRODUCTS')
    update(@Param('id') id: string, @Body() data: any) {
        return this.locationsService.update(id, data);
    }

    @Delete(':id')
    @UseGuards(AuthGuard('jwt'), PermissionsGuard)
    @Permissions('MANAGE_PRODUCTS')
    delete(@Param('id') id: string) {
        return this.locationsService.delete(id);
    }
}
