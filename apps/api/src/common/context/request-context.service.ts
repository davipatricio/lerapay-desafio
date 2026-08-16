import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'node:async_hooks';
import type { RequestContextStore } from './request-context.types';

@Injectable()
export class RequestContextService {
  private static readonly storage = new AsyncLocalStorage<RequestContextStore>();

  public run<R>(store: RequestContextStore, callback: () => R): R {
    return RequestContextService.storage.run(store, callback);
  }

  public getStore(): RequestContextStore | undefined {
    return RequestContextService.storage.getStore();
  }

  public getCorrelationId(): string | undefined {
    return this.getStore()?.correlationId;
  }

  public getUserId(): string | undefined {
    return this.getStore()?.userId;
  }

  public setUserId(userId: string): void {
    this.set('userId', userId);
  }

  public getToken(): string | undefined {
    return this.getStore()?.token;
  }

  public setToken(token: string): void {
    this.set('token', token);
  }

  public get<K extends keyof RequestContextStore>(key: K): RequestContextStore[K] | undefined {
    const store = this.getStore();
    return store ? store[key] : undefined;
  }

  public set<K extends keyof RequestContextStore>(key: K, value: RequestContextStore[K]): void {
    const store = this.getStore();
    if (store) {
      store[key] = value;
    }
  }
}
