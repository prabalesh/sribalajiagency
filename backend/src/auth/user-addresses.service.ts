import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserAddress } from './entities/user-address.entity';
import { User } from './entities/user.entity';

@Injectable()
export class UserAddressesService {
    constructor(
        @InjectRepository(UserAddress)
        private addressRepository: Repository<UserAddress>,
    ) { }

    async findAll(user: User): Promise<UserAddress[]> {
        return this.addressRepository.find({
            where: { user: { id: user.id } },
            order: { createdAt: 'DESC' },
        });
    }

    async create(user: User, data: Partial<UserAddress>): Promise<UserAddress> {
        if (data.isDefault) {
            await this.addressRepository.update({ user: { id: user.id } }, { isDefault: false });
        }

        const address = this.addressRepository.create({
            ...data,
            user,
        });

        return this.addressRepository.save(address);
    }

    async update(user: User, id: string, data: Partial<UserAddress>): Promise<UserAddress> {
        const address = await this.addressRepository.findOne({
            where: { id, user: { id: user.id } },
        });

        if (!address) {
            throw new NotFoundException('Address not found');
        }

        if (data.isDefault) {
            await this.addressRepository.update({ user: { id: user.id } }, { isDefault: false });
        }

        Object.assign(address, data);
        return this.addressRepository.save(address);
    }

    async remove(user: User, id: string): Promise<void> {
        const result = await this.addressRepository.delete({ id, user: { id: user.id } });
        if (result.affected === 0) {
            throw new NotFoundException('Address not found');
        }
    }

    async setDefault(user: User, id: string): Promise<UserAddress> {
        await this.addressRepository.update({ user: { id: user.id } }, { isDefault: false });
        const address = await this.addressRepository.findOne({
            where: { id, user: { id: user.id } },
        });
        if (!address) {
            throw new NotFoundException('Address not found');
        }
        address.isDefault = true;
        return this.addressRepository.save(address);
    }
}
