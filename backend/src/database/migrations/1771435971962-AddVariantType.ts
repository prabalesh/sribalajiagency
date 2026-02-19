import { MigrationInterface, QueryRunner } from "typeorm";

export class AddVariantType1771435971962 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create variant_types table
        await queryRunner.query(`CREATE TABLE "variant_types" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "displayName" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_7e8b6b1e0f0c0d0e0f0c0d0e0f0" UNIQUE ("name"), CONSTRAINT "PK_7e8b6b1e0f0c0d0e0f0c0d0e0f1" PRIMARY KEY ("id"))`);

        // Add variantTypeId to product_variants
        await queryRunner.query(`ALTER TABLE "product_variants" ADD "variantTypeId" uuid`);

        // Add foreign key constraint
        await queryRunner.query(`ALTER TABLE "product_variants" ADD CONSTRAINT "FK_7e8b6b1e0f0c0d0e0f0c0d0e0f2" FOREIGN KEY ("variantTypeId") REFERENCES "variant_types"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "product_variants" DROP CONSTRAINT "FK_7e8b6b1e0f0c0d0e0f0c0d0e0f2"`);
        await queryRunner.query(`ALTER TABLE "product_variants" DROP COLUMN "variantTypeId"`);
        await queryRunner.query(`DROP TABLE "variant_types"`);
    }

}
