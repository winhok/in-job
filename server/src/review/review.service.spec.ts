import { NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { ReviewService } from './review.service';

describe('ReviewService', () => {
  const userId = '507f1f77bcf86cd799439011';

  function createService() {
    const resumeModel = {
      findOneAndUpdate: vi.fn(),
      exists: vi.fn(),
    };
    const interviewModel = {
      findOneAndUpdate: vi.fn(),
      exists: vi.fn(),
    };
    const reviewModel = { findOneAndUpdate: vi.fn() };
    return {
      service: new ReviewService(
        resumeModel as never,
        interviewModel as never,
        reviewModel as never,
      ),
      resumeModel,
      interviewModel,
      reviewModel,
    };
  }

  it('报告反馈查询同时绑定用户和结果 ID', async () => {
    const { service, resumeModel, interviewModel } = createService();
    let capturedUpdate: unknown;
    resumeModel.findOneAndUpdate.mockImplementation(
      (_filter: unknown, update: unknown) => {
        capturedUpdate = update;
        return Promise.resolve({ resultId: 'result-1' });
      },
    );
    await service.submitFeedback(userId, 'result-1', {
      rating: 4,
      fair: true,
      comment: '整体准确',
    });
    expect(resumeModel.findOneAndUpdate).toHaveBeenCalledWith(
      { userId, resultId: 'result-1' },
      capturedUpdate,
      { new: true },
    );
    expect(capturedUpdate).toMatchObject({
      $set: { rating: 4, feedbackFair: true },
    });
    expect(interviewModel.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it('不能为其他用户的结果创建人工复核', async () => {
    const { service, resumeModel, interviewModel, reviewModel } =
      createService();
    resumeModel.exists.mockResolvedValue(null);
    interviewModel.exists.mockResolvedValue(null);
    await expect(
      service.requestManualReview(userId, 'private-result', {
        reason: 'unfair',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(reviewModel.findOneAndUpdate).not.toHaveBeenCalled();
  });
});
