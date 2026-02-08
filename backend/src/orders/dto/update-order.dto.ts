import { IsOptional, IsEnum, IsString } from 'class-validator';
import { OrderStatus } from '../entities/order.entity';

export class UpdateOrderDto {
    @IsOptional()
    @IsEnum(['Pending', 'Confirmed', 'Packaging', 'Dispatched', 'Delivered', 'Cancelled'] as OrderStatus[])
    status?: OrderStatus;

    @IsOptional()
    @IsString()
    message?: string;
}
