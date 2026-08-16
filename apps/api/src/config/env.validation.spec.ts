import { describe, expect, it } from 'vitest';
import { validateEnvironment } from './env.validation';

describe('validateEnvironment', () => {
  const developmentConfig = { JWT_SECRET: 'development-secret' };

  it('applies development defaults', () => {
    expect(validateEnvironment(developmentConfig)).toMatchObject({
      DB_PORT: 3306,
      GATEWAY_TIMEOUT: 10_000,
      PORT: 3000,
    });
  });

  it('converts numeric configuration strings', () => {
    expect(
      validateEnvironment({
        ...developmentConfig,
        DB_PORT: '3307',
        GATEWAY_TIMEOUT: '5000',
        PORT: '3100',
      }),
    ).toMatchObject({ DB_PORT: 3307, GATEWAY_TIMEOUT: 5000, PORT: 3100 });
  });

  it.each([
    [{}, 'JWT_SECRET deve ser configurada'],
    [{ ...developmentConfig, DB_PORT: '0' }, 'DB_PORT deve ser um número inteiro positivo'],
    [{ ...developmentConfig, PORT: '65536' }, 'PORT deve ser um número inteiro entre 1 e 65535'],
  ])('rejects invalid configuration %#', (config, message) => {
    expect(() => validateEnvironment(config)).toThrow(message);
  });

  it('requires a strong, non-default JWT secret in production', () => {
    expect(() =>
      validateEnvironment({
        NODE_ENV: 'production',
        JWT_SECRET: 'change-me-to-a-long-random-secret',
      }),
    ).toThrow('JWT_SECRET deve ser um segredo forte e diferente do valor padrão em produção');

    expect(
      validateEnvironment({
        NODE_ENV: 'production',
        JWT_SECRET: 'a-strong-production-secret-with-at-least-thirty-two-characters',
      }),
    ).toMatchObject({ PORT: 3000 });
  });
});
