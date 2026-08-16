import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Entidade de registro e auditoria de eventos assíncronos de webhook recebidos do gateway.
 * O campo eventId único garante idempotência contra retentativas de entrega.
 */
@Entity('webhook_events')
export class WebhookEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 36, name: 'user_id', nullable: true })
  @Index()
  userId: string | null;

  @Column({ type: 'varchar', length: 50, name: 'event_type' })
  @Index()
  eventType: string;

  @Column({ type: 'varchar', length: 255, name: 'event_id', nullable: true, unique: true })
  eventId: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  signature: string | null;

  @Column({ type: 'simple-json' })
  payload: Record<string, any>;

  @Column({
    type: 'enum',
    enum: ['PROCESSED', 'FAILED', 'IGNORED'],
    default: 'PROCESSED',
  })
  status: 'PROCESSED' | 'FAILED' | 'IGNORED';

  @Column({ type: 'text', nullable: true })
  error: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
