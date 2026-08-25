import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'node:async_hooks';

const traceStorage = new AsyncLocalStorage<{ traceId: string }>();

export function getCurrentTraceId(): string | undefined {
  return traceStorage.getStore()?.traceId;
}

@Injectable()
export class TraceContextService {
  run<T>(traceId: string, callback: () => T): T {
    return traceStorage.run({ traceId }, callback);
  }

  getTraceId(): string | undefined {
    return getCurrentTraceId();
  }
}
