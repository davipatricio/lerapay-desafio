import { BadRequestException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CheckoutLink } from '../checkout/entities/checkout-link.entity';
import { PaymentsService } from './payments.service';

function activeCheckoutLink(overrides: Partial<CheckoutLink> = {}): CheckoutLink {
  return {
    id: 'checkout-1',
    userId: 'merchant-1',
    externalReference: 'CHECKOUT-ORDER-1',
    title: 'Pedido de teste',
    amount: 12_500,
    allowedMethods: ['PIX', 'CREDIT_CARD'],
    maxInstallments: 3,
    status: 'ACTIVE',
    expiresAt: null,
    ...overrides,
  } as CheckoutLink;
}

describe('PaymentsService', () => {
  const orderRepository = { create: vi.fn(), save: vi.fn(), findOne: vi.fn() };
  const transactionRepository = { create: vi.fn(), save: vi.fn(), findOne: vi.fn() };
  const gatewayService = {
    withMerchantTokenByUserId: vi.fn(),
    createPixPayment: vi.fn(),
    createCardPayment: vi.fn(),
    getPayment: vi.fn(),
  };
  const feesService = { validateFee: vi.fn() };
  const checkoutService = { findById: vi.fn(), updateStatus: vi.fn() };
  const usersService = { findById: vi.fn() };
  let service: PaymentsService;

  beforeEach(() => {
    for (const mock of [
      orderRepository.create,
      orderRepository.save,
      orderRepository.findOne,
      transactionRepository.create,
      transactionRepository.save,
      transactionRepository.findOne,
      gatewayService.withMerchantTokenByUserId,
      gatewayService.createPixPayment,
      gatewayService.createCardPayment,
      gatewayService.getPayment,
      feesService.validateFee,
      checkoutService.findById,
      checkoutService.updateStatus,
      usersService.findById,
    ]) {
      mock.mockReset();
    }

    orderRepository.create.mockImplementation((value) => ({ id: 'order-1', ...value }));
    transactionRepository.create.mockImplementation((value) => ({ id: 'transaction-1', ...value }));
    orderRepository.save.mockImplementation(async (value) => value);
    transactionRepository.save.mockImplementation(async (value) => value);
    checkoutService.updateStatus.mockResolvedValue(undefined);
    usersService.findById.mockResolvedValue({
      gatewayAccount: { merchantToken: 'merchant-token' },
    });
    gatewayService.withMerchantTokenByUserId.mockImplementation(async (userId, operation) => {
      expect(userId).toBe('merchant-1');
      return operation('merchant-token');
    });

    service = new PaymentsService(
      orderRepository as never,
      transactionRepository as never,
      gatewayService as never,
      feesService as never,
      checkoutService as never,
      usersService as never,
    );
  });

  it('uses checkout-owned PIX amount/reference and persists matching centavo records', async () => {
    const link = activeCheckoutLink();
    checkoutService.findById.mockResolvedValue(link);
    gatewayService.createPixPayment.mockResolvedValue({
      txid: 'pix-1',
      emv: 'pix-code',
      qrCodeBase64: 'qr',
    });

    const result = await service.createPixPayment({
      checkoutLinkId: link.id,
      amount: link.amount,
      payerDocument: '123.456.789-01',
      externalReference: link.externalReference,
    });

    expect(gatewayService.createPixPayment).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 12_500,
        payerDocument: '12345678901',
        externalReference: 'CHECKOUT-ORDER-1',
      }),
      'merchant-token',
    );
    expect(orderRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'merchant-1',
        amount: 12_500,
        externalReference: 'CHECKOUT-ORDER-1',
        method: 'PIX',
        netAmount: 12_500,
      }),
    );
    expect(transactionRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 12_500, fee: 0, netAmount: 12_500 }),
    );
    expect(result).toMatchObject({ orderId: 'order-1', amount: 12_500, txid: 'pix-1' });
  });

  it('persists fallback card fee/net centavos and completes only approved checkout payments', async () => {
    const link = activeCheckoutLink();
    checkoutService.findById.mockResolvedValue(link);
    gatewayService.createCardPayment.mockResolvedValue({
      success: true,
      transactionId: 'card-1',
      fee: 0,
      netAmount: 0,
    });

    const result = await service.createCardPayment({
      checkoutLinkId: link.id,
      amount: link.amount,
      externalReference: link.externalReference,
      cardNumber: '4111 1111 1111 1111',
      cardHolder: '  Ana Silva ',
      expiryMonth: '2',
      expiryYear: '29',
      cvv: ' 123 ',
      brand: 'VISA',
      installments: 2,
      feePercent: 2.5,
    });

    expect(gatewayService.createCardPayment).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 12_500,
        cardNumber: '4111111111111111',
        cardHolder: 'ANA SILVA',
        expiryMonth: '02',
        expiryYear: '2029',
        cvv: '123',
      }),
      'merchant-token',
    );
    expect(orderRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'APPROVED', feeAmount: 313, netAmount: 12_187 }),
    );
    expect(checkoutService.updateStatus).toHaveBeenCalledWith(link.id, 'COMPLETED');
    expect(result).toMatchObject({ status: 'APPROVED', fee: 313, netAmount: 12_187 });
  });

  it('reads nested gateway fee summaries and never persists NaN totals', async () => {
    const link = activeCheckoutLink();
    checkoutService.findById.mockResolvedValue(link);
    gatewayService.createCardPayment.mockResolvedValue({
      success: false,
      transactionId: undefined,
      fee: {
        brand: 'MASTERCARD',
        feeAmount: 3,
        netAmount: 97,
      },
      netAmount: Number.NaN,
    });

    const result = await service.createCardPayment({
      checkoutLinkId: link.id,
      amount: link.amount,
      cardNumber: '5555 5555 5555 4444',
      cardHolder: 'Ana Silva',
      expiryMonth: '03',
      expiryYear: '2030',
      cvv: '123',
      brand: 'MASTERCARD',
      installments: 1,
      feePercent: 2.69,
    });

    expect(orderRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'DENIED',
        feeAmount: 3,
        netAmount: 97,
      }),
    );
    expect(result).toMatchObject({ status: 'DENIED', fee: 3, netAmount: 97 });
  });

  it('rejects public payments without a checkout link', async () => {
    await expect(
      service.createPixPayment({ amount: 1000, payerDocument: '12345678901' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('hides a checkout link owned by another merchant', async () => {
    const link = activeCheckoutLink({ userId: 'merchant-2' });
    checkoutService.findById.mockResolvedValue(link);

    await expect(
      service.createPixPayment(
        {
          checkoutLinkId: link.id,
          amount: link.amount,
          payerDocument: '12345678901',
          externalReference: link.externalReference,
        },
        'merchant-1',
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('expires a checkout link before rejecting a payment', async () => {
    const link = activeCheckoutLink({ expiresAt: new Date(Date.now() - 1) });
    checkoutService.findById.mockResolvedValue(link);

    await expect(
      service.createPixPayment({
        checkoutLinkId: link.id,
        amount: link.amount,
        payerDocument: '12345678901',
        externalReference: link.externalReference,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(checkoutService.updateStatus).toHaveBeenCalledWith(link.id, 'EXPIRED');
  });

  it.each([
    [activeCheckoutLink(), { amount: 1000, externalReference: undefined }],
    [activeCheckoutLink(), { amount: undefined, externalReference: 'OVERRIDE' }],
  ])('rejects payload attempts to override checkout constraints', async (link, override) => {
    checkoutService.findById.mockResolvedValue(link);

    await expect(
      service.createPixPayment({
        checkoutLinkId: link.id,
        amount: override.amount ?? link.amount,
        payerDocument: '12345678901',
        externalReference: override.externalReference ?? link.externalReference,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
