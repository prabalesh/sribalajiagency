import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveProductPrice1771435971960 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "price"`);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "comparisonPrice"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "products" ADD "price" decimal(10,2) NOT NULL DEFAULT 0`);
        await queryRunner.query(`ALTER TABLE "products" ADD "comparisonPrice" decimal(10,2)`);
    }

}
