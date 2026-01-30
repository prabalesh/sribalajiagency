import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderStatusHistory } from './entities/order-status-history.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Order, OrderItem, OrderStatusHistory])],
    controllers: [OrdersController],
    providers: [OrdersService],
})
export class OrdersModule { }
