import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Quotation } from './entities/quotation.entity';

@Injectable()
export class QuotationsService {
    constructor(
        @InjectRepository(Quotation)
        private quotationRepo: Repository<Quotation>,
    ) { }

    create(dto: any, userId?: string) {
        const quotation = this.quotationRepo.create({
            ...dto,
            user: userId ? { id: userId } : null,
            status: 'Open',
        });
        return this.quotationRepo.save(quotation);
    }

    findAll() {
        return this.quotationRepo.find({ order: { createdAt: 'DESC' } });
    }

    findOne(id: string) {
        return this.quotationRepo.findOneBy({ id });
    }

    async updateStatus(id: string, status: any) {
        await this.quotationRepo.update(id, { status });
        return this.findOne(id);
    }
}
