import { describe, expect, it } from 'vitest';
import { ApiClientError, getErrorPresentation, parseApiError } from './errors';

/** Builds an ofetch-shaped failure, the form these helpers actually receive at runtime. */
function fetchError(statusCode: number, data?: Record<string, unknown>): Record<string, unknown> {
  return { statusCode, data, message: `HTTP ${statusCode}` };
}

describe('getErrorPresentation', () => {
  it('treats server failures as retryable', () => {
    const presentation = getErrorPresentation(fetchError(500));

    expect(presentation.title).toBe('Não foi possível carregar estas informações');
    expect(presentation.retryable).toBe(true);
  });

  it('treats an unknown non-API error as a retryable server failure', () => {
    const presentation = getErrorPresentation(new Error('socket hang up'));

    expect(presentation.retryable).toBe(true);
    expect(presentation.message).toContain('conexão');
  });

  it('asks the merchant to sign in again when the local session expired', () => {
    const presentation = getErrorPresentation(
      fetchError(401, { message: 'Falha na autenticação' }),
    );

    expect(presentation.title).toBe('Sua sessão expirou');
    expect(presentation.retryable).toBe(false);
  });

  it('asks the merchant to reconnect the gateway when the code says so', () => {
    const presentation = getErrorPresentation(
      fetchError(401, { error: { code: 'GATEWAY_REAUTH_REQUIRED', message: 'reauth' } }),
    );

    expect(presentation.title).toBe('Reconecte o gateway');
    expect(presentation.retryable).toBe(false);
  });

  it('detects gateway reauth from a token message even without the code', () => {
    const presentation = getErrorPresentation(
      fetchError(401, { message: 'Token do gateway expirado' }),
    );

    expect(presentation.title).toBe('Reconecte o gateway');
  });

  it('prefers gateway reauth over local session expiry when both could match', () => {
    const presentation = getErrorPresentation(
      fetchError(401, { error: { code: 'GATEWAY_REAUTH_REQUIRED', message: 'token inválido' } }),
    );

    expect(presentation.title).toBe('Reconecte o gateway');
  });

  it('reports a permission problem for 403 and does not invite a retry', () => {
    const presentation = getErrorPresentation(fetchError(403));

    expect(presentation.title).toBe('Acesso não autorizado');
    expect(presentation.retryable).toBe(false);
  });

  it('asks the merchant to revise the form for business-rule failures', () => {
    const presentation = getErrorPresentation(
      fetchError(422, { message: 'amount must be a positive integer' }),
    );

    expect(presentation.title).toBe('Não foi possível concluir a operação');
    expect(presentation.retryable).toBe(false);
  });

  it('surfaces the correlation ID so support can trace the request', () => {
    const presentation = getErrorPresentation(fetchError(500, { correlationId: 'corr-123' }));

    expect(presentation.correlationId).toBe('corr-123');
  });

  it('omits the correlation ID when the response carries none', () => {
    expect(getErrorPresentation(fetchError(500)).correlationId).toBeUndefined();
  });

  it('never leaks raw server messages, internal paths, or payload details', () => {
    const presentation = getErrorPresentation(
      fetchError(400, {
        error: {
          code: 'DB_CONSTRAINT',
          message: "Duplicate entry 'x' for key 'users.email_unique'",
          details: { query: 'SELECT * FROM users', secret: 'hunter2' },
        },
        path: '/api/internal/merchants',
      }),
    );

    const rendered = `${presentation.title} ${presentation.message}`;
    expect(rendered).not.toContain('Duplicate entry');
    expect(rendered).not.toContain('SELECT');
    expect(rendered).not.toContain('hunter2');
    expect(rendered).not.toContain('/api/internal');
  });

  it('reuses an already-normalized ApiClientError without re-wrapping it', () => {
    const presentation = getErrorPresentation(
      new ApiClientError('boom', { statusCode: 403, correlationId: 'corr-abc' }),
    );

    expect(presentation.title).toBe('Acesso não autorizado');
    expect(presentation.correlationId).toBe('corr-abc');
  });
});

describe('parseApiError', () => {
  it('defaults to 500 when no status can be determined', () => {
    expect(parseApiError({}).statusCode).toBe(500);
  });

  it('joins array validation messages from the API envelope', () => {
    const error = parseApiError(
      fetchError(400, { message: ['amount is required', 'title is required'] }),
    );

    expect(error.message).toBe('amount is required, title is required');
  });

  it('keeps the error code and details for programmatic handling', () => {
    const error = parseApiError(
      fetchError(409, { error: { code: 'ALREADY_LINKED', message: 'linked', details: { id: 1 } } }),
    );

    expect(error.code).toBe('ALREADY_LINKED');
    expect(error.details).toEqual({ id: 1 });
  });
});
