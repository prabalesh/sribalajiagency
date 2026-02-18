import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDatabaseIndexes1771435971961 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Products table indexes
        await queryRunner.query(`CREATE INDEX "IDX_PRODUCTS_NAME" ON "products" ("name")`);
        await queryRunner.query(`CREATE INDEX "IDX_PRODUCTS_AVAILABLE" ON "products" ("isAvailable")`);
        await queryRunner.query(`CREATE INDEX "IDX_PRODUCTS_FEATURED" ON "products" ("isFeatured")`);
        await queryRunner.query(`CREATE INDEX "IDX_PRODUCTS_CATEGORY" ON "products" ("categoryId")`);
        await queryRunner.query(`CREATE INDEX "IDX_PRODUCTS_BRAND" ON "products" ("brandId")`);
        await queryRunner.query(`CREATE INDEX "IDX_PRODUCTS_CREATED_AT" ON "products" ("createdAt")`);

        // Product Variants table indexes
        await queryRunner.query(`CREATE INDEX "IDX_VARIANTS_PRICE" ON "product_variants" ("price")`);
        await queryRunner.query(`CREATE INDEX "IDX_VARIANTS_SKU" ON "product_variants" ("sku")`);
        await queryRunner.query(`CREATE INDEX "IDX_VARIANTS_PRODUCT" ON "product_variants" ("productId")`);

        // Categories table indexes
        await queryRunner.query(`CREATE INDEX "IDX_CATEGORIES_PARENT" ON "categories" ("parentId")`);

        // Orders table indexes
        await queryRunner.query(`CREATE INDEX "IDX_ORDERS_STATUS" ON "orders" ("status")`);
        await queryRunner.query(`CREATE INDEX "IDX_ORDERS_CREATED_AT" ON "orders" ("createdAt")`);

        // Cart Items table indexes
        await queryRunner.query(`CREATE INDEX "IDX_CART_ITEMS_PRODUCT" ON "cart_items" ("productId")`);
        await queryRunner.query(`CREATE INDEX "IDX_CART_ITEMS_VARIANT" ON "cart_items" ("variantId")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop Products table indexes
        await queryRunner.query(`DROP INDEX "IDX_PRODUCTS_NAME"`);
        await queryRunner.query(`DROP INDEX "IDX_PRODUCTS_AVAILABLE"`);
        await queryRunner.query(`DROP INDEX "IDX_PRODUCTS_FEATURED"`);
        await queryRunner.query(`DROP INDEX "IDX_PRODUCTS_CATEGORY"`);
        await queryRunner.query(`DROP INDEX "IDX_PRODUCTS_BRAND"`);
        await queryRunner.query(`DROP INDEX "IDX_PRODUCTS_CREATED_AT"`);

        // Drop Product Variants table indexes
        await queryRunner.query(`DROP INDEX "IDX_VARIANTS_PRICE"`);
        await queryRunner.query(`DROP INDEX "IDX_VARIANTS_SKU"`);
        await queryRunner.query(`DROP INDEX "IDX_VARIANTS_PRODUCT"`);

        // Drop Categories table indexes
        await queryRunner.query(`DROP INDEX "IDX_CATEGORIES_PARENT"`);

        // Drop Orders table indexes
        await queryRunner.query(`DROP INDEX "IDX_ORDERS_STATUS"`);
        await queryRunner.query(`DROP INDEX "IDX_ORDERS_CREATED_AT"`);

        // Drop Cart Items table indexes
        await queryRunner.query(`DROP INDEX "IDX_CART_ITEMS_PRODUCT"`);
        await queryRunner.query(`DROP INDEX "IDX_CART_ITEMS_VARIANT"`);
    }

}
