import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockedOfetch } = vi.hoisted(() => ({ mockedOfetch: vi.fn() }));

vi.mock('ofetch', () => ({ ofetch: mockedOfetch }));

import { BranchPayClient } from './client';
import { BranchPayError } from './errors';

describe('BranchPayClient', () => {
  beforeEach(() => {
    mockedOfetch.mockResolvedValue({ success: true });
  });

  it('normalizes the URL and sends the default token and timeout', async () => {
    const client = new BranchPayClient({
      baseUrl: 'https://gateway.example/api/',
      token: 'merchant-token',
      timeout: 2500,
    });

    await client.login({ document: '12345678901', password: 'secret' });

    expect(mockedOfetch).toHaveBeenCalledWith('https://gateway.example/api/auth/login', {
      method: 'POST',
      body: { document: '12345678901', password: 'secret' },
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer merchant-token',
      },
      timeout: 2500,
      responseType: 'json',
    });
  });

  it('uses a call-specific token instead of the stored token', async () => {
    const client = new BranchPayClient({ token: 'stored-token' });

    await client.getWallet('request-token');

    expect(mockedOfetch).toHaveBeenCalledWith(
      'https://api.branchpay.com.br/api/wallet',
      expect.objectContaining({
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer request-token',
        },
      }),
    );
  });

  it('omits authorization when no token exists and updates a changed stored token', async () => {
    const client = new BranchPayClient();

    await client.getFees();
    expect(mockedOfetch).toHaveBeenLastCalledWith(
      'https://api.branchpay.com.br/api/fees',
      expect.objectContaining({ headers: { 'Content-Type': 'application/json' } }),
    );

    client.setToken('new-token');
    await client.getMe();

    expect(client.getToken()).toBe('new-token');
    expect(mockedOfetch).toHaveBeenLastCalledWith(
      'https://api.branchpay.com.br/api/users/me',
      expect.objectContaining({
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer new-token',
        },
      }),
    );
  });

  it('serializes class-instance DTOs as JSON-compatible plain objects', async () => {
    class WebhookDto {
      public event = 'PAYMENT_PIX' as const;
      public url = 'https://merchant.example/webhooks/pix';
      public secret = 'webhook-secret';
    }

    const client = new BranchPayClient({ baseUrl: 'https://gateway.example/api' });
    await client.upsertWebhook(new WebhookDto());

    expect(mockedOfetch).toHaveBeenCalledWith(
      'https://gateway.example/api/webhooks',
      expect.objectContaining({
        body: {
          event: 'PAYMENT_PIX',
          url: 'https://merchant.example/webhooks/pix',
          secret: 'webhook-secret',
        },
      }),
    );
  });

  it('maps representative methods to their gateway contracts', async () => {
    const client = new BranchPayClient({ baseUrl: 'https://gateway.example/api' });
    const pixDto = {
      amount: 1099,
      description: 'Pedido #1',
      payerDocument: '12345678901',
      externalReference: 'ORDER-1',
    };

    await client.getFees({ brand: 'VISA' });
    await client.createPixPayment(pixDto, 'merchant-token');
    await client.listTransactions({ status: 'APPROVED', type: 'PIX', limit: 10 }, 'merchant-token');
    await client.deleteWebhook('webhook-1', 'merchant-token');

    expect(mockedOfetch).toHaveBeenNthCalledWith(
      1,
      'https://gateway.example/api/fees',
      expect.objectContaining({ method: 'GET', query: { brand: 'VISA' } }),
    );
    expect(mockedOfetch).toHaveBeenNthCalledWith(
      2,
      'https://gateway.example/api/payments/pix',
      expect.objectContaining({
        method: 'POST',
        body: pixDto,
        headers: expect.objectContaining({ Authorization: 'Bearer merchant-token' }),
      }),
    );
    expect(mockedOfetch).toHaveBeenNthCalledWith(
      3,
      'https://gateway.example/api/wallet/transactions',
      expect.objectContaining({
        method: 'GET',
        query: { status: 'APPROVED', type: 'PIX', limit: 10 },
      }),
    );
    expect(mockedOfetch).toHaveBeenNthCalledWith(
      4,
      'https://gateway.example/api/webhooks/webhook-1',
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

  it('normalizes both supported fee response shapes', async () => {
    const client = new BranchPayClient();
    const fees = [{ brand: 'VISA', installments: 1, feePercent: 2.5 }];

    mockedOfetch
      .mockResolvedValueOnce(fees)
      .mockResolvedValueOnce({ fees })
      .mockResolvedValueOnce({});

    await expect(client.getFees()).resolves.toEqual(fees);
    await expect(client.getFees()).resolves.toEqual(fees);
    await expect(client.getFees()).resolves.toEqual([]);
  });

  it('translates HTTP-shaped gateway errors into BranchPayError', async () => {
    const client = new BranchPayClient();
    const data = { message: 'Token expirado', code: 'TOKEN_EXPIRED' };
    mockedOfetch.mockRejectedValue({ response: { status: 401, _data: data } });

    await expect(client.getWallet()).rejects.toMatchObject({
      name: 'BranchPayError',
      message: 'Token expirado',
      status: 401,
      data,
      code: 'TOKEN_EXPIRED',
    } satisfies Partial<BranchPayError>);
  });

  it('maps transport failures to a status-500 BranchPayError', async () => {
    const client = new BranchPayClient();
    mockedOfetch.mockRejectedValue(new Error('Connection reset'));

    await expect(client.getWallet()).rejects.toMatchObject({
      name: 'BranchPayError',
      message: 'Connection reset',
      status: 500,
    } satisfies Partial<BranchPayError>);
  });
});
