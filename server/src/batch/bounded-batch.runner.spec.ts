import { describe, expect, it } from 'vitest';
import { BoundedBatchRunner } from './bounded-batch.runner';

describe('BoundedBatchRunner', () => {
  it('限制并发并保留输入顺序', async () => {
    const runner = new BoundedBatchRunner();
    let active = 0;
    let maxActive = 0;
    const results = await runner.run(
      [1, 2, 3, 4, 5],
      async (value) => {
        active += 1;
        maxActive = Math.max(maxActive, active);
        await new Promise((resolve) => setTimeout(resolve, 5));
        active -= 1;
        return value * 2;
      },
      2,
    );
    expect(maxActive).toBe(2);
    expect(results.map((result) => result.value)).toEqual([2, 4, 6, 8, 10]);
  });

  it('单项失败不会丢失其他结果', async () => {
    const results = await new BoundedBatchRunner().run(
      ['ok', 'bad', 'still-ok'],
      (value) =>
        value === 'bad'
          ? Promise.reject(new Error('item failed'))
          : Promise.resolve(value),
      3,
    );
    expect(results).toEqual([
      { index: 0, status: 'fulfilled', value: 'ok' },
      { index: 1, status: 'rejected', error: 'item failed' },
      { index: 2, status: 'fulfilled', value: 'still-ok' },
    ]);
  });
});
