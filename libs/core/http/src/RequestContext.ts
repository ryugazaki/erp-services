import { AsyncLocalStorage } from 'async_hooks';
import { randomUUID } from 'crypto';

interface RequestContextData {
  requestId: string;
}

const asyncLocalStorage = new AsyncLocalStorage<RequestContextData>();

export class RequestContext {
  static run<T>(fn: () => T): T {
    return asyncLocalStorage.run({ requestId: randomUUID() }, fn);
  }

  static getId(): string {
    const store = asyncLocalStorage.getStore();
    return store?.requestId ?? randomUUID();
  }

  static setId(id: string): void {
    const store = asyncLocalStorage.getStore();
    if (store) {
      store.requestId = id;
    }
  }
}
