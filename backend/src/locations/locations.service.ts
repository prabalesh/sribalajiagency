import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
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

    async validateConsistency(data: any) {
        if (!data.zipcode) return; // Zipcode is optional

        const zip = data.zipcode;
        if (!/^[1-9][0-9]{5}$/.test(zip)) {
            throw new BadRequestException('Invalid 6-digit Indian Zipcode');
        }

        try {
            const response = await fetch(`https://api.postalpincode.in/pincode/${zip}`);
            const results = await response.json();

            if (!results || !results[0] || results[0].Status !== 'Success') {
                throw new BadRequestException('Invalid or non-existent Zipcode');
            }

            const postOffice = results[0].PostOffice[0];
            const apiState = postOffice.State.toLowerCase();
            const inputState = data.state.toLowerCase();

            // Strict State Check
            if (apiState !== inputState) {
                throw new BadRequestException(`Zipcode ${zip} belongs to ${postOffice.State}, not ${data.state}`);
            }

            // Loose City Check (since districts and cities can have multiple names)
            if (data.city) {
                const apiDistrict = postOffice.District.toLowerCase();
                const inputCity = data.city.toLowerCase();
                if (!apiDistrict.includes(inputCity) && !inputCity.includes(apiDistrict)) {
                    // Just a warning in logs if mismatching city, but maybe not block unless it's way off
                    console.warn(`City mismatch: Input ${data.city} vs Zipcode District ${postOffice.District}`);
                }
            }

        } catch (error) {
            if (error instanceof BadRequestException) throw error;
            console.error('Consistency validation failed:', error);
            // Allow if API is down, but log it
        }
    }

    async create(data: any) {
        await this.validateConsistency(data);
        if (data.city === '') data.city = null;
        if (data.zipcode === '') data.zipcode = null;
        const location = this.locationRepo.create(data);
        return this.locationRepo.save(location);
    }

    async update(id: string, data: any) {
        await this.validateConsistency(data);
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
