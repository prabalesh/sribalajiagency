import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';
import { User } from './auth/entities/user.entity';
import { Role, Permission } from './auth/entities/role.entity';
import { UserAddress } from './auth/entities/user-address.entity';
import { Product } from './products/entities/product.entity';
import { Category } from './categories/entities/category.entity';
import { Brand } from './brands/entities/brand.entity';
import { ProductVariant } from './products/entities/product-variant.entity';
import { VariantType } from './products/entities/variant-type.entity';
import { SiteSettings } from './settings/entities/settings.entity';
import { Coupon } from './coupons/entities/coupon.entity';
import { LocationRestriction } from './locations/entities/location-restriction.entity';
import { Order } from './orders/entities/order.entity';
import { OrderItem } from './orders/entities/order-item.entity';
import { OrderStatusHistory } from './orders/entities/order-status-history.entity';
import { HomeCMS } from './cms/entities/home-cms.entity';
import { Review } from './reviews/entities/review.entity';
import { Cart } from './carts/entities/cart.entity';
import { CartItem } from './carts/entities/cart-item.entity';

config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASS || 'postgres',
  database: process.env.DB_NAME || 'sribalaji',
  entities: [
    User,
    Role,
    Permission,
    Product,
    Category,
    Brand,
    ProductVariant,
    VariantType,
    SiteSettings,
    Order,
    OrderItem,
    OrderStatusHistory,
    Coupon,
    LocationRestriction,
    HomeCMS,
    UserAddress,
    Review,
    Cart,
    CartItem,
  ],
  migrations: ['src/database/migrations/*.ts'],
  synchronize: false,
});
