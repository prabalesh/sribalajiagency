import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderStatusHistory } from './entities/order-status-history.entity';
import { Product } from '../products/entities/product.entity';
import { Category } from '../categories/entities/category.entity';
import { ProductVariant } from '../products/entities/product-variant.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Order, OrderItem, OrderStatusHistory, Product, Category, ProductVariant])],
    controllers: [OrdersController],
    providers: [OrdersService],
})
export class OrdersModule { }
