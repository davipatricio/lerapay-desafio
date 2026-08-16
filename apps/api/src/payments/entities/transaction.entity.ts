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
import { Order } from './order.entity';

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 36, name: 'user_id' })
  @Index()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'varchar', length: 36, name: 'order_id', nullable: true })
  @Index()
  orderId: string | null;

  @ManyToOne(() => Order, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'order_id' })
  order: Order | null;

  @Column({ type: 'varchar', length: 255, name: 'gateway_transaction_id', nullable: true })
  @Index()
  gatewayTransactionId: string | null;

  @Column({ type: 'varchar', length: 255, name: 'external_reference', nullable: true })
  @Index()
  externalReference: string | null;

  @Column({
    type: 'enum',
    enum: ['PIX', 'CREDIT_CARD', 'WITHDRAWAL'],
  })
  type: 'PIX' | 'CREDIT_CARD' | 'WITHDRAWAL';

  @Column({
    type: 'enum',
    enum: ['PENDING', 'APPROVED', 'DENIED', 'CANCELLED', 'EXPIRED'],
    default: 'PENDING',
  })
  status: 'PENDING' | 'APPROVED' | 'DENIED' | 'CANCELLED' | 'EXPIRED';

  @Column({ type: 'int', comment: 'Valor em centavos' })
  amount: number;

  @Column({ type: 'int', default: 0, comment: 'Valor da taxa em centavos' })
  fee: number;

  @Column({ type: 'int', default: 0, name: 'net_amount', comment: 'Valor líquido em centavos' })
  netAmount: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
