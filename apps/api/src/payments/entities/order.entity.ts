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
import { CheckoutLink } from '../../checkout/entities/checkout-link.entity';
import { User } from '../../users/entities/user.entity';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 36, name: 'checkout_link_id', nullable: true })
  @Index()
  checkoutLinkId: string | null;

  @ManyToOne(() => CheckoutLink, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'checkout_link_id' })
  checkoutLink: CheckoutLink | null;

  @Column({ type: 'varchar', length: 36, name: 'user_id' })
  @Index()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'varchar', length: 255, name: 'external_reference' })
  @Index()
  externalReference: string;

  @Column({ type: 'int', comment: 'Amount in centavos' })
  amount: number;

  @Column({ type: 'enum', enum: ['PIX', 'CREDIT_CARD'] })
  method: 'PIX' | 'CREDIT_CARD';

  @Column({
    type: 'enum',
    enum: ['PENDING', 'APPROVED', 'DENIED', 'CANCELLED', 'EXPIRED'],
    default: 'PENDING',
  })
  status: 'PENDING' | 'APPROVED' | 'DENIED' | 'CANCELLED' | 'EXPIRED';

  @Column({ type: 'varchar', length: 255, name: 'gateway_payment_id', nullable: true })
  @Index()
  gatewayPaymentId: string | null;

  @Column({ type: 'int', default: 1 })
  installments: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0, name: 'fee_percent' })
  feePercent: number;

  @Column({ type: 'int', default: 0, name: 'fee_amount', comment: 'Fee in centavos' })
  feeAmount: number;

  @Column({ type: 'int', default: 0, name: 'net_amount', comment: 'Net in centavos' })
  netAmount: number;

  @Column({ type: 'text', nullable: true, name: 'qr_code' })
  qrCode: string | null;

  @Column({ type: 'longtext', nullable: true, name: 'qr_code_base64' })
  qrCodeBase64: string | null;

  @Column({ type: 'varchar', length: 255, name: 'payer_name', nullable: true })
  payerName: string | null;

  @Column({ type: 'varchar', length: 20, name: 'payer_document', nullable: true })
  payerDocument: string | null;

  @Column({ name: 'expires_at', type: 'datetime', nullable: true })
  expiresAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
