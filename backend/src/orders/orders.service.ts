import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Order, OrderStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderStatusHistory } from './entities/order-status-history.entity';
import { User } from '../auth/entities/user.entity';

export interface CreateOrderDto {
    items: {
        productId: string;
        productName: string;
        price: number;
        quantity: number;
    }[];
    paymentMethod: string;
    deliveryAddress: string;
    deliveryPhone: string;
    deliveryNotes?: string;
}

@Injectable()
export class OrdersService {
    constructor(
        @InjectRepository(Order)
        private orderRepo: Repository<Order>,
        @InjectRepository(OrderItem)
        private orderItemRepo: Repository<OrderItem>,
        @InjectRepository(OrderStatusHistory)
        private statusHistoryRepo: Repository<OrderStatusHistory>,
    ) { }

    async create(userId: string, createOrderDto: CreateOrderDto) {
        let totalAmount = 0;
        const orderItems = createOrderDto.items.map(item => {
            totalAmount += item.price * item.quantity;
            return this.orderItemRepo.create({
                product: { id: item.productId },
                productName: item.productName,
                price: item.price,
                quantity: item.quantity,
            });
        });

        const order = this.orderRepo.create({
            user: { id: userId },
            items: orderItems,
            totalAmount,
            status: 'Pending',
            paymentMethod: createOrderDto.paymentMethod,
            deliveryAddress: createOrderDto.deliveryAddress,
            deliveryPhone: createOrderDto.deliveryPhone,
            deliveryNotes: createOrderDto.deliveryNotes,
        });

        const savedOrder = await this.orderRepo.save(order);

        // Create initial status history entry
        const statusHistory = this.statusHistoryRepo.create({
            order: savedOrder,
            status: 'Pending',
            message: 'Order placed successfully',
            changedBy: { id: userId },
        });
        await this.statusHistoryRepo.save(statusHistory);

        return this.findOne(savedOrder.id);
    }

    async findAllByUser(userId: string, page: number = 1, limit: number = 20, status?: OrderStatus) {
        if (limit > 50) limit = 50;
        const skip = (page - 1) * limit;

        const where: any = { user: { id: userId } };
        if (status) {
            where.status = status;
        }

        const [items, total] = await this.orderRepo.findAndCount({
            where,
            relations: ['items', 'items.product', 'statusHistory', 'statusHistory.changedBy'],
            order: { createdAt: 'DESC' },
            take: limit,
            skip: skip
        });

        return { items, total, page, limit };
    }

    async findAll(page: number = 1, limit: number = 20) {
        if (limit > 50) limit = 50;
        const skip = (page - 1) * limit;

        const [items, total] = await this.orderRepo.findAndCount({
            relations: ['user', 'items', 'items.product', 'statusHistory', 'statusHistory.changedBy'],
            order: { createdAt: 'DESC' },
            take: limit,
            skip: skip
        });

        return { items, total, page, limit };
    }

    async getOrdersByQueue(queueType: 'orders' | 'delivery', page: number = 1, limit: number = 20) {
        if (limit > 50) limit = 50;
        const skip = (page - 1) * limit;
        let statuses: OrderStatus[];

        if (queueType === 'orders') {
            statuses = ['Pending', 'Confirmed', 'Packaging'];
        } else {
            statuses = ['Dispatched'];
        }

        const [items, total] = await this.orderRepo.findAndCount({
            where: { status: In(statuses) },
            relations: ['user', 'items', 'items.product', 'statusHistory', 'statusHistory.changedBy'],
            order: { createdAt: 'DESC' },
            take: limit,
            skip: skip
        });

        return { items, total, page, limit };
    }

    findOne(id: string) {
        return this.orderRepo.findOne({
            where: { id },
            relations: ['user', 'items', 'items.product', 'statusHistory', 'statusHistory.changedBy'],
        });
    }

    async updateStatus(id: string, status: OrderStatus, message?: string, userId?: string) {
        await this.orderRepo.update(id, { status });

        // Create status history entry
        const statusHistory = this.statusHistoryRepo.create({
            order: { id },
            status,
            message: message || `Status updated to ${status}`,
        });

        if (userId) {
            statusHistory.changedBy = { id: userId } as User;
        }

        await this.statusHistoryRepo.save(statusHistory);

        return this.findOne(id);
    }

    async getOrderHistory(orderId: string) {
        return this.statusHistoryRepo.find({
            where: { order: { id: orderId } },
            relations: ['changedBy'],
            order: { createdAt: 'ASC' },
        });
    }
}
