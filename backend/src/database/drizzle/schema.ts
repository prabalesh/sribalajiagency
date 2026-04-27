import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  decimal,
  jsonb,
  primaryKey,
  index,
  uniqueIndex,
  pgEnum,
  serial,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const discountTypeEnum = pgEnum('discount_type', ['percentage', 'flat']);
export const orderStatusEnum = pgEnum('order_status', [
  'Pending',
  'Confirmed',
  'Packaging',
  'Dispatched',
  'Delivered',
  'Cancelled',
]);

// Permissions Table
export const permissions = pgTable('permissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull().unique(),
  description: varchar('description', { length: 255 }),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
});

// Roles Table
export const roles = pgTable('roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull().unique(),
  description: varchar('description', { length: 255 }),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
});

// Role Permissions (Many-to-Many)
export const rolePermissions = pgTable(
  'role_permissions',
  {
    roleId: uuid('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
    permissionId: uuid('permission_id')
      .notNull()
      .references(() => permissions.id, { onDelete: 'cascade' }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.roleId, t.permissionId] }),
  }),
);

// Users Table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  image: varchar('image', { length: 255 }),
  refreshToken: varchar('refreshToken', { length: 255 }),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
});

// User Roles (Many-to-Many)
export const userRoles = pgTable(
  'user_roles',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    roleId: uuid('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.roleId] }),
  }),
);

// User Addresses
export const userAddresses = pgTable('user_addresses', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('userId').references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 255 }).notNull(),
  street: varchar('street', { length: 255 }).notNull(),
  city: varchar('city', { length: 255 }).notNull(),
  state: varchar('state', { length: 255 }).notNull(),
  zip: varchar('zip', { length: 255 }).notNull(),
  phonePrimary: varchar('phonePrimary', { length: 20 }),
  phoneSecondary: varchar('phoneSecondary', { length: 20 }),
  lat: decimal('lat', { precision: 10, scale: 8 }),
  lng: decimal('lng', { precision: 11, scale: 8 }),
  isDefault: boolean('isDefault').default(false).notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
});

// Categories
export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  image: varchar('image', { length: 255 }),
  gstRate: decimal('gstRate', { precision: 5, scale: 2 })
    .default('18.00')
    .notNull(),
  parentId: uuid('parentId'), // Self-reference defined in relations
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
});

// Brands
export const brands = pgTable('brands', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).unique(),
  image: varchar('image', { length: 255 }),
  description: text('description'),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
});

// Products
export const products = pgTable(
  'products',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description').notNull(),
    isAvailable: boolean('isAvailable').default(true).notNull(),
    maxOrderQuantity: integer('maxOrderQuantity'),
    isShowcaseOnly: boolean('isShowcaseOnly').default(false).notNull(),
    allowedPaymentMethods: jsonb('allowedPaymentMethods'),
    gstRate: decimal('gstRate', { precision: 5, scale: 2 }).default('18.00'),
    rating: decimal('rating', { precision: 3, scale: 1 }).default('0.0'),
    reviewCount: integer('reviewCount').default(0).notNull(),
    isFeatured: boolean('isFeatured').default(false).notNull(),
    warranty: varchar('warranty', { length: 255 }),
    specifications: jsonb('specifications'),
    categoryId: uuid('categoryId').references(() => categories.id),
    brandId: uuid('brandId').references(() => brands.id),
    createdAt: timestamp('createdAt').defaultNow().notNull(),
    updatedAt: timestamp('updatedAt').defaultNow().notNull(),
    deletedAt: timestamp('deletedAt'),
  },
  (t) => ({
    nameIdx: index('products_name_idx').on(t.name),
    availableIdx: index('products_available_idx').on(t.isAvailable),
    featuredIdx: index('products_featured_idx').on(t.isFeatured),
  }),
);

// Variant Types
export const variantTypes = pgTable('variant_types', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull().unique(),
  displayName: varchar('displayName', { length: 255 }),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
  deletedAt: timestamp('deletedAt'),
});

// Product Variants
export const productVariants = pgTable(
  'product_variants',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    price: decimal('price', { precision: 12, scale: 2 }).notNull(),
    comparisonPrice: decimal('comparisonPrice', { precision: 12, scale: 2 }),
    sku: varchar('sku', { length: 255 }),
    specifications: jsonb('specifications'),
    stock: integer('stock').default(0).notNull(),
    description: text('description'),
    productId: uuid('productId')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    variantTypeId: uuid('variantTypeId').references(() => variantTypes.id),
    isDefault: boolean('isDefault').default(false).notNull(),
    createdAt: timestamp('createdAt').defaultNow().notNull(),
    updatedAt: timestamp('updatedAt').defaultNow().notNull(),
    deletedAt: timestamp('deletedAt'),
  },
  (t) => ({
    priceIdx: index('variants_price_idx').on(t.price),
    skuIdx: index('variants_sku_idx').on(t.sku),
  }),
);

// Product Images
export const productImages = pgTable('product_images', {
  id: uuid('id').primaryKey().defaultRandom(),
  url: text('url').notNull(),
  altText: varchar('altText', { length: 255 }),
  isPrimary: boolean('isPrimary').default(false).notNull(),
  sortOrder: integer('sortOrder').default(0).notNull(),
  productId: uuid('productId').references(() => products.id, {
    onDelete: 'cascade',
  }),
  variantId: uuid('variantId').references(() => productVariants.id, {
    onDelete: 'cascade',
  }),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
});

// Coupons
export const coupons = pgTable('coupons', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  code: varchar('code', { length: 255 }).notNull().unique(),
  discountType: discountTypeEnum('discountType')
    .default('percentage')
    .notNull(),
  discountValue: decimal('discountValue', {
    precision: 12,
    scale: 2,
  }).notNull(),
  startDate: timestamp('startDate').notNull(),
  endDate: timestamp('endDate').notNull(),
  isActive: boolean('isActive').default(true).notNull(),
  minOrderAmount: integer('minOrderAmount').default(0).notNull(),
  maxDiscountAmount: integer('maxDiscountAmount'),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
});

// Location Restrictions
export const locationRestrictions = pgTable(
  'location_restrictions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    state: varchar('state', { length: 255 }).notNull(),
    city: varchar('city', { length: 255 }),
    zipcode: varchar('zipcode', { length: 20 }),
    isAllowed: boolean('isAllowed').default(true).notNull(),
    createdAt: timestamp('createdAt').defaultNow().notNull(),
    updatedAt: timestamp('updatedAt').defaultNow().notNull(),
  },
  (t) => ({
    stateIdx: index('location_state_idx').on(t.state),
    cityIdx: index('location_city_idx').on(t.city),
    zipIdx: index('location_zip_idx').on(t.zipcode),
    uniqueLoc: uniqueIndex('location_unique_idx').on(
      t.state,
      t.city,
      t.zipcode,
    ),
  }),
);

// Orders
export const orders = pgTable(
  'orders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('userId').references(() => users.id),
    totalAmount: decimal('totalAmount', { precision: 12, scale: 2 }).notNull(),
    taxAmount: decimal('taxAmount', { precision: 12, scale: 2 })
      .default('0.00')
      .notNull(),
    taxDetails: jsonb('taxDetails'),
    status: orderStatusEnum('status').default('Pending').notNull(),
    paymentMethod: varchar('paymentMethod', { length: 255 }),
    deliveryAddress: text('deliveryAddress'),
    deliveryPhone: varchar('deliveryPhone', { length: 20 }),
    deliveryNotes: text('deliveryNotes'),
    createdAt: timestamp('createdAt').defaultNow().notNull(),
    updatedAt: timestamp('updatedAt').defaultNow().notNull(),
  },
  (t) => ({
    statusIdx: index('orders_status_idx').on(t.status),
    createdIdx: index('orders_created_idx').on(t.createdAt),
  }),
);

// Order Items
export const orderItems = pgTable('order_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('orderId').references(() => orders.id, { onDelete: 'cascade' }),
  productId: uuid('productId').references(() => products.id),
  variantId: uuid('variantId').references(() => productVariants.id),
  productName: varchar('productName', { length: 255 }).notNull(),
  variantName: varchar('variantName', { length: 255 }),
  quantity: integer('quantity').notNull(),
  price: decimal('price', { precision: 12, scale: 2 }).notNull(),
});

// Order Status History
export const orderStatusHistory = pgTable('order_status_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('orderId').references(() => orders.id, { onDelete: 'cascade' }),
  status: varchar('status', { length: 255 }).notNull(),
  message: text('message'),
  changedById: uuid('changedById').references(() => users.id),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
});

// Reviews
export const reviews = pgTable('reviews', {
  id: uuid('id').primaryKey().defaultRandom(),
  rating: integer('rating').notNull(),
  comment: text('comment'),
  userId: uuid('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  productId: uuid('productId')
    .notNull()
    .references(() => products.id, { onDelete: 'cascade' }),
  reply: text('reply'),
  repliedAt: timestamp('repliedAt'),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
});

// Site Settings
export const siteSettings = pgTable('site_settings', {
  id: serial('id').primaryKey(),
  enabledPaymentMethods: jsonb('enabledPaymentMethods')
    .default(['online', 'cod'])
    .notNull(),
  allowCod: boolean('allowCod').default(true).notNull(),
  allowOnline: boolean('allowOnline').default(true).notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
});

// Carts
export const carts = pgTable('carts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('userId')
    .notNull()
    .unique()
    .references(() => users.id),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
});

// Cart Items
export const cartItems = pgTable(
  'cart_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    cartId: uuid('cartId').references(() => carts.id, { onDelete: 'cascade' }),
    productId: uuid('productId')
      .notNull()
      .references(() => products.id),
    variantId: uuid('variantId').references(() => productVariants.id),
    quantity: integer('quantity').notNull(),
  },
  (t) => ({
    productIdx: index('cart_item_product_idx').on(t.productId),
    variantIdx: index('cart_item_variant_idx').on(t.variantId),
  }),
);

// Home CMS
export const homeCms = pgTable('home_cms', {
  id: uuid('id').primaryKey().defaultRandom(),
  heroType: varchar('heroType', { length: 255 }).default('classic').notNull(),
  heroBadge: varchar('heroBadge', { length: 255 })
    .default('BESTSELLER 2026')
    .notNull(),
  heroTitle: varchar('heroTitle', { length: 255 })
    .default('Experience the future of Home Tech.')
    .notNull(),
  heroSubtitle: text('heroSubtitle')
    .default(
      'Premium selection of global brands including Sony, Samsung, and Bosch. Engineered for excellence, delivered with care.',
    )
    .notNull(),
  heroImage: varchar('heroImage', { length: 255 }),
  heroLink: varchar('heroLink', { length: 255 }).default('/products').notNull(),
  heroLinkText: varchar('heroLinkText', { length: 255 })
    .default('Explore All')
    .notNull(),
  heroContentAlignment: varchar('heroContentAlignment', { length: 255 })
    .default('center')
    .notNull(),
  heroSlides: jsonb('heroSlides'),
  showCategories: boolean('showCategories').default(true).notNull(),
  showFeatured: boolean('showFeatured').default(true).notNull(),
  showBrands: boolean('showBrands').default(true).notNull(),
  showTrustMarkers: boolean('showTrustMarkers').default(true).notNull(),
  aboutTitle: varchar('aboutTitle', { length: 255 })
    .default('Engineering Your Comfort')
    .notNull(),
  aboutContent: text('aboutContent'),
  aboutImage: varchar('aboutImage', { length: 255 }),
  socialLinks: jsonb('socialLinks'),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
});

// RELATIONS
export const permissionsRelations = relations(permissions, ({ many }) => ({
  roles: many(rolePermissions),
}));

export const rolesRelations = relations(roles, ({ many }) => ({
  permissions: many(rolePermissions),
  users: many(userRoles),
}));

export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, {
    fields: [productImages.productId],
    references: [products.id],
  }),
  variant: one(productVariants, {
    fields: [productImages.variantId],
    references: [productVariants.id],
  }),
}));

export const rolePermissionsRelations = relations(
  rolePermissions,
  ({ one }) => ({
    role: one(roles, {
      fields: [rolePermissions.roleId],
      references: [roles.id],
    }),
    permission: one(permissions, {
      fields: [rolePermissions.permissionId],
      references: [permissions.id],
    }),
  }),
);

export const usersRelations = relations(users, ({ many }) => ({
  roles: many(userRoles),
  addresses: many(userAddresses),
  orders: many(orders),
  carts: many(carts),
  reviews: many(reviews),
}));

export const productVariantsRelations = relations(
  productVariants,
  ({ one, many }) => ({
    product: one(products, {
      fields: [productVariants.productId],
      references: [products.id],
    }),
    variantType: one(variantTypes, {
      fields: [productVariants.variantTypeId],
      references: [variantTypes.id],
    }),
    images: many(productImages),
  }),
);

export const userRolesRelations = relations(userRoles, ({ one }) => ({
  user: one(users, { fields: [userRoles.userId], references: [users.id] }),
  role: one(roles, { fields: [userRoles.roleId], references: [roles.id] }),
}));

export const userAddressesRelations = relations(userAddresses, ({ one }) => ({
  user: one(users, { fields: [userAddresses.userId], references: [users.id] }),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
    relationName: 'category_parent',
  }),
  children: many(categories, { relationName: 'category_parent' }),
  products: many(products),
}));

export const brandsRelations = relations(brands, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  brand: one(brands, { fields: [products.brandId], references: [brands.id] }),
  variants: many(productVariants),
  images: many(productImages),
  reviews: many(reviews),
}));

export const variantTypesRelations = relations(variantTypes, ({ many }) => ({
  variants: many(productVariants),
}));

// Deleted productVariantsRelations from here as it's moved up for better organization

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, { fields: [orders.userId], references: [users.id] }),
  items: many(orderItems),
  statusHistory: many(orderStatusHistory),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
  variant: one(productVariants, {
    fields: [orderItems.variantId],
    references: [productVariants.id],
  }),
}));

export const orderStatusHistoryRelations = relations(
  orderStatusHistory,
  ({ one }) => ({
    order: one(orders, {
      fields: [orderStatusHistory.orderId],
      references: [orders.id],
    }),
    changedBy: one(users, {
      fields: [orderStatusHistory.changedById],
      references: [users.id],
    }),
  }),
);

export const reviewsRelations = relations(reviews, ({ one }) => ({
  user: one(users, { fields: [reviews.userId], references: [users.id] }),
  product: one(products, {
    fields: [reviews.productId],
    references: [products.id],
  }),
}));

export const cartsRelations = relations(carts, ({ one, many }) => ({
  user: one(users, { fields: [carts.userId], references: [users.id] }),
  items: many(cartItems),
}));

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  cart: one(carts, { fields: [cartItems.cartId], references: [carts.id] }),
  product: one(products, {
    fields: [cartItems.productId],
    references: [products.id],
  }),
  variant: one(productVariants, {
    fields: [cartItems.variantId],
    references: [productVariants.id],
  }),
}));
