DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'discount_type') THEN
        CREATE TYPE "public"."discount_type" AS ENUM('percentage', 'flat');
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
        CREATE TYPE "public"."order_status" AS ENUM('Pending', 'Confirmed', 'Packaging', 'Dispatched', 'Delivered', 'Cancelled');
    END IF;
END $$;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "brands" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255),
	"image" varchar(255),
	"description" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "brands_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cart_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cartId" uuid,
	"productId" uuid NOT NULL,
	"variantId" uuid,
	"quantity" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "carts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "carts_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"image" varchar(255),
	"gstRate" numeric(5, 2) DEFAULT '18.00' NOT NULL,
	"parentId" uuid,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "coupons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"code" varchar(255) NOT NULL,
	"discountType" "discount_type" DEFAULT 'percentage' NOT NULL,
	"discountValue" numeric(12, 2) NOT NULL,
	"startDate" timestamp NOT NULL,
	"endDate" timestamp NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"minOrderAmount" integer DEFAULT 0 NOT NULL,
	"maxDiscountAmount" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "coupons_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "home_cms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"heroType" varchar(255) DEFAULT 'classic' NOT NULL,
	"heroBadge" varchar(255) DEFAULT 'BESTSELLER 2026' NOT NULL,
	"heroTitle" varchar(255) DEFAULT 'Experience the future of Home Tech.' NOT NULL,
	"heroSubtitle" text DEFAULT 'Premium selection of global brands including Sony, Samsung, and Bosch. Engineered for excellence, delivered with care.' NOT NULL,
	"heroImage" varchar(255),
	"heroLink" varchar(255) DEFAULT '/products' NOT NULL,
	"heroLinkText" varchar(255) DEFAULT 'Explore All' NOT NULL,
	"heroContentAlignment" varchar(255) DEFAULT 'center' NOT NULL,
	"heroSlides" jsonb,
	"showCategories" boolean DEFAULT true NOT NULL,
	"showFeatured" boolean DEFAULT true NOT NULL,
	"showBrands" boolean DEFAULT true NOT NULL,
	"showTrustMarkers" boolean DEFAULT true NOT NULL,
	"aboutTitle" varchar(255) DEFAULT 'Engineering Your Comfort' NOT NULL,
	"aboutContent" text,
	"aboutImage" varchar(255),
	"socialLinks" jsonb,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "location_restrictions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"state" varchar(255) NOT NULL,
	"city" varchar(255),
	"zipcode" varchar(20),
	"isAllowed" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"orderId" uuid,
	"productId" uuid,
	"variantId" uuid,
	"productName" varchar(255) NOT NULL,
	"variantName" varchar(255),
	"quantity" integer NOT NULL,
	"price" numeric(12, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "order_status_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"orderId" uuid,
	"status" varchar(255) NOT NULL,
	"message" text,
	"changedById" uuid,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid,
	"totalAmount" numeric(12, 2) NOT NULL,
	"taxAmount" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"taxDetails" jsonb,
	"status" "order_status" DEFAULT 'Pending' NOT NULL,
	"paymentMethod" varchar(255),
	"deliveryAddress" text,
	"deliveryPhone" varchar(20),
	"deliveryNotes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" varchar(255),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "permissions_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "product_variants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"price" numeric(12, 2) NOT NULL,
	"comparisonPrice" numeric(12, 2),
	"sku" varchar(255),
	"specifications" jsonb,
	"stock" integer DEFAULT 0 NOT NULL,
	"image" varchar(255),
	"images" text[] DEFAULT '{}' NOT NULL,
	"description" text,
	"productId" uuid NOT NULL,
	"variantTypeId" uuid,
	"isDefault" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"deletedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"isAvailable" boolean DEFAULT true NOT NULL,
	"maxOrderQuantity" integer,
	"isShowcaseOnly" boolean DEFAULT false NOT NULL,
	"allowedPaymentMethods" jsonb,
	"gstRate" numeric(5, 2) DEFAULT '18.00',
	"rating" numeric(3, 1) DEFAULT '0.0',
	"reviewCount" integer DEFAULT 0 NOT NULL,
	"isFeatured" boolean DEFAULT false NOT NULL,
	"warranty" varchar(255),
	"specifications" jsonb,
	"categoryId" uuid,
	"brandId" uuid,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"deletedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rating" integer NOT NULL,
	"comment" text,
	"userId" uuid NOT NULL,
	"productId" uuid NOT NULL,
	"reply" text,
	"repliedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "role_permissions" (
	"role_id" uuid NOT NULL,
	"permission_id" uuid NOT NULL,
	CONSTRAINT "role_permissions_role_id_permission_id_pk" PRIMARY KEY("role_id","permission_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" varchar(255),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "roles_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "site_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"enabledPaymentMethods" jsonb DEFAULT '["online","cod"]'::jsonb NOT NULL,
	"allowCod" boolean DEFAULT true NOT NULL,
	"allowOnline" boolean DEFAULT true NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_addresses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid,
	"name" varchar(255) NOT NULL,
	"type" varchar(255) NOT NULL,
	"street" varchar(255) NOT NULL,
	"city" varchar(255) NOT NULL,
	"state" varchar(255) NOT NULL,
	"zip" varchar(255) NOT NULL,
	"phonePrimary" varchar(20),
	"phoneSecondary" varchar(20),
	"lat" numeric(10, 8),
	"lng" numeric(11, 8),
	"isDefault" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_roles" (
	"user_id" uuid NOT NULL,
	"role_id" uuid NOT NULL,
	CONSTRAINT "user_roles_user_id_role_id_pk" PRIMARY KEY("user_id","role_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password" varchar(255) NOT NULL,
	"refreshToken" varchar(255),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "variant_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"displayName" varchar(255),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"deletedAt" timestamp,
	CONSTRAINT "variant_types_name_unique" UNIQUE("name")
);
--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cart_items_cartId_carts_id_fk') THEN
        ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_cartId_carts_id_fk" FOREIGN KEY ("cartId") REFERENCES "public"."carts"("id") ON DELETE CASCADE ON UPDATE no action;
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cart_items_productId_products_id_fk') THEN
        ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_productId_products_id_fk" FOREIGN KEY ("productId") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cart_items_variantId_product_variants_id_fk') THEN
        ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_variantId_product_variants_id_fk" FOREIGN KEY ("variantId") REFERENCES "public"."product_variants"("id") ON DELETE no action ON UPDATE no action;
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'carts_userId_users_id_fk') THEN
        ALTER TABLE "carts" ADD CONSTRAINT "carts_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'order_items_orderId_orders_id_fk') THEN
        ALTER TABLE "order_items" ADD CONSTRAINT "order_items_orderId_orders_id_fk" FOREIGN KEY ("orderId") REFERENCES "public"."orders"("id") ON DELETE CASCADE ON UPDATE no action;
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'order_items_productId_products_id_fk') THEN
        ALTER TABLE "order_items" ADD CONSTRAINT "order_items_productId_products_id_fk" FOREIGN KEY ("productId") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'order_items_variantId_product_variants_id_fk') THEN
        ALTER TABLE "order_items" ADD CONSTRAINT "order_items_variantId_product_variants_id_fk" FOREIGN KEY ("variantId") REFERENCES "public"."product_variants"("id") ON DELETE no action ON UPDATE no action;
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'order_status_history_orderId_orders_id_fk') THEN
        ALTER TABLE "order_status_history" ADD CONSTRAINT "order_status_history_orderId_orders_id_fk" FOREIGN KEY ("orderId") REFERENCES "public"."orders"("id") ON DELETE CASCADE ON UPDATE no action;
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'order_status_history_changedById_users_id_fk') THEN
        ALTER TABLE "order_status_history" ADD CONSTRAINT "order_status_history_changedById_users_id_fk" FOREIGN KEY ("changedById") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orders_userId_users_id_fk') THEN
        ALTER TABLE "orders" ADD CONSTRAINT "orders_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'product_variants_productId_products_id_fk') THEN
        ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_productId_products_id_fk" FOREIGN KEY ("productId") REFERENCES "public"."products"("id") ON DELETE CASCADE ON UPDATE no action;
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'product_variants_variantTypeId_variant_types_id_fk') THEN
        ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_variantTypeId_variant_types_id_fk" FOREIGN KEY ("variantTypeId") REFERENCES "public"."variant_types"("id") ON DELETE no action ON UPDATE no action;
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_categoryId_categories_id_fk') THEN
        ALTER TABLE "products" ADD CONSTRAINT "products_categoryId_categories_id_fk" FOREIGN KEY ("categoryId") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_brandId_brands_id_fk') THEN
        ALTER TABLE "products" ADD CONSTRAINT "products_brandId_brands_id_fk" FOREIGN KEY ("brandId") REFERENCES "public"."brands"("id") ON DELETE no action ON UPDATE no action;
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reviews_userId_users_id_fk') THEN
        ALTER TABLE "reviews" ADD CONSTRAINT "reviews_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE no action;
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reviews_productId_products_id_fk') THEN
        ALTER TABLE "reviews" ADD CONSTRAINT "reviews_productId_products_id_fk" FOREIGN KEY ("productId") REFERENCES "public"."products"("id") ON DELETE CASCADE ON UPDATE no action;
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'role_permissions_role_id_roles_id_fk') THEN
        ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE CASCADE ON UPDATE no action;
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'role_permissions_permission_id_permissions_id_fk') THEN
        ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE CASCADE ON UPDATE no action;
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_addresses_userId_users_id_fk') THEN
        ALTER TABLE "user_addresses" ADD CONSTRAINT "user_addresses_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE no action;
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_roles_user_id_users_id_fk') THEN
        ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE no action;
    END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_roles_role_id_roles_id_fk') THEN
        ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE CASCADE ON UPDATE no action;
    END IF;
END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cart_item_product_idx" ON "cart_items" USING btree ("productId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cart_item_variant_idx" ON "cart_items" USING btree ("variantId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "location_state_idx" ON "location_restrictions" USING btree ("state");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "location_city_idx" ON "location_restrictions" USING btree ("city");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "location_zip_idx" ON "location_restrictions" USING btree ("zipcode");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "location_unique_idx" ON "location_restrictions" USING btree ("state","city","zipcode");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "orders_status_idx" ON "orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "orders_created_idx" ON "orders" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "variants_price_idx" ON "product_variants" USING btree ("price");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "variants_sku_idx" ON "product_variants" USING btree ("sku");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "products_name_idx" ON "products" USING btree ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "products_available_idx" ON "products" USING btree ("isAvailable");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "products_featured_idx" ON "products" USING btree ("isFeatured");