export interface RequestContextStore {
  correlationId: string;
  userId?: string;
  token?: string;
  ip?: string;
  method?: string;
  path?: string;
  [key: string]: unknown;
}
