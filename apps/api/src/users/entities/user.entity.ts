import {
  Column,
  CreateDateColumn,
  Entity,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { GatewayAccount } from '../../auth/entities/gateway-account.entity';

export type PersonType = 'PF' | 'PJ';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ name: 'password_hash' })
  passwordHash: string;

  @Column()
  name: string;

  @Column({ unique: true })
  document: string;

  @Column({ nullable: true })
  phone: string;

  @Column({
    name: 'person_type',
    type: 'enum',
    enum: ['PF', 'PJ'],
    default: 'PF',
  })
  personType: PersonType;

  @Column({ name: 'trading_name', nullable: true })
  tradingName?: string;

  @OneToOne(() => GatewayAccount, (gatewayAccount) => gatewayAccount.user)
  gatewayAccount?: GatewayAccount;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
