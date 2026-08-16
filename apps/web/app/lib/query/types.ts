import type { ApiClient } from '../api/client';
import type { ApiRequestOptions } from '../api/types';

/**
 * Options passed to query creator functions.
 */
export interface DomainQueryOptions {
  client?: ApiClient;
  requestOptions?: ApiRequestOptions;
}
