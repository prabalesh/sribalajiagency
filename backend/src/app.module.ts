import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from './auth/entities/user.entity';
import { Role, Permission } from './auth/entities/role.entity';
import { AuthModule } from './auth/auth.module';
import { UserAddress } from './auth/entities/user-address.entity';
import { ProductsModule } from './products/products.module';
import { Product } from './products/entities/product.entity';
import { Category } from './products/entities/category.entity';
import { Brand } from './products/entities/brand.entity';
import { ProductImage } from './products/entities/product-image.entity';
import { ProductVariant } from './products/entities/product-variant.entity';
import { SiteSettings } from './products/entities/settings.entity';
import { OrdersModule } from './orders/orders.module';
import { CouponsModule } from './coupons/coupons.module';
import { Coupon } from './coupons/entities/coupon.entity';
import { LocationsModule } from './locations/locations.module';
import { LocationRestriction } from './locations/entities/location-restriction.entity';
import { QuotationsModule } from './quotations/quotations.module';
import { Order } from './orders/entities/order.entity';
import { OrderItem } from './orders/entities/order-item.entity';
import { OrderStatusHistory } from './orders/entities/order-status-history.entity';
import { Quotation } from './quotations/entities/quotation.entity';
import { HomeCMS } from './products/entities/home-cms.entity';
import { CommonModule } from './common/common.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CacheModule.register({
      isGlobal: true,
      ttl: 5 * 60 * 1000, // 5 minutes
      max: 100, // maximum number of items in cache
    }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),
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
        entities: [User, Role, Permission, Product, Category, Brand, ProductImage, ProductVariant, SiteSettings, Order, OrderItem, OrderStatusHistory, Quotation, Coupon, LocationRestriction, HomeCMS, UserAddress],

        synchronize: config.get('NODE_ENV') !== 'production',
      }),
    }),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule { }



