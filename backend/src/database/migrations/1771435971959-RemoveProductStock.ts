import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveProductStock1771435971959 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "stock"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "products" ADD "stock" integer NOT NULL DEFAULT 0`);
    }

}
