import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { ProductsModule } from './products/products.module';
import { CategoriesModule } from './categories/categories.module';
import { BrandsModule } from './brands/brands.module';
import { VariantTypesModule } from './products/variant-types/variant-types.module';
import { SettingsModule } from './settings/settings.module';
import { OrdersModule } from './orders/orders.module';
import { CouponsModule } from './coupons/coupons.module';
import { LocationsModule } from './locations/locations.module';
import { CMSModule } from './cms/cms.module';
import { CommonModule } from './common/common.module';
import { ReviewsModule } from './reviews/reviews.module';
import { VigileEyeModule } from '@prabalesh/vigileye-nestjs';
import { CartsModule } from './carts/carts.module';
import { DrizzleModule } from './database/drizzle/drizzle.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CacheModule.register({
      isGlobal: true,
      ttl: 5 * 60 * 1000, // 5 minutes
      max: 100, // maximum number of items in cache
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    DrizzleModule,
    CommonModule,
    AuthModule,
    ProductsModule,
    VariantTypesModule,
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
      enabled:
        process.env.VIGILEYE_ENABLED === 'true' ||
        process.env.NODE_ENV === 'production',
      ignoreStatusCodes: [404, 401],
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
export class AppModule {}
