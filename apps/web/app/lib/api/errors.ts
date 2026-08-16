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
