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

    const gatewayRes = await this.gatewayService.createPixPayment(
      {
        amount: context.amount,
        description: dto.description || context.checkoutLink?.title || 'Pix Payment',
        payerDocument,
        externalReference: context.externalReference,
      },
      context.merchantToken,
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
      description: dto.description || context.checkoutLink?.title || 'Pix Payment',
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

    const gatewayRes = await this.gatewayService.createCardPayment(
      {
        amount: context.amount,
        description: dto.description || context.checkoutLink?.title || 'Credit Card Payment',
        cardNumber: dto.cardNumber.replace(/\D/g, ''),
        cardHolder: dto.cardHolder.trim().toUpperCase(),
        expiryMonth: dto.expiryMonth.padStart(2, '0'),
        expiryYear: dto.expiryYear.length === 2 ? `20${dto.expiryYear}` : dto.expiryYear,
        cvv: dto.cvv.trim(),
        installments: dto.installments,
        feePercent: dto.feePercent,
      },
      context.merchantToken,
    );

    const status = gatewayRes.success ? 'APPROVED' : 'DENIED';
    const feeAmount = gatewayRes.fee || Math.round((context.amount * dto.feePercent) / 100);
    const netAmount = gatewayRes.netAmount || context.amount - feeAmount;

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
      description: dto.description || context.checkoutLink?.title || 'Credit Card Payment',
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
      throw new NotFoundException(`Payment with ID/reference ${id} not found`);
    }

    await this.refreshOrderStatus(order);
    return order;
  }

  public async getPublicCheckoutPayment(checkoutLinkId: string, orderId: string) {
    const order = await this.orderRepository.findOne({
      where: { id: orderId, checkoutLinkId },
    });

    if (!order) {
      throw new NotFoundException('Payment not found for this checkout link');
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
        throw new NotFoundException('Checkout link not found');
      }

      userId = checkoutLink.userId;
    }

    if (!userId) {
      throw new BadRequestException('A valid checkoutLinkId is required for public payments');
    }

    const merchant = await this.usersService.findById(userId);
    const merchantToken = merchant?.gatewayAccount?.merchantToken;
    if (!merchantToken) {
      throw new BadRequestException(
        'Merchant has not linked their Lera Box Gateway account. Please link gateway credentials before accepting payments.',
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
    if (checkoutLink.status !== 'ACTIVE') {
      throw new BadRequestException('This checkout link is no longer active');
    }

    if (checkoutLink.expiresAt && checkoutLink.expiresAt.getTime() <= Date.now()) {
      await this.checkoutService.updateStatus(checkoutLink.id, 'EXPIRED');
      throw new BadRequestException('This checkout link has expired');
    }

    if (!checkoutLink.allowedMethods.includes(method)) {
      throw new BadRequestException(`This checkout link does not allow ${method} payments`);
    }

    if (dto.amount !== checkoutLink.amount) {
      throw new BadRequestException('Payment amount must match the checkout link amount');
    }

    if (
      dto.externalReference?.trim() &&
      dto.externalReference.trim() !== checkoutLink.externalReference
    ) {
      throw new BadRequestException(
        'Payment external reference must match the checkout link reference',
      );
    }

    if (
      method === 'CREDIT_CARD' &&
      'installments' in dto &&
      dto.installments > checkoutLink.maxInstallments
    ) {
      throw new BadRequestException(
        `This checkout link allows at most ${checkoutLink.maxInstallments} installments`,
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
      // Return the last locally reconciled status when gateway availability is degraded.
    }
  }
}
