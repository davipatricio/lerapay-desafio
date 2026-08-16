import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

/**
 * Entidade de saque (transferência via Pix) solicitada pelo lojista.
 * Funciona como agregado local de auditoria e reconciliação com o gateway Lera Box.
 */
@Entity('withdrawals')
export class Withdrawal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 36, name: 'user_id' })
  @Index()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'varchar', length: 255, name: 'gateway_withdrawal_id', nullable: true })
  @Index()
  gatewayWithdrawalId: string | null;

  @Column({ type: 'int', comment: 'Valor do saque em centavos' })
  amount: number;

  @Column({ type: 'varchar', length: 255, name: 'pix_key' })
  pixKey: string;

  @Column({
    type: 'enum',
    enum: ['CPF', 'CNPJ', 'EMAIL', 'PHONE', 'RANDOM'],
    name: 'pix_key_type',
    default: 'CPF',
  })
  pixKeyType: 'CPF' | 'CNPJ' | 'EMAIL' | 'PHONE' | 'RANDOM';

  @Column({ type: 'varchar', length: 20, nullable: true })
  document: string | null;

  @Column({
    type: 'enum',
    enum: [
      'PENDING',
      'PROCESSING',
      'APPROVED',
      'COMPLETED',
      'DENIED',
      'FAILED',
      'INSUFFICIENT_BALANCE',
    ],
    default: 'PENDING',
  })
  status:
    | 'PENDING'
    | 'PROCESSING'
    | 'APPROVED'
    | 'COMPLETED'
    | 'DENIED'
    | 'FAILED'
    | 'INSUFFICIENT_BALANCE';

  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
