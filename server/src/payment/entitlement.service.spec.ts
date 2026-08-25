import { BadRequestException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { ExchangePackageType } from './dto/payment.dto';
import { EntitlementService } from './entitlement.service';

describe('EntitlementService', () => {
  const userId = '507f1f77bcf86cd799439011';

  it('余额条件和权益增加在同一个原子更新中完成', async () => {
    const userModel = {
      findOneAndUpdate: vi.fn().mockResolvedValue({
        wwCoinBalance: 5,
        resumeRemainingCount: 2,
      }),
    };
    const transactionModel = {
      create: vi.fn().mockResolvedValue({}),
      findOneAndUpdate: vi.fn().mockResolvedValue({}),
    };
    const service = new EntitlementService(
      userModel as never,
      transactionModel as never,
    );

    await service.exchangePackage(userId, ExchangePackageType.RESUME);
    expect(userModel.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: userId, wwCoinBalance: { $gte: 20 } },
      { $inc: { wwCoinBalance: -20, resumeRemainingCount: 1 } },
      { new: true },
    );
  });

  it('余额不足时把预创建流水标记为失败', async () => {
    const userModel = { findOneAndUpdate: vi.fn().mockResolvedValue(null) };
    let failedTransactionFilter: unknown;
    const transactionModel = {
      create: vi.fn().mockResolvedValue({}),
      findOneAndUpdate: vi.fn((filter: unknown) => {
        failedTransactionFilter = filter;
        return Promise.resolve({});
      }),
    };
    const service = new EntitlementService(
      userModel as never,
      transactionModel as never,
    );

    await expect(
      service.exchangePackage(userId, ExchangePackageType.SPECIAL),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(failedTransactionFilter).toBeTypeOf('object');
    const relatedOrderId = (failedTransactionFilter as Record<string, unknown>)
      .relatedOrderId;
    if (typeof relatedOrderId !== 'string') {
      throw new TypeError('relatedOrderId should be a string');
    }
    expect(relatedOrderId).toMatch(/^exchange:/);
  });

  it('分享奖励使用用户条件更新保证只能领取一次', async () => {
    const userModel = {
      findOneAndUpdate: vi.fn().mockResolvedValue({
        wwCoinBalance: 25,
        shareRewardClaimedAt: new Date(),
      }),
    };
    const transactionModel = {
      findOneAndUpdate: vi.fn().mockResolvedValue({}),
    };
    const service = new EntitlementService(
      userModel as never,
      transactionModel as never,
    );

    await expect(service.claimShareReward(userId)).resolves.toMatchObject({
      success: true,
      reward: 5,
      wwCoinBalance: 25,
    });
    expect(userModel.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: userId, shareRewardClaimedAt: { $exists: false } },
      expect.objectContaining({ $inc: { wwCoinBalance: 5 } }),
      { new: true },
    );
    expect(transactionModel.findOneAndUpdate).toHaveBeenCalledWith(
      { relatedOrderId: `share-reward:${userId}` },
      expect.any(Object),
      { upsert: true, new: true },
    );
  });

  it('已领取分享奖励时拒绝重复增加余额', async () => {
    const userModel = { findOneAndUpdate: vi.fn().mockResolvedValue(null) };
    const transactionModel = { findOneAndUpdate: vi.fn() };
    const service = new EntitlementService(
      userModel as never,
      transactionModel as never,
    );
    await expect(service.claimShareReward(userId)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(transactionModel.findOneAndUpdate).not.toHaveBeenCalled();
  });
});
