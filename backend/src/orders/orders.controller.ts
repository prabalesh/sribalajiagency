import { Controller, Post, Body, Get, Param, UseGuards, Req, Patch, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import type { OrderStatus } from './entities/order.entity';

@Controller('orders')
export class OrdersController {
    constructor(private ordersService: OrdersService) { }

    @Post('calculate-tax')
    calculateTax(@Body() data: { items: { productId: string, quantity: number }[], state: string }) {
        return this.ordersService.calculateTax(data.items, data.state);
    }

    @Post()
    @UseGuards(AuthGuard('jwt'))
    create(@Req() req: any, @Body() createOrderDto: CreateOrderDto) {
        return this.ordersService.create(req.user.id, createOrderDto);
    }

    @Get('my')
    @UseGuards(AuthGuard('jwt'))
    findAllByUser(
        @Req() req: any,
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '20',
        @Query('status') status?: OrderStatus
    ) {
        return this.ordersService.findAllByUser(req.user.id, +page, +limit, status);
    }

    @Get('queue/:queueType')
    @UseGuards(AuthGuard('jwt'), PermissionsGuard)
    @Permissions('VIEW_ORDERS')
    getOrdersByQueue(
        @Param('queueType') queueType: 'orders' | 'delivery',
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '20'
    ) {
        return this.ordersService.getOrdersByQueue(queueType, +page, +limit);
    }

    @Get(':id')
    @UseGuards(AuthGuard('jwt'))
    findOne(@Param('id') id: string) {
        return this.ordersService.findOne(id);
    }

    @Get(':id/history')
    @UseGuards(AuthGuard('jwt'))
    getOrderHistory(@Param('id') id: string) {
        return this.ordersService.getOrderHistory(id);
    }

    @Get()
    @UseGuards(AuthGuard('jwt'), PermissionsGuard)
    @Permissions('VIEW_ORDERS')
    findAll(
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '20'
    ) {
        return this.ordersService.findAll(+page, +limit);
    }

    @Patch(':id/status')
    @UseGuards(AuthGuard('jwt'), PermissionsGuard)
    @Permissions('UPDATE_ORDER')
    updateStatus(
        @Param('id') id: string,
        @Body() updateOrderDto: UpdateOrderDto,
        @Req() req: any
    ) {
        return this.ordersService.updateStatus(id, updateOrderDto, req.user.id);
    }
}
