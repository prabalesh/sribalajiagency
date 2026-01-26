import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LocationRestriction } from './entities/location-restriction.entity';

@Injectable()
export class LocationsService {
    constructor(
        @InjectRepository(LocationRestriction)
        private locationRepo: Repository<LocationRestriction>,
    ) { }

    findAll() {
        return this.locationRepo.find();
    }

    async findOne(id: string) {
        const location = await this.locationRepo.findOneBy({ id });
        if (!location) throw new NotFoundException('Location restriction not found');
        return location;
    }

    create(data: any) {
        const location = this.locationRepo.create(data);
        return this.locationRepo.save(location);
    }

    async update(id: string, data: any) {
        await this.locationRepo.update(id, data);
        return this.findOne(id);
    }

    delete(id: string) {
        return this.locationRepo.delete(id);
    }

    async isLocationAllowed(state: string, city?: string) {
        const query: any = { state, isAllowed: true };
        if (city) {
            query.city = city;
        }
        const allowed = await this.locationRepo.findOneBy(query);
        return !!allowed;
    }
}
