import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';

@Injectable()
export class OrdersService {
    constructor(
        @InjectRepository(Order)
        private orderRepo: Repository<Order>,
        @InjectRepository(OrderItem)
        private orderItemRepo: Repository<OrderItem>,
    ) { }

    async create(userId: string, items: any[]) {
        let totalAmount = 0;
        const orderItems = items.map(item => {
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
            status: 'Processing',
        });

        return this.orderRepo.save(order);
    }

    findAllByUser(userId: string) {
        return this.orderRepo.find({
            where: { user: { id: userId } },
            relations: ['items'],
            order: { createdAt: 'DESC' },
        });
    }

    findAll() {
        return this.orderRepo.find({ relations: ['user', 'items'] });
    }

    findOne(id: string) {
        return this.orderRepo.findOne({
            where: { id },
            relations: ['user', 'items'],
        });
    }

    async updateStatus(id: string, status: any) {
        await this.orderRepo.update(id, { status });
        return this.findOne(id);
    }
}
