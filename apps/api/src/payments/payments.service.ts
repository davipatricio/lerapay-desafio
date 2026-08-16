import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CheckoutService } from '../checkout/checkout.service';
import type { CheckoutLink } from '../checkout/entities/checkout-link.entity';
import { FeesService } from '../fees/fees.service';
import { GatewayService } from '../gateway/gateway.service';
import { UsersService } from '../users/users.service';
import type { CreateCardPaymentDto } from './dto/create-card-payment.dto';
import type { CreatePixPaymentDto } from './dto/create-pix-payment.dto';
import { Order } from './entities/order.entity';
import { Transaction } from './entities/transaction.entity';

type PaymentMethod = 'PIX' | 'CREDIT_CARD';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    private readonly gatewayService: GatewayService,
    private readonly feesService: FeesService,
    private readonly checkoutService: CheckoutService,
    private readonly usersService: UsersService,
  ) {}

  public async createPixPayment(dto: CreatePixPaymentDto, authenticatedUserId?: string) {
    const context = await this.resolvePaymentContext(dto, 'PIX', authenticatedUserId);
    const payerDocument = dto.payerDocument.replace(/\D/g, '');

    const gatewayRes = await this.gatewayService.withMerchantTokenByUserId(
      context.userId,
      (token) =>
        this.gatewayService.createPixPayment(
          {
            amount: context.amount,
            description: dto.description || context.checkoutLink?.title || 'Pagamento Pix',
            payerDocument,
            externalReference: context.externalReference,
          },
          token,
        ),
    );

    const order = this.orderRepository.create({
      userId: context.userId,
      checkoutLinkId: context.checkoutLink?.id || null,
      externalReference: context.externalReference,
      amount: context.amount,
      method: 'PIX',
      status: 'PENDING',
      gatewayPaymentId: gatewayRes.txid || null,
      feePercent: 0,
      feeAmount: 0,
      netAmount: context.amount,
      qrCode: gatewayRes.emv,
      qrCodeBase64: gatewayRes.qrCodeBase64,
      payerDocument,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    });
    await this.orderRepository.save(order);

    const transaction = this.transactionRepository.create({
      userId: context.userId,
      orderId: order.id,
      gatewayTransactionId: gatewayRes.txid || null,
      externalReference: context.externalReference,
      type: 'PIX',
      status: 'PENDING',
      amount: context.amount,
      fee: 0,
      netAmount: context.amount,
      description: dto.description || context.checkoutLink?.title || 'Pagamento Pix',
    });
    await this.transactionRepository.save(transaction);

    return {
      success: true,
      orderId: order.id,
      externalReference: context.externalReference,
      amount: context.amount,
      method: 'PIX',
      status: 'PENDING',
      qrCode: gatewayRes.emv,
      qrCodeBase64: gatewayRes.qrCodeBase64,
      txid: gatewayRes.txid,
    };
  }

  public async createCardPayment(dto: CreateCardPaymentDto, authenticatedUserId?: string) {
    const context = await this.resolvePaymentContext(dto, 'CREDIT_CARD', authenticatedUserId);

    await this.feesService.validateFee(dto.brand, dto.installments, dto.feePercent);

    const gatewayRes = await this.gatewayService.withMerchantTokenByUserId(
      context.userId,
      (token) =>
        this.gatewayService.createCardPayment(
          {
            amount: context.amount,
            description:
              dto.description || context.checkoutLink?.title || 'Pagamento com Cartão de Crédito',
            cardNumber: dto.cardNumber.replace(/\D/g, ''),
            cardHolder: dto.cardHolder.trim().toUpperCase(),
            expiryMonth: dto.expiryMonth.padStart(2, '0'),
            expiryYear: dto.expiryYear.length === 2 ? `20${dto.expiryYear}` : dto.expiryYear,
            cvv: dto.cvv.trim(),
            installments: dto.installments,
            feePercent: dto.feePercent,
          },
          token,
        ),
    );

    const status = gatewayRes.success ? 'APPROVED' : 'DENIED';
    const fallbackFeeAmount = Math.round((context.amount * dto.feePercent) / 100);
    const gatewaySummary =
      gatewayRes.fee && typeof gatewayRes.fee === 'object'
        ? (gatewayRes.fee as Record<string, unknown>)
        : null;
    const gatewayFee = Number(gatewaySummary?.feeAmount ?? gatewayRes.fee);
    const feeAmount =
      Number.isFinite(gatewayFee) && gatewayFee > 0 ? gatewayFee : fallbackFeeAmount;
    const gatewayNetAmount = Number(gatewaySummary?.netAmount ?? gatewayRes.netAmount);
    const netAmount =
      Number.isFinite(gatewayNetAmount) && gatewayNetAmount > 0
        ? gatewayNetAmount
        : context.amount - feeAmount;

    const order = this.orderRepository.create({
      userId: context.userId,
      checkoutLinkId: context.checkoutLink?.id || null,
      externalReference: context.externalReference,
      amount: context.amount,
      method: 'CREDIT_CARD',
      status,
      gatewayPaymentId: gatewayRes.transactionId || null,
      installments: dto.installments,
      feePercent: dto.feePercent,
      feeAmount,
      netAmount,
      payerName: dto.cardHolder.trim(),
    });
    await this.orderRepository.save(order);

    const transaction = this.transactionRepository.create({
      userId: context.userId,
      orderId: order.id,
      gatewayTransactionId: gatewayRes.transactionId || null,
      externalReference: context.externalReference,
      type: 'CREDIT_CARD',
      status,
      amount: context.amount,
      fee: order.feeAmount,
      netAmount: order.netAmount,
      description:
        dto.description || context.checkoutLink?.title || 'Pagamento com Cartão de Crédito',
    });
    await this.transactionRepository.save(transaction);

    if (status === 'APPROVED' && context.checkoutLink) {
      await this.checkoutService.updateStatus(context.checkoutLink.id, 'COMPLETED');
    }

    return {
      success: gatewayRes.success,
      orderId: order.id,
      externalReference: context.externalReference,
      amount: context.amount,
      method: 'CREDIT_CARD',
      status,
      transactionId: gatewayRes.transactionId,
      fee: order.feeAmount,
      netAmount: order.netAmount,
    };
  }

  public async getMerchantPayment(id: string, userId: string): Promise<Order> {
    // Todas as alternativas de busca são delimitadas pelo lojista autenticado,
    // impedindo que um identificador revele pagamentos de outra conta.
    const order = await this.orderRepository.findOne({
      where: [
        { id, userId },
        { gatewayPaymentId: id, userId },
        { externalReference: id, userId },
      ],
      order: { createdAt: 'DESC' },
      relations: { checkoutLink: true },
    });

    if (!order) {
      throw new NotFoundException(`Pagamento com ID/referência ${id} não encontrado`);
    }

    await this.refreshOrderStatus(order);
    return order;
  }

  public async getPublicCheckoutPayment(checkoutLinkId: string, orderId: string) {
    const order = await this.orderRepository.findOne({
      where: { id: orderId, checkoutLinkId },
    });

    if (!order) {
      throw new NotFoundException('Pagamento não encontrado para este link de checkout');
    }

    await this.refreshOrderStatus(order);

    return {
      orderId: order.id,
      amount: order.amount,
      externalReference: order.externalReference,
      method: order.method,
      status: order.status,
      expiresAt: order.expiresAt,
    };
  }

  private async resolvePaymentContext(
    dto: CreatePixPaymentDto | CreateCardPaymentDto,
    method: PaymentMethod,
    authenticatedUserId?: string,
  ): Promise<{
    userId: string;
    merchantToken: string;
    checkoutLink: CheckoutLink | null;
    amount: number;
    externalReference: string;
  }> {
    let userId = authenticatedUserId;
    let checkoutLink: CheckoutLink | null = null;

    if (dto.checkoutLinkId) {
      checkoutLink = await this.checkoutService.findById(dto.checkoutLinkId);
      await this.validateCheckoutLink(checkoutLink, dto, method);

      if (authenticatedUserId && authenticatedUserId !== checkoutLink.userId) {
        throw new NotFoundException('Link de checkout não encontrado');
      }

      userId = checkoutLink.userId;
    }

    if (!userId) {
      throw new BadRequestException(
        'Um checkoutLinkId válido é obrigatório para pagamentos públicos',
      );
    }

    const merchant = await this.usersService.findById(userId);
    const merchantToken = merchant?.gatewayAccount?.merchantToken;
    if (!merchantToken) {
      throw new BadRequestException(
        'O lojista não vinculou sua conta do gateway Lera Box. Vincule as credenciais do gateway antes de aceitar pagamentos.',
      );
    }

    const externalReference = checkoutLink
      ? checkoutLink.externalReference
      : dto.externalReference?.trim() ||
        `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

    return {
      userId,
      merchantToken,
      checkoutLink,
      amount: checkoutLink?.amount ?? dto.amount,
      externalReference,
    };
  }

  private async validateCheckoutLink(
    checkoutLink: CheckoutLink,
    dto: CreatePixPaymentDto | CreateCardPaymentDto,
    method: PaymentMethod,
  ): Promise<void> {
    // O link persistido é a fonte autoritativa do pagamento público: o payload
    // não pode sobrescrever valor, referência, método, status, prazo ou parcelas.
    if (checkoutLink.status !== 'ACTIVE') {
      throw new BadRequestException('Este link de checkout não está mais ativo');
    }

    if (checkoutLink.expiresAt && checkoutLink.expiresAt.getTime() <= Date.now()) {
      await this.checkoutService.updateStatus(checkoutLink.id, 'EXPIRED');
      throw new BadRequestException('Este link de checkout expirou');
    }

    if (!checkoutLink.allowedMethods.includes(method)) {
      throw new BadRequestException(`Este link de checkout não permite pagamentos via ${method}`);
    }

    if (dto.amount !== checkoutLink.amount) {
      throw new BadRequestException(
        'O valor do pagamento deve corresponder ao valor do link de checkout',
      );
    }

    if (
      dto.externalReference?.trim() &&
      dto.externalReference.trim() !== checkoutLink.externalReference
    ) {
      throw new BadRequestException(
        'A referência externa do pagamento deve corresponder à do link de checkout',
      );
    }

    if (
      method === 'CREDIT_CARD' &&
      'installments' in dto &&
      dto.installments > checkoutLink.maxInstallments
    ) {
      throw new BadRequestException(
        `Este link de checkout permite no máximo ${checkoutLink.maxInstallments} parcelas`,
      );
    }
  }

  private async refreshOrderStatus(order: Order): Promise<void> {
    if (!order.gatewayPaymentId) {
      return;
    }

    const merchant = await this.usersService.findById(order.userId);
    const merchantToken = merchant?.gatewayAccount?.merchantToken;
    if (!merchantToken) {
      return;
    }

    try {
      const liveRes = await this.gatewayService.getPayment(order.gatewayPaymentId, merchantToken);
      if (liveRes?.status) {
        order.status = liveRes.status as Order['status'];
        await this.orderRepository.save(order);
      }
    } catch {
      // Em indisponibilidade do gateway, preserva o último status já conciliado localmente.
    }
  }
}
