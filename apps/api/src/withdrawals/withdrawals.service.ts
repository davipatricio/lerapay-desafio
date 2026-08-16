import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GatewayService } from '../gateway/gateway.service';
import { Transaction } from '../payments/entities/transaction.entity';
import type { User } from '../users/entities/user.entity';
import type { CreateWithdrawalDto } from './dto/create-withdrawal.dto';
import { Withdrawal } from './entities/withdrawal.entity';

@Injectable()
export class WithdrawalsService {
  constructor(
    @InjectRepository(Withdrawal)
    private readonly withdrawalRepository: Repository<Withdrawal>,
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    private readonly gatewayService: GatewayService,
  ) {}

  public async create(user: User, dto: CreateWithdrawalDto): Promise<Withdrawal> {
    const token = user.gatewayAccount?.merchantToken;
    if (!token) {
      throw new BadRequestException(
        'A conta do gateway Lera Box não está vinculada. Vincule sua conta do gateway antes de solicitar saques.',
      );
    }

    const document = (dto.document || user.document).replace(/\D/g, '');
    const externalReference = `WTH-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

    // Executa a solicitação de saque diretamente no gateway Lera Box
    const gatewayRes = await this.gatewayService.withMerchantToken(user, (validToken) =>
      this.gatewayService.createWithdrawal(
        {
          amount: dto.amount,
          pixKey: dto.pixKey.trim(),
          document,
          description: dto.description || 'Saque via Pix',
          externalReference,
        },
        validToken,
      ),
    );

    // Registra a entidade local de Saque para controle e auditoria
    const withdrawal = this.withdrawalRepository.create({
      userId: user.id,
      gatewayWithdrawalId: gatewayRes.withdrawalId || null,
      amount: dto.amount,
      pixKey: dto.pixKey.trim(),
      pixKeyType: dto.pixKeyType || 'CPF',
      document,
      status: gatewayRes.status || 'PENDING',
      description: dto.description || 'Saque via Pix',
    });
    await this.withdrawalRepository.save(withdrawal);

    // Cria a transação espelhada para reconciliação contábil do extrato
    const transaction = this.transactionRepository.create({
      userId: user.id,
      gatewayTransactionId: gatewayRes.withdrawalId || null,
      externalReference,
      type: 'WITHDRAWAL',
      status: gatewayRes.status === 'APPROVED' ? 'APPROVED' : 'PENDING',
      amount: dto.amount,
      fee: 0,
      netAmount: dto.amount,
      description: dto.description || 'Saque via Pix',
    });
    await this.transactionRepository.save(transaction);

    return withdrawal;
  }

  public async findById(id: string, user: User): Promise<Withdrawal> {
    const withdrawal = await this.withdrawalRepository.findOne({
      where: [
        { id, userId: user.id },
        { gatewayWithdrawalId: id, userId: user.id },
      ],
    });

    if (!withdrawal) {
      throw new NotFoundException(`Saque ${id} não encontrado`);
    }

    // Atualiza o status em tempo real via gateway com fallback seguro para o estado local persistido caso a chamada falhe
    const token = user.gatewayAccount?.merchantToken;
    if (withdrawal.gatewayWithdrawalId && token) {
      try {
        const liveRes = await this.gatewayService.getWithdrawal(
          withdrawal.gatewayWithdrawalId,
          token,
        );
        if (liveRes && liveRes.status) {
          withdrawal.status = liveRes.status as any;
          await this.withdrawalRepository.save(withdrawal);
        }
      } catch {
        // Mantém o status local previamente gravado caso a consulta ao gateway falhe
      }
    }

    return withdrawal;
  }

  public async findAllByUser(userId: string): Promise<Withdrawal[]> {
    return this.withdrawalRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }
}
