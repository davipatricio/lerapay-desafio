import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('gateway_accounts')
export class GatewayAccount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', unique: true })
  userId: string;

  @OneToOne(() => User, (user) => user.gatewayAccount, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'merchant_token', type: 'text', nullable: true })
  merchantToken?: string | null;

  @Column({ name: 'code_client', nullable: true })
  codeClient?: string;

  @Column({ name: 'chave_loja', nullable: true })
  chaveLoja?: string;

  @Column({ name: 'gateway_document', nullable: true })
  gatewayDocument?: string;

  @Column({ name: 'token_expires_at', type: 'datetime', nullable: true })
  tokenExpiresAt?: Date | null;

  @Column({ name: 'is_linked', default: false })
  isLinked: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
