import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, IsNull } from 'typeorm';
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
        if (data.city === '') data.city = null;
        if (data.zipcode === '') data.zipcode = null;
        const location = this.locationRepo.create(data);
        return this.locationRepo.save(location);
    }

    async update(id: string, data: any) {
        if (data.city === '') data.city = null;
        if (data.zipcode === '') data.zipcode = null;
        await this.locationRepo.update(id, data);
        return this.findOne(id);
    }

    delete(id: string) {
        return this.locationRepo.delete(id);
    }

    async isLocationAllowed(state: string, city?: string, zipcode?: string) {
        // Normalize empty strings to null for consistent handling
        const sCity = (!city || city.trim() === '') ? null : city.trim();
        const sZip = (!zipcode || zipcode.trim() === '') ? null : zipcode.trim();

        // 1. Check for specific zipcode
        if (sZip) {
            const allowedZip = await this.locationRepo.findOne({
                where: [
                    { state, city: sCity || IsNull(), zipcode: sZip, isAllowed: true },
                    { state, city: sCity || '', zipcode: sZip, isAllowed: true }
                ]
            });
            if (allowedZip) return true;
        }

        // 2. Check for city-level restriction
        if (sCity) {
            const allowedCity = await this.locationRepo.findOne({
                where: [
                    { state, city: sCity, zipcode: IsNull(), isAllowed: true },
                    { state, city: sCity, zipcode: '', isAllowed: true }
                ]
            });
            if (allowedCity) return true;
        }

        // 3. Check for state-level restriction
        const allowedState = await this.locationRepo.findOne({
            where: [
                { state, city: IsNull(), zipcode: IsNull(), isAllowed: true },
                { state, city: '', zipcode: '', isAllowed: true },
                { state, city: IsNull(), zipcode: '', isAllowed: true },
                { state, city: '', zipcode: IsNull(), isAllowed: true }
            ]
        });
        return !!allowedState;
    }
}
