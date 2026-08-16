import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CheckoutService } from '../checkout/checkout.service';
import { FeesService } from '../fees/fees.service';
import { GatewayService } from '../gateway/gateway.service';
import { UsersService } from '../users/users.service';
import type { CreateCardPaymentDto } from './dto/create-card-payment.dto';
import type { CreatePixPaymentDto } from './dto/create-pix-payment.dto';
import { Order } from './entities/order.entity';
import { Transaction } from './entities/transaction.entity';

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

  public async createPixPayment(
    dto: CreatePixPaymentDto,
    authenticatedUserId?: string,
    explicitMerchantToken?: string,
  ) {
    let userId = authenticatedUserId;
    let merchantToken = explicitMerchantToken;
    let checkoutLink = null;

    if (dto.checkoutLinkId) {
      checkoutLink = await this.checkoutService.findById(dto.checkoutLinkId);
      userId = checkoutLink.userId;
      const merchant = await this.usersService.findById(userId);
      merchantToken = merchantToken || merchant?.gatewayAccount?.merchantToken || undefined;
    } else if (userId) {
      const merchant = await this.usersService.findById(userId);
      merchantToken = merchantToken || merchant?.gatewayAccount?.merchantToken || undefined;
    }

    if (!userId) {
      throw new BadRequestException('Either authentication or a valid checkoutLinkId is required');
    }

    if (!merchantToken) {
      throw new BadRequestException(
        'Merchant has not linked their Lera Box Gateway account. Please link gateway credentials before accepting payments.',
      );
    }

    const externalReference =
      dto.externalReference?.trim() ||
      checkoutLink?.externalReference ||
      `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

    // Execute Pix payment creation on Lera Box Gateway
    const gatewayRes = await this.gatewayService.createPixPayment(
      {
        amount: dto.amount,
        description: dto.description || checkoutLink?.title || 'Pix Payment',
        payerDocument: dto.payerDocument.replace(/\D/g, ''),
        externalReference,
      },
      merchantToken,
    );

    // Save Order in local database
    const order = this.orderRepository.create({
      userId,
      checkoutLinkId: checkoutLink?.id || null,
      externalReference,
      amount: dto.amount,
      method: 'PIX',
      status: 'PENDING',
      gatewayPaymentId: gatewayRes.txid || null,
      feePercent: 0,
      feeAmount: 0,
      netAmount: dto.amount,
      qrCode: gatewayRes.emv,
      qrCodeBase64: gatewayRes.qrCodeBase64,
      payerDocument: dto.payerDocument.replace(/\D/g, ''),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
    });
    await this.orderRepository.save(order);

    // Save local Transaction mirror
    const transaction = this.transactionRepository.create({
      userId,
      orderId: order.id,
      gatewayTransactionId: gatewayRes.txid || null,
      externalReference,
      type: 'PIX',
      status: 'PENDING',
      amount: dto.amount,
      fee: 0,
      netAmount: dto.amount,
      description: dto.description || checkoutLink?.title || 'Pix Payment',
    });
    await this.transactionRepository.save(transaction);

    return {
      success: true,
      orderId: order.id,
      externalReference,
      amount: dto.amount,
      method: 'PIX',
      status: 'PENDING',
      qrCode: gatewayRes.emv,
      qrCodeBase64: gatewayRes.qrCodeBase64,
      txid: gatewayRes.txid,
    };
  }

  public async createCardPayment(
    dto: CreateCardPaymentDto,
    authenticatedUserId?: string,
    explicitMerchantToken?: string,
  ) {
    let userId = authenticatedUserId;
    let merchantToken = explicitMerchantToken;
    let checkoutLink = null;

    if (dto.checkoutLinkId) {
      checkoutLink = await this.checkoutService.findById(dto.checkoutLinkId);
      userId = checkoutLink.userId;
      const merchant = await this.usersService.findById(userId);
      merchantToken = merchantToken || merchant?.gatewayAccount?.merchantToken || undefined;
    } else if (userId) {
      const merchant = await this.usersService.findById(userId);
      merchantToken = merchantToken || merchant?.gatewayAccount?.merchantToken || undefined;
    }

    if (!userId) {
      throw new BadRequestException('Either authentication or a valid checkoutLinkId is required');
    }

    if (!merchantToken) {
      throw new BadRequestException(
        'Merchant has not linked their Lera Box Gateway account. Please link gateway credentials before accepting payments.',
      );
    }

    // Strictly validate fee percentage against gateway fee table
    await this.feesService.validateFee(dto.brand, dto.installments, dto.feePercent);

    const externalReference =
      dto.externalReference?.trim() ||
      checkoutLink?.externalReference ||
      `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

    // Execute credit card payment on Lera Box Gateway
    const gatewayRes = await this.gatewayService.createCardPayment(
      {
        amount: dto.amount,
        description: dto.description || checkoutLink?.title || 'Credit Card Payment',
        cardNumber: dto.cardNumber.replace(/\D/g, ''),
        cardHolder: dto.cardHolder.trim().toUpperCase(),
        expiryMonth: dto.expiryMonth.padStart(2, '0'),
        expiryYear: dto.expiryYear.length === 2 ? `20${dto.expiryYear}` : dto.expiryYear,
        cvv: dto.cvv.trim(),
        installments: dto.installments,
        feePercent: dto.feePercent,
      },
      merchantToken,
    );

    const status = gatewayRes.success ? 'APPROVED' : 'DENIED';

    // Save Order
    const order = this.orderRepository.create({
      userId,
      checkoutLinkId: checkoutLink?.id || null,
      externalReference,
      amount: dto.amount,
      method: 'CREDIT_CARD',
      status,
      gatewayPaymentId: gatewayRes.transactionId || null,
      installments: dto.installments,
      feePercent: dto.feePercent,
      feeAmount: gatewayRes.fee || Math.round((dto.amount * dto.feePercent) / 100),
      netAmount:
        gatewayRes.netAmount || dto.amount - Math.round((dto.amount * dto.feePercent) / 100),
      payerName: dto.cardHolder.trim(),
    });
    await this.orderRepository.save(order);

    // Save Transaction
    const transaction = this.transactionRepository.create({
      userId,
      orderId: order.id,
      gatewayTransactionId: gatewayRes.transactionId || null,
      externalReference,
      type: 'CREDIT_CARD',
      status,
      amount: dto.amount,
      fee: order.feeAmount,
      netAmount: order.netAmount,
      description: dto.description || checkoutLink?.title || 'Credit Card Payment',
    });
    await this.transactionRepository.save(transaction);

    // If approved and attached to checkout link, update link status
    if (status === 'APPROVED' && checkoutLink) {
      await this.checkoutService.updateStatus(checkoutLink.id, 'COMPLETED');
    }

    return {
      success: gatewayRes.success,
      orderId: order.id,
      externalReference,
      amount: dto.amount,
      method: 'CREDIT_CARD',
      status,
      transactionId: gatewayRes.transactionId,
      fee: order.feeAmount,
      netAmount: order.netAmount,
    };
  }

  public async getPayment(id: string, explicitMerchantToken?: string) {
    const order = await this.orderRepository.findOne({
      where: [{ id }, { gatewayPaymentId: id }, { externalReference: id }],
      relations: { checkoutLink: true },
    });

    if (!order) {
      throw new NotFoundException(`Payment with ID/reference ${id} not found`);
    }

    let merchantToken = explicitMerchantToken;
    if (!merchantToken && order.userId) {
      const merchant = await this.usersService.findById(order.userId);
      merchantToken = merchant?.gatewayAccount?.merchantToken || undefined;
    }

    // Query gateway for live status if token is available
    if (order.gatewayPaymentId && merchantToken) {
      try {
        const liveRes = await this.gatewayService.getPayment(order.gatewayPaymentId, merchantToken);
        if (liveRes && liveRes.status) {
          order.status = liveRes.status as any;
          await this.orderRepository.save(order);
        }
      } catch {
        // Fall back to stored local state if gateway check fails
      }
    }

    return order;
  }
}
