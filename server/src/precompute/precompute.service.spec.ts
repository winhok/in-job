/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument */
import { describe, expect, it, vi } from 'vitest';
import { BoundedBatchRunner } from '../batch/bounded-batch.runner';
import { PrecomputeService } from './precompute.service';

const queryFor = <T>(value: T) => ({
  sort: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  lean: vi.fn().mockResolvedValue(value),
});

describe('PrecomputeService', () => {
  it('按岗位与语言生成持久批任务条目', async () => {
    const positions = [
      { positionKey: 'frontend', names: {}, jobDescriptions: {} },
      { positionKey: 'backend', names: {}, jobDescriptions: {} },
    ];
    const positionModel = {
      find: vi.fn().mockReturnValue(queryFor(positions)),
    };
    const save = vi.fn().mockImplementation(function (this: unknown) {
      return Promise.resolve(this);
    });
    const BatchModel = vi.fn(function (this: Record<string, unknown>, value) {
      Object.assign(this, value, { save });
    });
    const service = new PrecomputeService(
      positionModel as never,
      {} as never,
      BatchModel as never,
      new BoundedBatchRunner(),
      {} as never,
      { get: vi.fn() } as never,
    );

    const result = await service.createBatch('admin-1', {
      positionKeys: ['frontend', 'backend'],
      locales: ['zh-CN', 'en-US'],
    });

    expect(result.items).toEqual([
      { positionKey: 'frontend', locale: 'zh-CN' },
      { positionKey: 'frontend', locale: 'en-US' },
      { positionKey: 'backend', locale: 'zh-CN' },
      { positionKey: 'backend', locale: 'en-US' },
    ]);
    expect(result.totalItems).toBe(4);
    expect(save).toHaveBeenCalledOnce();
  });

  it('批任务逐项隔离失败并保存 partial 结果', async () => {
    const job = {
      jobId: 'job-1',
      items: [
        { positionKey: 'frontend', locale: 'zh-CN' as const },
        { positionKey: 'frontend', locale: 'en-US' as const },
      ],
    };
    const finalUpdate = vi.fn().mockResolvedValue({});
    const batchModel = {
      exists: vi.fn().mockResolvedValue(false),
      findOneAndUpdate: vi
        .fn()
        .mockResolvedValueOnce(job)
        .mockImplementation(finalUpdate),
      findOne: vi.fn().mockResolvedValue({ cancelRequested: false }),
    };
    const makePosition = (positionKey: string) => ({
      positionKey,
      names: { 'zh-CN': positionKey, 'en-US': positionKey },
      jobDescriptions: { 'zh-CN': '岗位要求', 'en-US': 'Role requirements' },
      refreshHours: 24,
      save: vi.fn().mockResolvedValue(undefined),
    });
    const positionModel = {
      exists: vi.fn().mockResolvedValue(false),
      findOne: vi.fn(({ positionKey }) =>
        Promise.resolve(makePosition(positionKey)),
      ),
    };
    const questionSave = vi.fn().mockImplementation(function (this: unknown) {
      return Promise.resolve(this);
    });
    const QuestionModel = vi.fn(function (
      this: Record<string, unknown>,
      value,
    ) {
      Object.assign(this, value, { save: questionSave });
    });
    const aiService = {
      generateResumeQuizQuestionsOnly: vi
        .fn()
        .mockResolvedValueOnce({ questions: [{ question: 'Q' }], summary: 'S' })
        .mockRejectedValueOnce(new Error('model unavailable')),
    };
    const service = new PrecomputeService(
      positionModel as never,
      QuestionModel as never,
      batchModel as never,
      new BoundedBatchRunner(),
      aiService as never,
      { get: vi.fn() } as never,
    );

    await service.tick();

    expect(finalUpdate).toHaveBeenCalledWith(
      { jobId: 'job-1', leaseOwner: expect.any(String) },
      expect.objectContaining({
        $set: expect.objectContaining({
          status: 'partial',
          completedItems: 1,
          failedItems: 1,
        }),
      }),
    );
  });
});
