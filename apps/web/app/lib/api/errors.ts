import type { ApiErrorResponse } from './types';

/**
 * Standardized API client error capturing status codes, correlation IDs, and error envelopes.
 */
export class ApiClientError extends Error {
  public readonly statusCode: number;
  public readonly correlationId?: string;
  public readonly code?: string;
  public readonly details?: unknown;
  public readonly timestamp?: string;
  public readonly path?: string;
  public readonly raw?: unknown;

  constructor(
    message: string,
    options: {
      statusCode?: number;
      correlationId?: string;
      code?: string;
      details?: unknown;
      timestamp?: string;
      path?: string;
      raw?: unknown;
    } = {},
  ) {
    super(message);
    this.name = 'ApiClientError';
    this.statusCode = options.statusCode ?? 500;
    this.correlationId = options.correlationId;
    this.code = options.code;
    this.details = options.details;
    this.timestamp = options.timestamp;
    this.path = options.path;
    this.raw = options.raw;
  }
}

export function isApiClientError(
  error: unknown,
  options: { statusCode?: number; code?: string; path?: string } = {},
): error is ApiClientError {
  if (!(error instanceof ApiClientError)) return false;
  if (options.statusCode !== undefined && error.statusCode !== options.statusCode) return false;
  if (options.code !== undefined && error.code !== options.code) return false;
  if (options.path !== undefined && error.path !== options.path) return false;
  return true;
}

export function isGatewayReauthError(error: unknown): boolean {
  if (!(error instanceof ApiClientError)) return false;
  if (error.code === 'GATEWAY_REAUTH_REQUIRED') return true;

  const message = error.message.toLowerCase();
  return (
    error.statusCode === 401 &&
    message.includes('token') &&
    (message.includes('inválido') || message.includes('expirado')) &&
    !message.includes('autenticação')
  );
}

export function isLocalSessionExpiredError(error: unknown): boolean {
  if (!(error instanceof ApiClientError)) return false;
  if (isGatewayReauthError(error)) return false;
  return error.statusCode === 401;
}

/**
 * Normalizes any caught error (ofetch FetchError, Error, or API JSON response) into an ApiClientError.
 */
export function parseApiError(error: unknown): ApiClientError {
  if (error instanceof ApiClientError) {
    return error;
  }

  const anyErr = error as Record<string, any> | undefined;
  const responseData = (anyErr?.data || anyErr?.response?._data) as ApiErrorResponse | undefined;
  const status = anyErr?.statusCode ?? anyErr?.status ?? anyErr?.response?.status ?? 500;

  const correlationId =
    responseData?.correlationId ||
    anyErr?.response?.headers?.get?.('x-correlation-id') ||
    undefined;

  let message = 'An unexpected API error occurred';
  let code: string | undefined;
  let details: unknown;
  let timestamp = responseData?.timestamp;
  let path = responseData?.path;

  if (responseData) {
    if (typeof responseData.error === 'object' && responseData.error !== null) {
      code = responseData.error.code;
      message = responseData.error.message || message;
      details = responseData.error.details;
    } else if (typeof responseData.message === 'string') {
      message = responseData.message;
    } else if (Array.isArray(responseData.message)) {
      message = responseData.message.join(', ');
    }
  } else if (typeof anyErr?.message === 'string') {
    message = anyErr.message;
  }

  return new ApiClientError(message, {
    statusCode: status,
    correlationId,
    code,
    details,
    timestamp,
    path,
    raw: responseData || error,
  });
}
