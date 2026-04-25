import { IsOptional, IsEnum, IsString } from 'class-validator';
import { OrderStatus } from '../orders.service';

export class UpdateOrderDto {
  @IsOptional()
  @IsEnum([
    'Pending',
    'Confirmed',
    'Packaging',
    'Dispatched',
    'Delivered',
    'Cancelled',
  ])
  status?: OrderStatus;

  @IsOptional()
  @IsString()
  message?: string;
}
