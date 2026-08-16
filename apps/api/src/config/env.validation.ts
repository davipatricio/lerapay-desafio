type Environment = Record<string, unknown>;

function parsePositiveInteger(value: unknown, name: string, fallback: number): number {
  if (value === undefined || value === '') {
    return fallback;
  }

  const number = Number(value);
  if (!Number.isInteger(number) || number < 1) {
    throw new Error(`${name} deve ser um número inteiro positivo`);
  }

  return number;
}

function parsePort(value: unknown, name: string, fallback: number): number {
  const port = parsePositiveInteger(value, name, fallback);
  if (port > 65535) {
    throw new Error(`${name} deve ser um número inteiro entre 1 e 65535`);
  }

  return port;
}

export function validateEnvironment(config: Environment): Environment {
  const jwtSecret = typeof config.JWT_SECRET === 'string' ? config.JWT_SECRET.trim() : '';
  if (!jwtSecret) {
    throw new Error('JWT_SECRET deve ser configurada');
  }

  const isProduction = config.NODE_ENV === 'production';
  // Em produção, um segredo curto ou conhecido torna a assinatura de JWT previsível.
  if (
    isProduction &&
    (jwtSecret.length < 32 ||
      jwtSecret === 'change-me-to-a-long-random-secret' ||
      jwtSecret === 'lerapay-baas-dev-secret-key-2026')
  ) {
    throw new Error('JWT_SECRET deve ser um segredo forte e diferente do valor padrão em produção');
  }

  return {
    ...config,
    DB_PORT: parsePort(config.DB_PORT, 'DB_PORT', 3306),
    GATEWAY_TIMEOUT: parsePositiveInteger(config.GATEWAY_TIMEOUT, 'GATEWAY_TIMEOUT', 10_000),
    PORT: parsePort(config.PORT, 'PORT', 3000),
  };
}
