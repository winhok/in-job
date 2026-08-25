import { describe, expect, it, vi } from 'vitest';
import { AiCacheOptions, AiCacheService } from './ai-cache.service';

describe('AiCacheService', () => {
  const options: AiCacheOptions = {
    operation: 'resume_analysis',
    scopeKey: 'user-1',
    provider: 'deepseek',
    model: 'deepseek-chat',
    locale: 'zh-CN',
    promptVersion: 'v1',
    input: { position: '前端', skills: ['Vue', 'TypeScript'] },
  };

  function createService(cachedValue?: unknown) {
    const model = {
      findOneAndUpdate: vi.fn(
        (
          _filter: unknown,
          _update: unknown,
          queryOptions?: { upsert?: boolean },
        ) =>
          Promise.resolve(
            queryOptions?.upsert
              ? {}
              : cachedValue === undefined
                ? null
                : { value: cachedValue },
          ),
      ),
      deleteMany: vi.fn().mockResolvedValue({ deletedCount: 2 }),
    };
    const metrics = { incrementAiCache: vi.fn() };
    return {
      service: new AiCacheService(
        model as never,
        { get: vi.fn() } as never,
        metrics as never,
      ),
      model,
      metrics,
    };
  }

  it('对象键顺序不影响哈希，但用户、locale 和模型会隔离', () => {
    const { service } = createService();
    const reordered = service.createKey({
      ...options,
      input: { skills: ['Vue', 'TypeScript'], position: '前端' },
    });
    expect(reordered).toBe(service.createKey(options));
    expect(service.createKey({ ...options, scopeKey: 'user-2' })).not.toBe(
      reordered,
    );
    expect(service.createKey({ ...options, locale: 'en-US' })).not.toBe(
      reordered,
    );
    expect(service.createKey({ ...options, model: 'gpt-4.1-mini' })).not.toBe(
      reordered,
    );
  });

  it('命中缓存时不执行模型计算', async () => {
    const { service, metrics } = createService({ score: 88 });
    const compute = vi.fn();
    await expect(service.getOrCompute(options, compute)).resolves.toEqual({
      score: 88,
    });
    expect(compute).not.toHaveBeenCalled();
    expect(metrics.incrementAiCache).toHaveBeenCalledWith(
      'resume_analysis',
      'hit',
    );
  });

  it('并发相同请求只计算一次并写入一次', async () => {
    const { service, model } = createService();
    let release: ((value: { score: number }) => void) | undefined;
    const compute = vi.fn(
      () =>
        new Promise<{ score: number }>((resolve) => {
          release = resolve;
        }),
    );
    const first = service.getOrCompute(options, compute);
    const second = service.getOrCompute(options, compute);
    await vi.waitFor(() => expect(compute).toHaveBeenCalledTimes(1));
    release?.({ score: 90 });
    await expect(Promise.all([first, second])).resolves.toEqual([
      { score: 90 },
      { score: 90 },
    ]);
    const upserts = model.findOneAndUpdate.mock.calls.filter(
      (call) => call[2]?.upsert,
    );
    expect(upserts).toHaveLength(1);
  });

  it('计算失败不写缓存', async () => {
    const { service, model } = createService();
    await expect(
      service.getOrCompute(options, () =>
        Promise.reject(new Error('model unavailable')),
      ),
    ).rejects.toThrow('model unavailable');
    expect(
      model.findOneAndUpdate.mock.calls.some((call) => call[2]?.upsert),
    ).toBe(false);
  });
});
