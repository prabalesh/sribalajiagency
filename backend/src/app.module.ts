import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
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
import { CategoriesModule } from './categories/categories.module';
import { Category } from './categories/entities/category.entity';
import { BrandsModule } from './brands/brands.module';
import { Brand } from './brands/entities/brand.entity';
import { ProductImage } from './products/entities/product-image.entity';
import { ProductVariant } from './products/entities/product-variant.entity';
import { SettingsModule } from './settings/settings.module';
import { SiteSettings } from './settings/entities/settings.entity';
import { OrdersModule } from './orders/orders.module';
import { CouponsModule } from './coupons/coupons.module';
import { Coupon } from './coupons/entities/coupon.entity';
import { LocationsModule } from './locations/locations.module';
import { LocationRestriction } from './locations/entities/location-restriction.entity';
import { Order } from './orders/entities/order.entity';
import { OrderItem } from './orders/entities/order-item.entity';
import { OrderStatusHistory } from './orders/entities/order-status-history.entity';
import { CMSModule } from './cms/cms.module';
import { HomeCMS } from './cms/entities/home-cms.entity';
import { CommonModule } from './common/common.module';
import { ReviewsModule } from './reviews/reviews.module';
import { Review } from './reviews/entities/review.entity';
import { VigileEyeModule } from '@prabalesh/vigileye-nestjs';
import { SeedAdminRoleAndPermissions1738890000000 } from './database/migrations/1738890000000-SeedAdminRoleAndPermissions';
import { CartsModule } from './carts/carts.module';
import { Cart } from './carts/entities/cart.entity';
import { CartItem } from './carts/entities/cart-item.entity';

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
    CategoriesModule,
    BrandsModule,
    CMSModule,
    SettingsModule,
    OrdersModule,
    CouponsModule,
    LocationsModule,
    ReviewsModule,
    CartsModule,
    VigileEyeModule.forRoot({
      apiKey: process.env.VIGILEYE_API_KEY || '',
      serverUrl: process.env.VIGILEYE_SERVER_URL || '',
      enabled: process.env.VIGILEYE_ENABLED === 'true' || process.env.NODE_ENV === 'production',
      ignoreStatusCodes: [404, 401],
    }),
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
        entities: [User, Role, Permission, Product, Category, Brand, ProductImage, ProductVariant, SiteSettings, Order, OrderItem, OrderStatusHistory, Coupon, LocationRestriction, HomeCMS, UserAddress, Review, Cart, CartItem],

        synchronize: config.get('NODE_ENV') !== 'production',
        migrationsRun: true,
        migrations: [SeedAdminRoleAndPermissions1738890000000],
      }),
    }),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    AppService,
  ],
  controllers: [AppController],
})
export class AppModule { }



