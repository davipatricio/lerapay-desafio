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

@Entity('checkout_links')
export class CheckoutLink {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 36, name: 'user_id' })
  @Index()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'varchar', length: 255, name: 'external_reference', unique: true })
  externalReference: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'int', comment: 'Valor em centavos' })
  amount: number;

  @Column({ type: 'simple-json', name: 'allowed_methods' })
  allowedMethods: ('PIX' | 'CREDIT_CARD')[];

  @Column({ type: 'int', name: 'max_installments', default: 12 })
  maxInstallments: number;

  @Column({
    type: 'enum',
    enum: ['ACTIVE', 'EXPIRED', 'COMPLETED'],
    default: 'ACTIVE',
  })
  status: 'ACTIVE' | 'EXPIRED' | 'COMPLETED';

  @Column({ name: 'expires_at', type: 'datetime', nullable: true })
  expiresAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
