import { BadRequestException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WebhooksService } from './webhooks.service';

const paymentPayload = {
  event: 'PAYMENT_PIX' as const,
  status: 'APPROVED' as const,
  transactionId: 'payment-1',
  externalReference: 'ORDER-1',
};

describe('WebhooksService', () => {
  const webhookEventRepository = { findOne: vi.fn(), create: vi.fn(), save: vi.fn() };
  const orderRepository = { findOne: vi.fn(), save: vi.fn() };
  const transactionRepository = { findOne: vi.fn(), save: vi.fn() };
  const withdrawalRepository = { findOne: vi.fn(), save: vi.fn() };
  const gatewayService = {
    withMerchantToken: vi.fn(),
    upsertWebhook: vi.fn(),
    listWebhooks: vi.fn(),
    deleteWebhook: vi.fn(),
    verifyWebhookSignature: vi.fn(),
  };
  const checkoutService = { updateStatus: vi.fn() };
  const configService = { get: vi.fn() };
  let service: WebhooksService;

  beforeEach(() => {
    for (const mock of [
      webhookEventRepository.findOne,
      webhookEventRepository.create,
      webhookEventRepository.save,
      orderRepository.findOne,
      orderRepository.save,
      transactionRepository.findOne,
      transactionRepository.save,
      withdrawalRepository.findOne,
      withdrawalRepository.save,
      gatewayService.verifyWebhookSignature,
      checkoutService.updateStatus,
      configService.get,
    ]) {
      mock.mockReset();
    }

    webhookEventRepository.create.mockImplementation((value) => value);
    webhookEventRepository.save.mockResolvedValue(undefined);
    webhookEventRepository.findOne.mockResolvedValue(null);
    configService.get.mockReturnValue(undefined);
    service = new WebhooksService(
      webhookEventRepository as never,
      orderRepository as never,
      transactionRepository as never,
      withdrawalRepository as never,
      gatewayService as never,
      checkoutService as never,
      configService as never,
    );
  });

  it.each([
    [undefined, '{"event":"PAYMENT_PIX"}', 'Assinatura de webhook ausente'],
    ['signature', undefined, 'Corpo bruto ausente para validação de assinatura'],
  ])(
    'rejects missing webhook authentication before persistence',
    async (signature, rawBody, message) => {
      configService.get.mockReturnValue('webhook-secret');

      await expect(
        service.handleIncomingWebhook(paymentPayload, signature, rawBody),
      ).rejects.toThrow(message);

      expect(webhookEventRepository.findOne).not.toHaveBeenCalled();
      expect(webhookEventRepository.save).not.toHaveBeenCalled();
    },
  );

  it('rejects an invalid HMAC before any repository mutation', async () => {
    configService.get.mockReturnValue('webhook-secret');
    gatewayService.verifyWebhookSignature.mockResolvedValue(false);

    await expect(
      service.handleIncomingWebhook(paymentPayload, 'invalid-signature', '{"event":"PAYMENT_PIX"}'),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(gatewayService.verifyWebhookSignature).toHaveBeenCalledWith(
      '{"event":"PAYMENT_PIX"}',
      'invalid-signature',
      'webhook-secret',
    );
    expect(webhookEventRepository.findOne).not.toHaveBeenCalled();
    expect(webhookEventRepository.save).not.toHaveBeenCalled();
  });

  it('ignores an event that was already processed without further writes', async () => {
    webhookEventRepository.findOne.mockResolvedValue({ id: 'event-1' });

    await expect(service.handleIncomingWebhook(paymentPayload)).resolves.toEqual({
      received: true,
      message: 'Já processado',
    });

    expect(orderRepository.save).not.toHaveBeenCalled();
    expect(transactionRepository.save).not.toHaveBeenCalled();
    expect(withdrawalRepository.save).not.toHaveBeenCalled();
    expect(webhookEventRepository.save).not.toHaveBeenCalled();
  });

  it('reconciles an approved payment, completes its checkout, and records success', async () => {
    const order = { id: 'order-1', status: 'PENDING', checkoutLinkId: 'checkout-1' };
    const transaction = { id: 'transaction-1', status: 'PENDING' };
    orderRepository.findOne.mockResolvedValue(order);
    transactionRepository.findOne.mockResolvedValue(transaction);

    await expect(service.handleIncomingWebhook(paymentPayload)).resolves.toEqual({
      received: true,
    });

    expect(order).toMatchObject({ status: 'APPROVED' });
    expect(transaction).toMatchObject({ status: 'APPROVED' });
    expect(checkoutService.updateStatus).toHaveBeenCalledWith('checkout-1', 'COMPLETED');
    expect(webhookEventRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ eventId: 'PAYMENT_PIX-payment-1-APPROVED', status: 'PROCESSED' }),
    );
  });

  it.each([
    ['APPROVED', 'COMPLETED', 'APPROVED'],
    ['DENIED', 'FAILED', 'DENIED'],
  ] as const)(
    'maps withdrawal %s status to %s',
    async (status, withdrawalStatus, transactionStatus) => {
      const withdrawal = { id: 'withdrawal-1', status: 'PENDING' };
      const transaction = { id: 'transaction-1', status: 'PENDING' };
      withdrawalRepository.findOne.mockResolvedValue(withdrawal);
      transactionRepository.findOne.mockResolvedValue(transaction);

      await service.handleIncomingWebhook({
        event: 'WITHDRAWAL',
        status,
        transactionId: 'withdrawal-1',
      });

      expect(withdrawal).toMatchObject({ status: withdrawalStatus });
      expect(transaction).toMatchObject({ status: transactionStatus });
    },
  );

  it('records one failed event and rethrows a reconciliation failure', async () => {
    orderRepository.findOne.mockRejectedValue(new Error('database unavailable'));

    await expect(service.handleIncomingWebhook(paymentPayload)).rejects.toThrow(
      'database unavailable',
    );

    expect(webhookEventRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'FAILED', error: 'database unavailable' }),
    );
    expect(webhookEventRepository.save).toHaveBeenCalledTimes(1);
  });
});
