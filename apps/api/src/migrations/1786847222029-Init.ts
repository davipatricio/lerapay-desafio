import { MigrationInterface, QueryRunner } from 'typeorm';

export class Init1786847222029 implements MigrationInterface {
  name = 'Init1786847222029';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`gateway_accounts\` (\`id\` varchar(36) NOT NULL, \`user_id\` varchar(255) NOT NULL, \`merchant_token\` text NULL, \`code_client\` varchar(255) NULL, \`chave_loja\` varchar(255) NULL, \`gateway_document\` varchar(255) NULL, \`token_expires_at\` datetime NULL, \`is_linked\` tinyint NOT NULL DEFAULT 0, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_a2c3e2b592f5d648852e92644c\` (\`user_id\`), UNIQUE INDEX \`REL_a2c3e2b592f5d648852e92644c\` (\`user_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`users\` (\`id\` varchar(36) NOT NULL, \`email\` varchar(255) NOT NULL, \`password_hash\` varchar(255) NOT NULL, \`name\` varchar(255) NOT NULL, \`document\` varchar(255) NOT NULL, \`phone\` varchar(255) NULL, \`person_type\` enum ('PF', 'PJ') NOT NULL DEFAULT 'PF', \`trading_name\` varchar(255) NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_97672ac88f789774dd47f7c8be\` (\`email\`), UNIQUE INDEX \`IDX_c1b20b2a1883ed106c3e746c25\` (\`document\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`gateway_accounts\` ADD CONSTRAINT \`FK_a2c3e2b592f5d648852e92644c5\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`gateway_accounts\` DROP FOREIGN KEY \`FK_a2c3e2b592f5d648852e92644c5\``,
    );
    await queryRunner.query(`DROP INDEX \`IDX_c1b20b2a1883ed106c3e746c25\` ON \`users\``);
    await queryRunner.query(`DROP INDEX \`IDX_97672ac88f789774dd47f7c8be\` ON \`users\``);
    await queryRunner.query(`DROP TABLE \`users\``);
    await queryRunner.query(
      `DROP INDEX \`REL_a2c3e2b592f5d648852e92644c\` ON \`gateway_accounts\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_a2c3e2b592f5d648852e92644c\` ON \`gateway_accounts\``,
    );
    await queryRunner.query(`DROP TABLE \`gateway_accounts\``);
  }
}
