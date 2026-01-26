import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from './auth/entities/user.entity';
import { Role, Permission } from './auth/entities/role.entity';
import { AuthModule } from './auth/auth.module';
import { ProductsModule } from './products/products.module';
import { Product } from './products/entities/product.entity';
import { Category } from './products/entities/category.entity';
import { Brand } from './products/entities/brand.entity';
import { ProductImage } from './products/entities/product-image.entity';
import { ProductVariant } from './products/entities/product-variant.entity';
import { OrdersModule } from './orders/orders.module';
import { CouponsModule } from './coupons/coupons.module';
import { Coupon } from './coupons/entities/coupon.entity';
import { LocationsModule } from './locations/locations.module';
import { LocationRestriction } from './locations/entities/location-restriction.entity';
import { QuotationsModule } from './quotations/quotations.module';
import { Order } from './orders/entities/order.entity';
import { OrderItem } from './orders/entities/order-item.entity';
import { Quotation } from './quotations/entities/quotation.entity';
import { HomeCMS } from './products/entities/home-cms.entity';
import { CommonModule } from './common/common.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CommonModule,
    AuthModule,
    ProductsModule,
    OrdersModule,
    CouponsModule,
    LocationsModule,
    QuotationsModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get<string>('DB_USER', 'postgres'),
        password: config.get<string>('DB_PASS', 'postgres'),
        database: config.get<string>('DB_NAME', 'sribalaji'),
        entities: [User, Role, Permission, Product, Category, Brand, ProductImage, ProductVariant, Order, OrderItem, Quotation, Coupon, LocationRestriction, HomeCMS],
        synchronize: true, // Only for development!
      }),
    }),
  ],
})
export class AppModule { }



