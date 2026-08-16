import { BranchPayError } from '@lerapay/gateway-sdk';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { GatewayAccount } from '../auth/entities/gateway-account.entity';
import { GATEWAY_REAUTH_REQUIRED } from './gateway-auth.error';
import { GatewayService } from './gateway.service';

describe('GatewayService', () => {
  const repository = {
    findOne: vi.fn(),
    update: vi.fn(),
  };
  let service: GatewayService;

  beforeEach(() => {
    repository.findOne.mockReset();
    repository.update.mockReset().mockResolvedValue({});
    service = new GatewayService(repository as never);
  });

  it('requires a linked account with a merchant token before running an operation', async () => {
    const operation = vi.fn();
    repository.findOne.mockResolvedValue(null);

    await expect(service.withMerchantTokenByUserId('merchant-1', operation)).rejects.toMatchObject({
      response: { error: { code: 'GATEWAY_LINK_REQUIRED' } },
    });

    expect(operation).not.toHaveBeenCalled();
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('invalidates only an expired merchant credential and requires reauthentication', async () => {
    repository.findOne.mockResolvedValue({
      isLinked: true,
      merchantToken: 'expired-token',
      tokenExpiresAt: new Date(Date.now() - 1),
    } satisfies Partial<GatewayAccount>);

    await expect(service.withMerchantTokenByUserId('merchant-1', vi.fn())).rejects.toMatchObject({
      response: { error: { code: GATEWAY_REAUTH_REQUIRED } },
    });

    expect(repository.update).toHaveBeenCalledWith(
      { userId: 'merchant-1' },
      { isLinked: false, merchantToken: null, tokenExpiresAt: null },
    );
  });

  it('passes the linked merchant token to a successful operation without mutation', async () => {
    repository.findOne.mockResolvedValue({
      isLinked: true,
      merchantToken: 'merchant-token',
      tokenExpiresAt: new Date(Date.now() + 60_000),
    } satisfies Partial<GatewayAccount>);
    const operation = vi.fn().mockResolvedValue({ wallet: 'ok' });

    await expect(service.withMerchantTokenByUserId('merchant-1', operation)).resolves.toEqual({
      wallet: 'ok',
    });

    expect(operation).toHaveBeenCalledWith('merchant-token');
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('invalidates a token rejected by the gateway and maps it to reauthentication', async () => {
    repository.findOne.mockResolvedValue({
      isLinked: true,
      merchantToken: 'merchant-token',
      tokenExpiresAt: null,
    } satisfies Partial<GatewayAccount>);

    await expect(
      service.withMerchantTokenByUserId('merchant-1', () =>
        Promise.reject(new BranchPayError('Token expirado', 401)),
      ),
    ).rejects.toMatchObject({
      response: { error: { code: GATEWAY_REAUTH_REQUIRED } },
    });

    expect(repository.update).toHaveBeenCalledWith(
      { userId: 'merchant-1' },
      { isLinked: false, merchantToken: null, tokenExpiresAt: null },
    );
  });

  it('propagates non-token failures without invalidating the credential', async () => {
    const gatewayFailure = new BranchPayError('Gateway indisponível', 503);
    repository.findOne.mockResolvedValue({
      isLinked: true,
      merchantToken: 'merchant-token',
      tokenExpiresAt: null,
    } satisfies Partial<GatewayAccount>);

    await expect(
      service.withMerchantTokenByUserId('merchant-1', () => Promise.reject(gatewayFailure)),
    ).rejects.toBe(gatewayFailure);

    expect(repository.update).not.toHaveBeenCalled();
  });
});
