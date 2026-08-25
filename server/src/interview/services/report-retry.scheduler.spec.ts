/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { describe, expect, it, vi } from 'vitest';
import { ReportRetryScheduler } from './report-retry.scheduler';

describe('ReportRetryScheduler', () => {
  const createScheduler = (
    due: Array<{ userId: string; resultId: string }>,
    generateAssessmentReport = vi.fn().mockResolvedValue(undefined),
  ) => {
    const lean = vi.fn().mockResolvedValue(due);
    const limit = vi.fn().mockReturnValue({ lean });
    const sort = vi.fn().mockReturnValue({ limit });
    const select = vi.fn().mockReturnValue({ sort });
    const model = {
      updateMany: vi.fn().mockResolvedValue({ modifiedCount: 1 }),
      find: vi.fn().mockReturnValue({ select }),
    };
    const scheduler = new ReportRetryScheduler(
      model as never,
      { generateAssessmentReport } as never,
      { get: vi.fn() } as never,
    );
    return { scheduler, model, generateAssessmentReport };
  };

  it('恢复租约过期任务并处理到期报告', async () => {
    const { scheduler, model, generateAssessmentReport } = createScheduler([
      { userId: 'user-1', resultId: 'result-1' },
    ]);

    await scheduler.tick();

    expect(model.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        reportStatus: 'generating',
        status: 'completed',
        reportLeaseExpiresAt: { $lte: expect.any(Date) },
      }),
      expect.objectContaining({
        $set: expect.objectContaining({ reportStatus: 'failed' }),
      }),
    );
    expect(generateAssessmentReport).toHaveBeenCalledWith('user-1', 'result-1');
  });

  it('单个报告失败不会阻断同批后续报告', async () => {
    const generateAssessmentReport = vi
      .fn()
      .mockRejectedValueOnce(new Error('model unavailable'))
      .mockResolvedValueOnce(undefined);
    const { scheduler } = createScheduler(
      [
        { userId: 'user-1', resultId: 'result-1' },
        { userId: 'user-2', resultId: 'result-2' },
      ],
      generateAssessmentReport,
    );

    await scheduler.tick();

    expect(generateAssessmentReport).toHaveBeenCalledTimes(2);
    expect(generateAssessmentReport).toHaveBeenLastCalledWith(
      'user-2',
      'result-2',
    );
  });
});
