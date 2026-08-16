import { describe, expect, it } from 'vitest';
import { BranchPayError } from '@lerapay/gateway-sdk';
import { isGatewayTokenRejection } from './gateway-auth.error';

describe('isGatewayTokenRejection', () => {
  it.each(['Token inválido', 'Token expirado', 'Invalid token', 'Expired token'])(
    'recognizes a 401 gateway %s error',
    (message) => {
      expect(isGatewayTokenRejection(new BranchPayError(message, 401))).toBe(true);
    },
  );

  it('rejects unrelated status codes, messages, and error types', () => {
    expect(isGatewayTokenRejection(new BranchPayError('Token inválido', 500))).toBe(false);
    expect(isGatewayTokenRejection(new BranchPayError('Credenciais inválidas', 401))).toBe(false);
    expect(isGatewayTokenRejection(new Error('Token expirado'))).toBe(false);
  });
});
