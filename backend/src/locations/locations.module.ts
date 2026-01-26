import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LocationRestriction } from './entities/location-restriction.entity';
import { LocationsService } from './locations.service';
import { LocationsController } from './locations.controller';

@Module({
    imports: [TypeOrmModule.forFeature([LocationRestriction])],
    providers: [LocationsService],
    controllers: [LocationsController],
    exports: [LocationsService],
})
export class LocationsModule { }
