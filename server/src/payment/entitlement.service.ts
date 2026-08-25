import { BadRequestException, Injectable, Optional } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { randomUUID } from 'node:crypto';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../user/schemas/user.schema';
import { ExchangePackageType } from './dto/payment.dto';
import {
  UserTransaction,
  UserTransactionDocument,
  UserTransactionType,
} from './schemas/user-transaction.schema';
import { MetricsService } from '../common/metrics/metrics.service';

@Injectable()
export class EntitlementService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(UserTransaction.name)
    private readonly transactionModel: Model<UserTransactionDocument>,
    @Optional() private readonly metrics?: MetricsService,
  ) {}

  async exchangePackage(userId: string, packageType: ExchangePackageType) {
    const fields = {
      resume: ['resumeRemainingCount', '简历押题'],
      special: ['specialRemainingCount', '专项面试'],
      behavior: ['behaviorRemainingCount', '行测+HR面试'],
    } as const;
    const [countField, packageName] = fields[packageType];
    const relatedOrderId = `exchange:${randomUUID()}`;
    await this.transactionModel.create({
      relatedOrderId,
      user: new Types.ObjectId(userId),
      userIdentifier: userId,
      type: UserTransactionType.EXPENSE,
      amount: 20,
      currency: 'WWB',
      description: `兑换${packageName}`,
      source: 'wwb_exchange',
      status: 'pending',
      metadata: { packageType },
    });
    const updated = await this.userModel.findOneAndUpdate(
      { _id: userId, wwCoinBalance: { $gte: 20 } },
      { $inc: { wwCoinBalance: -20, [countField]: 1 } },
      { new: true },
    );
    if (!updated) {
      await this.transactionModel.findOneAndUpdate(
        { relatedOrderId },
        { $set: { status: 'failed' } },
      );
      this.metrics?.incrementBusiness('wwb_exchange', 'error');
      throw new BadRequestException('旺旺币余额不足，需要 20 旺旺币');
    }
    await this.transactionModel.findOneAndUpdate(
      { relatedOrderId },
      { $set: { status: 'success' } },
    );
    this.metrics?.incrementBusiness('wwb_exchange', 'success');
    this.metrics?.virtualCoinSpent.inc({ package_type: packageType }, 20);
    return {
      success: true,
      message: `兑换成功！您已兑换 1 次${packageName}`,
      remainingWWCoin: updated.wwCoinBalance,
      remainingCount: updated[countField],
      packageType,
      packageName,
      exchangeCost: 20,
      exchangeCount: 1,
    };
  }

  async claimShareReward(userId: string) {
    const claimedAt = new Date();
    const updated = await this.userModel.findOneAndUpdate(
      { _id: userId, shareRewardClaimedAt: { $exists: false } },
      {
        $inc: { wwCoinBalance: 5 },
        $set: { shareRewardClaimedAt: claimedAt },
      },
      { new: true },
    );
    if (!updated) {
      this.metrics?.incrementBusiness('share_reward', 'error');
      throw new BadRequestException('分享奖励已经领取过了');
    }
    await this.transactionModel.findOneAndUpdate(
      { relatedOrderId: `share-reward:${userId}` },
      {
        $setOnInsert: {
          relatedOrderId: `share-reward:${userId}`,
          user: new Types.ObjectId(userId),
          userIdentifier: userId,
          type: UserTransactionType.REWARD,
          amount: 5,
          currency: 'WWB',
          description: '首次分享奖励',
          source: 'profile_share',
        },
        $set: { status: 'success' },
      },
      { upsert: true, new: true },
    );
    this.metrics?.incrementBusiness('share_reward', 'success');
    return {
      success: true,
      reward: 5,
      wwCoinBalance: updated.wwCoinBalance,
      claimedAt,
    };
  }
}
