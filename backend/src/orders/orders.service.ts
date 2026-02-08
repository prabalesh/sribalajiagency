import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Order, OrderStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderStatusHistory } from './entities/order-status-history.entity';
import { User } from '../auth/entities/user.entity';
import { Product } from '../products/entities/product.entity';
import { Category } from '../products/entities/category.entity';
import { ProductVariant } from '../products/entities/product-variant.entity';

import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

@Injectable()
export class OrdersService {
    constructor(
        @InjectRepository(Order)
        private orderRepo: Repository<Order>,
        @InjectRepository(OrderItem)
        private orderItemRepo: Repository<OrderItem>,
        @InjectRepository(OrderStatusHistory)
        private statusHistoryRepo: Repository<OrderStatusHistory>,
        @InjectRepository(Product)
        private productRepo: Repository<Product>,
        @InjectRepository(Category)
        private categoryRepo: Repository<Category>,
        @InjectRepository(ProductVariant)
        private variantRepo: Repository<ProductVariant>,
    ) { }

    async create(userId: string, createOrderDto: CreateOrderDto) {
        const taxResults = await this.calculateTax(
            createOrderDto.items.map(i => ({
                productId: i.productId,
                variantId: i.variantId,
                quantity: i.quantity
            })),
            createOrderDto.deliveryState
        );

        const orderItems = createOrderDto.items.map(item => {
            return this.orderItemRepo.create({
                product: { id: item.productId },
                variant: item.variantId ? { id: item.variantId } : undefined,
                productName: item.productName,
                variantName: item.variantName,
                price: item.price,
                quantity: item.quantity,
            });
        });

        const order = this.orderRepo.create({
            user: { id: userId },
            items: orderItems,
            totalAmount: taxResults.grandTotal,
            taxAmount: taxResults.totalTax,
            taxDetails: taxResults.breakdown,
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
            relations: ['items', 'items.product', 'items.variant', 'statusHistory', 'statusHistory.changedBy'],
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
            relations: ['user', 'items', 'items.product', 'items.variant', 'statusHistory', 'statusHistory.changedBy'],
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
            relations: ['user', 'items', 'items.product', 'items.variant', 'statusHistory', 'statusHistory.changedBy'],
            order: { createdAt: 'DESC' },
            take: limit,
            skip: skip
        });

        return { items, total, page, limit };
    }

    findOne(id: string) {
        return this.orderRepo.findOne({
            where: { id },
            relations: ['user', 'items', 'items.product', 'items.variant', 'statusHistory', 'statusHistory.changedBy'],
        });
    }

    async updateStatus(id: string, updateOrderDto: UpdateOrderDto, userId?: string) {
        let currentStatus: OrderStatus | undefined;

        if (updateOrderDto.status) {
            await this.orderRepo.update(id, { status: updateOrderDto.status });
            currentStatus = updateOrderDto.status;
        } else {
            const order = await this.orderRepo.findOne({ where: { id }, select: ['status'] });
            currentStatus = order?.status;
        }

        // Create status history entry
        const statusHistory = this.statusHistoryRepo.create({
            order: { id },
            status: currentStatus || 'Pending',
            message: updateOrderDto.message || (updateOrderDto.status ? `Status updated to ${updateOrderDto.status}` : 'Order updated'),
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

    async calculateTax(items: { productId: string, variantId?: string, quantity: number }[], state: string) {
        let subtotal: number = 0;
        let totalTax: number = 0;
        const STORE_STATE = 'Tamil Nadu';
        const isIntraState = state.toLowerCase().trim() === STORE_STATE.toLowerCase().trim();

        const productIds = items.map(i => i.productId);
        const variantIds = items.map(i => i.variantId).filter(Boolean);

        const [products, variants] = await Promise.all([
            this.productRepo.find({
                where: { id: In(productIds) },
                relations: ['category']
            }),
            variantIds.length > 0 ? this.variantRepo.find({ where: { id: In(variantIds) } }) : Promise.resolve([])
        ]);

        const taxBreakdown = items.map(item => {
            const product = products.find(p => p.id === item.productId);
            if (!product) return null;

            const variant = item.variantId ? variants.find(v => v.id === item.variantId) : null;
            const price = variant ? +variant.price : +product.price;

            const rate = +(product.gstRate !== null && product.gstRate !== undefined && product.gstRate >= 0 && product.gstRate <= 100 && !isNaN(product.gstRate)
                ? product.gstRate
                : (product.category?.gstRate ?? 18));

            const itemSubtotal = price * item.quantity;
            const itemTax = (itemSubtotal * rate) / 100;

            subtotal += itemSubtotal;
            totalTax += itemTax;

            return {
                productId: product.id,
                variantId: item.variantId,
                productName: product.name,
                rate,
                subtotal: itemSubtotal,
                tax: itemTax
            };
        }).filter(Boolean);

        const result = {
            subtotal,
            totalTax: Math.round(totalTax),
            grandTotal: Math.round(subtotal + totalTax),
            isInterState: !isIntraState,
            breakdown: {
                cgst: isIntraState ? Math.round(totalTax / 2) : 0,
                sgst: isIntraState ? Math.round(totalTax / 2) : 0,
                igst: !isIntraState ? Math.round(totalTax) : 0,
            }
        };

        return result;
    }
}
