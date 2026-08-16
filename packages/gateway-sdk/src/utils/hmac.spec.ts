import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { verifyWebhookSignature } from './hmac';

function sign(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('hex');
}

describe('verifyWebhookSignature', () => {
  it('accepts valid HMAC signatures with or without the sha256 prefix', async () => {
    const payload = '{"event":"PAYMENT_PIX","status":"APPROVED"}';
    const signature = sign(payload, 'webhook-secret');

    await expect(
      verifyWebhookSignature(payload, signature.toUpperCase(), 'webhook-secret'),
    ).resolves.toBe(true);
    await expect(
      verifyWebhookSignature(payload, `sha256=${signature}`, 'webhook-secret'),
    ).resolves.toBe(true);
  });

  it('serializes object payloads consistently before validation', async () => {
    const payload = { event: 'PAYMENT_CARD', transactionId: 'txn-1' };
    const signature = sign(JSON.stringify(payload), 'webhook-secret');

    await expect(verifyWebhookSignature(payload, signature, 'webhook-secret')).resolves.toBe(true);
  });

  it('rejects altered inputs and empty authentication values', async () => {
    const payload = '{"event":"PAYMENT_PIX"}';
    const signature = sign(payload, 'webhook-secret');

    await expect(verifyWebhookSignature(`${payload}!`, signature, 'webhook-secret')).resolves.toBe(
      false,
    );
    await expect(verifyWebhookSignature(payload, signature, 'other-secret')).resolves.toBe(false);
    await expect(verifyWebhookSignature(payload, '', 'webhook-secret')).resolves.toBe(false);
    await expect(verifyWebhookSignature(payload, signature, '')).resolves.toBe(false);
  });
});
