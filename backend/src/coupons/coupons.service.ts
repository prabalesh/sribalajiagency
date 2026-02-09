import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { Coupon } from './entities/coupon.entity';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';

@Injectable()
export class CouponsService {
    constructor(
        @InjectRepository(Coupon)
        private couponRepo: Repository<Coupon>,
    ) { }

    findAll() {
        return this.couponRepo.find();
    }

    async findOne(id: string) {
        const coupon = await this.couponRepo.findOneBy({ id });
        if (!coupon) throw new NotFoundException('Coupon not found');
        return coupon;
    }

    async findByCode(code: string) {
        const coupon = await this.couponRepo.findOneBy({ code, isActive: true });
        if (!coupon) throw new BadRequestException('Invalid or expired coupon');

        const now = new Date();
        if (coupon.startDate > now || coupon.endDate < now) {
            throw new BadRequestException('Coupon is not currently valid');
        }

        return coupon;
    }

    async create(data: CreateCouponDto) {
        const coupon = this.couponRepo.create(data);
        return this.couponRepo.save(coupon);
    }

    async update(id: string, data: UpdateCouponDto) {
        await this.couponRepo.update(id, data);
        return this.findOne(id);
    }

    delete(id: string) {
        return this.couponRepo.delete(id);
    }

    async validateCoupon(code: string, orderAmount: number) {
        const coupon = await this.findByCode(code);

        if (orderAmount < coupon.minOrderAmount) {
            throw new BadRequestException(`Minimum order amount for this coupon is ${coupon.minOrderAmount}`);
        }

        let discount = 0;
        if (coupon.discountType === 'percentage') {
            discount = (orderAmount * coupon.discountValue) / 100;
            if (coupon.maxDiscountAmount && discount > coupon.maxDiscountAmount) {
                discount = coupon.maxDiscountAmount;
            }
        } else {
            discount = coupon.discountValue;
        }

        return {
            coupon,
            discount,
            finalAmount: orderAmount - discount
        };
    }
}
