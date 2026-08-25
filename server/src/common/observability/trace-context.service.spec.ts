import { describe, expect, it } from 'vitest';
import {
  getCurrentTraceId,
  TraceContextService,
} from './trace-context.service';

describe('TraceContextService', () => {
  it('在异步调用链中保留 TraceID 并在结束后清理', async () => {
    const service = new TraceContextService();
    await service.run('trace-12345678', async () => {
      await Promise.resolve();
      expect(getCurrentTraceId()).toBe('trace-12345678');
    });
    expect(getCurrentTraceId()).toBeUndefined();
  });
});
