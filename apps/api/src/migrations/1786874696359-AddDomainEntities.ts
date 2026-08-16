import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDomainEntities1786874696359 implements MigrationInterface {
  name = 'AddDomainEntities1786874696359';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`checkout_links\` (\`id\` varchar(36) NOT NULL, \`user_id\` varchar(36) NOT NULL, \`external_reference\` varchar(255) NOT NULL, \`title\` varchar(255) NOT NULL, \`amount\` int NOT NULL COMMENT 'Amount in centavos', \`allowed_methods\` text NOT NULL, \`max_installments\` int NOT NULL DEFAULT '12', \`status\` enum ('ACTIVE', 'EXPIRED', 'COMPLETED') NOT NULL DEFAULT 'ACTIVE', \`expires_at\` datetime NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), INDEX \`IDX_bb1de397a5896527ac6336b6cd\` (\`user_id\`), UNIQUE INDEX \`IDX_9964632142499d5ca4fde5c292\` (\`external_reference\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`orders\` (\`id\` varchar(36) NOT NULL, \`checkout_link_id\` varchar(36) NULL, \`user_id\` varchar(36) NOT NULL, \`external_reference\` varchar(255) NOT NULL, \`amount\` int NOT NULL COMMENT 'Amount in centavos', \`method\` enum ('PIX', 'CREDIT_CARD') NOT NULL, \`status\` enum ('PENDING', 'APPROVED', 'DENIED', 'CANCELLED', 'EXPIRED') NOT NULL DEFAULT 'PENDING', \`gateway_payment_id\` varchar(255) NULL, \`installments\` int NOT NULL DEFAULT '1', \`fee_percent\` decimal(5,2) NOT NULL DEFAULT '0.00', \`fee_amount\` int NOT NULL COMMENT 'Fee in centavos' DEFAULT '0', \`net_amount\` int NOT NULL COMMENT 'Net in centavos' DEFAULT '0', \`qr_code\` text NULL, \`qr_code_base64\` longtext NULL, \`payer_name\` varchar(255) NULL, \`payer_document\` varchar(20) NULL, \`expires_at\` datetime NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), INDEX \`IDX_d0603b3a3b68935fdfbfc45af7\` (\`checkout_link_id\`), INDEX \`IDX_a922b820eeef29ac1c6800e826\` (\`user_id\`), INDEX \`IDX_329868121e92be672262efea85\` (\`external_reference\`), INDEX \`IDX_20240295c7bdb45e9203747c99\` (\`gateway_payment_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`transactions\` (\`id\` varchar(36) NOT NULL, \`user_id\` varchar(36) NOT NULL, \`order_id\` varchar(36) NULL, \`gateway_transaction_id\` varchar(255) NULL, \`external_reference\` varchar(255) NULL, \`type\` enum ('PIX', 'CREDIT_CARD', 'WITHDRAWAL') NOT NULL, \`status\` enum ('PENDING', 'APPROVED', 'DENIED', 'CANCELLED', 'EXPIRED') NOT NULL DEFAULT 'PENDING', \`amount\` int NOT NULL COMMENT 'Amount in centavos', \`fee\` int NOT NULL COMMENT 'Fee in centavos' DEFAULT '0', \`net_amount\` int NOT NULL COMMENT 'Net amount in centavos' DEFAULT '0', \`description\` varchar(255) NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), INDEX \`IDX_e9acc6efa76de013e8c1553ed2\` (\`user_id\`), INDEX \`IDX_3cb0558ed36997f1d9ecc1118e\` (\`order_id\`), INDEX \`IDX_16a92060f6215782287f05453f\` (\`gateway_transaction_id\`), INDEX \`IDX_4ef0fc5306621274956d163a17\` (\`external_reference\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`webhook_events\` (\`id\` varchar(36) NOT NULL, \`user_id\` varchar(36) NULL, \`event_type\` varchar(50) NOT NULL, \`event_id\` varchar(255) NULL, \`signature\` varchar(500) NULL, \`payload\` text NOT NULL, \`status\` enum ('PROCESSED', 'FAILED', 'IGNORED') NOT NULL DEFAULT 'PROCESSED', \`error\` text NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), INDEX \`IDX_1a31c593da859c2794d9653a4e\` (\`user_id\`), INDEX \`IDX_99c9011566b175ab79b0a1e174\` (\`event_type\`), UNIQUE INDEX \`IDX_eca7d9af1d5bb2184a201ed250\` (\`event_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`withdrawals\` (\`id\` varchar(36) NOT NULL, \`user_id\` varchar(36) NOT NULL, \`gateway_withdrawal_id\` varchar(255) NULL, \`amount\` int NOT NULL COMMENT 'Amount in centavos', \`pix_key\` varchar(255) NOT NULL, \`pix_key_type\` enum ('CPF', 'CNPJ', 'EMAIL', 'PHONE', 'RANDOM') NOT NULL DEFAULT 'CPF', \`document\` varchar(20) NULL, \`status\` enum ('PENDING', 'PROCESSING', 'APPROVED', 'COMPLETED', 'DENIED', 'FAILED', 'INSUFFICIENT_BALANCE') NOT NULL DEFAULT 'PENDING', \`description\` varchar(255) NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), INDEX \`IDX_0bd35ddb3acfb323ae3e024d2f\` (\`user_id\`), INDEX \`IDX_7461ce97d1b45857d4ac88a99f\` (\`gateway_withdrawal_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`checkout_links\` ADD CONSTRAINT \`FK_bb1de397a5896527ac6336b6cdd\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`orders\` ADD CONSTRAINT \`FK_d0603b3a3b68935fdfbfc45af7b\` FOREIGN KEY (\`checkout_link_id\`) REFERENCES \`checkout_links\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`orders\` ADD CONSTRAINT \`FK_a922b820eeef29ac1c6800e826a\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`transactions\` ADD CONSTRAINT \`FK_e9acc6efa76de013e8c1553ed2b\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`transactions\` ADD CONSTRAINT \`FK_3cb0558ed36997f1d9ecc1118e7\` FOREIGN KEY (\`order_id\`) REFERENCES \`orders\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`withdrawals\` ADD CONSTRAINT \`FK_0bd35ddb3acfb323ae3e024d2f8\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`withdrawals\` DROP FOREIGN KEY \`FK_0bd35ddb3acfb323ae3e024d2f8\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`transactions\` DROP FOREIGN KEY \`FK_3cb0558ed36997f1d9ecc1118e7\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`transactions\` DROP FOREIGN KEY \`FK_e9acc6efa76de013e8c1553ed2b\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`orders\` DROP FOREIGN KEY \`FK_a922b820eeef29ac1c6800e826a\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`orders\` DROP FOREIGN KEY \`FK_d0603b3a3b68935fdfbfc45af7b\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`checkout_links\` DROP FOREIGN KEY \`FK_bb1de397a5896527ac6336b6cdd\``,
    );
    await queryRunner.query(`DROP INDEX \`IDX_7461ce97d1b45857d4ac88a99f\` ON \`withdrawals\``);
    await queryRunner.query(`DROP INDEX \`IDX_0bd35ddb3acfb323ae3e024d2f\` ON \`withdrawals\``);
    await queryRunner.query(`DROP TABLE \`withdrawals\``);
    await queryRunner.query(`DROP INDEX \`IDX_eca7d9af1d5bb2184a201ed250\` ON \`webhook_events\``);
    await queryRunner.query(`DROP INDEX \`IDX_99c9011566b175ab79b0a1e174\` ON \`webhook_events\``);
    await queryRunner.query(`DROP INDEX \`IDX_1a31c593da859c2794d9653a4e\` ON \`webhook_events\``);
    await queryRunner.query(`DROP TABLE \`webhook_events\``);
    await queryRunner.query(`DROP INDEX \`IDX_4ef0fc5306621274956d163a17\` ON \`transactions\``);
    await queryRunner.query(`DROP INDEX \`IDX_16a92060f6215782287f05453f\` ON \`transactions\``);
    await queryRunner.query(`DROP INDEX \`IDX_3cb0558ed36997f1d9ecc1118e\` ON \`transactions\``);
    await queryRunner.query(`DROP INDEX \`IDX_e9acc6efa76de013e8c1553ed2\` ON \`transactions\``);
    await queryRunner.query(`DROP TABLE \`transactions\``);
    await queryRunner.query(`DROP INDEX \`IDX_20240295c7bdb45e9203747c99\` ON \`orders\``);
    await queryRunner.query(`DROP INDEX \`IDX_329868121e92be672262efea85\` ON \`orders\``);
    await queryRunner.query(`DROP INDEX \`IDX_a922b820eeef29ac1c6800e826\` ON \`orders\``);
    await queryRunner.query(`DROP INDEX \`IDX_d0603b3a3b68935fdfbfc45af7\` ON \`orders\``);
    await queryRunner.query(`DROP TABLE \`orders\``);
    await queryRunner.query(`DROP INDEX \`IDX_9964632142499d5ca4fde5c292\` ON \`checkout_links\``);
    await queryRunner.query(`DROP INDEX \`IDX_bb1de397a5896527ac6336b6cd\` ON \`checkout_links\``);
    await queryRunner.query(`DROP TABLE \`checkout_links\``);
  }
}
