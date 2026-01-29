import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CouponsService } from './coupons.service';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@Controller('coupons')
export class CouponsController {
    constructor(private couponsService: CouponsService) { }

    @Get()
    @UseGuards(AuthGuard('jwt'), PermissionsGuard)
    @Permissions('VIEW_COUPONS')
    findAll() {
        return this.couponsService.findAll();
    }

    @Get('validate')
    validate(@Query('code') code: string, @Query('amount') amount: string) {
        return this.couponsService.validateCoupon(code, parseFloat(amount));
    }

    @Get(':id')
    @UseGuards(AuthGuard('jwt'), PermissionsGuard)
    @Permissions('VIEW_COUPONS')
    findOne(@Param('id') id: string) {
        return this.couponsService.findOne(id);
    }

    @Post()
    @UseGuards(AuthGuard('jwt'), PermissionsGuard)
    @Permissions('CREATE_COUPON')
    create(@Body() data: any) {
        return this.couponsService.create(data);
    }

    @Put(':id')
    @UseGuards(AuthGuard('jwt'), PermissionsGuard)
    @Permissions('UPDATE_COUPON')
    update(@Param('id') id: string, @Body() data: any) {
        return this.couponsService.update(id, data);
    }

    @Delete(':id')
    @UseGuards(AuthGuard('jwt'), PermissionsGuard)
    @Permissions('DELETE_COUPON')
    delete(@Param('id') id: string) {
        return this.couponsService.delete(id);
    }
}
