import { Controller, Post, Body, Get, Param, UseGuards, Req, Patch } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { OrdersService } from './orders.service';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@Controller('orders')
export class OrdersController {
    constructor(private ordersService: OrdersService) { }

    @Post()
    @UseGuards(AuthGuard('jwt'))
    create(@Req() req: any, @Body('items') items: any[]) {
        return this.ordersService.create(req.user.sub, items);
    }

    @Get('my')
    @UseGuards(AuthGuard('jwt'))
    findAllByUser(@Req() req: any) {
        return this.ordersService.findAllByUser(req.user.sub);
    }

    @Get()
    @UseGuards(AuthGuard('jwt'), PermissionsGuard)
    @Permissions('VIEW_REPORTS')
    findAll() {
        return this.ordersService.findAll();
    }

    @Get(':id')
    @UseGuards(AuthGuard('jwt'))
    findOne(@Param('id') id: string) {
        return this.ordersService.findOne(id);
    }

    @Patch(':id/status')
    @UseGuards(AuthGuard('jwt'), PermissionsGuard)
    @Permissions('MANAGE_PRODUCTS')
    updateStatus(@Param('id') id: string, @Body('status') status: string) {
        return this.ordersService.updateStatus(id, status);
    }
}
