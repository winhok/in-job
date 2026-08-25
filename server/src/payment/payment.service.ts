import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../user/schemas/user.schema';
import { InitiatePaymentDto, QueryPaymentStatusDto } from './dto/payment.dto';
import { PAYMENT_PLANS, PaymentPlan } from './payment.catalog';
import {
  PaymentChannel,
  PaymentProvider,
  PaymentQueryResult,
} from './payment.types';
export type { PaymentRecordContext } from './payment.types';
import { AlipayPaymentService } from './providers/alipay-payment.service';
import { WechatPaymentService } from './providers/wechat-payment.service';
import { TestPaymentService } from './providers/test-payment.service';
import {
  PaymentRecord,
  PaymentRecordDocument,
  PaymentRecordStatus,
} from './schemas/payment-record.schema';
import {
  UserTransaction,
  UserTransactionDocument,
  UserTransactionType,
} from './schemas/user-transaction.schema';
import { MetricsService } from '../common/metrics/metrics.service';

@Injectable()
export class PaymentService {
  constructor(
    @InjectModel(PaymentRecord.name)
    private readonly paymentModel: Model<PaymentRecordDocument>,
    @InjectModel(UserTransaction.name)
    private readonly transactionModel: Model<UserTransactionDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly alipay: AlipayPaymentService,
    private readonly wechat: WechatPaymentService,
    private readonly testPayment: TestPaymentService,
    private readonly configService: ConfigService,
    @Optional() private readonly metrics?: MetricsService,
  ) {}

  async initiatePayment(userId: string, dto: InitiatePaymentDto) {
    if (!Types.ObjectId.isValid(userId))
      throw new BadRequestException('用户信息无效，请重新登录');
    const plan = this.resolvePlan(dto);
    const orderId = randomUUID().replaceAll('-', '');
    const description = `面试汪-${plan.name}`;
    const benefits = {
      wwCoins: plan.wwCoins,
      resumeCount: plan.resumeCount,
      specialCount: plan.specialCount,
      behaviorCount: plan.behaviorCount,
    };
    const record = await this.paymentModel.create({
      orderId,
      channel: dto.channel,
      amount: plan.priceFen / 100,
      planId: plan.id,
      planName: plan.name,
      source: dto.source || 'web',
      description,
      metadata: {
        planId: plan.id,
        planName: plan.name,
        source: dto.source || 'web',
        description,
        amount: plan.priceFen / 100,
        benefits,
      },
      user: new Types.ObjectId(userId),
      userId,
      status: PaymentRecordStatus.PENDING,
    });
    try {
      const result = await this.provider(dto.channel).initiatePayment({
        orderId,
        amount: plan.priceFen / 100,
        subject: description,
        description,
      });
      return result;
    } catch (error) {
      await this.paymentModel.findByIdAndUpdate(record._id, {
        $set: {
          status: PaymentRecordStatus.FAILED,
          failureReason: 'provider_create_failed',
        },
      });
      throw error;
    }
  }

  async queryPaymentStatus(userId: string, dto: QueryPaymentStatusDto) {
    const record = await this.paymentModel.findOne({
      orderId: dto.orderId,
      userId,
      channel: dto.channel,
    });
    if (!record) throw new NotFoundException('支付订单不存在');
    if (record.status === PaymentRecordStatus.SUCCESS)
      return { success: true, status: record.status, orderId: record.orderId };
    if (record.status === PaymentRecordStatus.CLOSED)
      return { success: false, status: record.status, orderId: record.orderId };
    const result = await this.provider(record.channel).queryTrade(
      record.orderId,
    );
    await this.applyProviderResult(record, result);
    const refreshed = await this.paymentModel.findOne({
      orderId: record.orderId,
      userId,
    });
    return {
      success: refreshed?.status === PaymentRecordStatus.SUCCESS,
      status: refreshed?.status || record.status,
      orderId: record.orderId,
      providerStatus: result.rawStatus,
    };
  }

  async handleNotification(
    channel: PaymentChannel,
    payload: Record<string, unknown>,
    headers?: Record<string, string | undefined>,
  ): Promise<void> {
    const result = await this.provider(channel).verifyNotification(
      payload,
      headers,
    );
    const record = await this.paymentModel.findOne({
      orderId: result.orderId,
      channel,
    });
    if (!record) throw new NotFoundException('支付订单不存在');
    await this.applyProviderResult(record, result);
  }

  private async applyProviderResult(
    record: PaymentRecordDocument,
    result: PaymentQueryResult,
  ): Promise<void> {
    if (result.closed) {
      await this.paymentModel.findOneAndUpdate(
        { orderId: record.orderId, status: PaymentRecordStatus.PENDING },
        { $set: { status: PaymentRecordStatus.CLOSED } },
      );
      return;
    }
    if (!result.paid) return;
    if (
      result.amount === undefined ||
      Math.round(result.amount * 100) !== Math.round(record.amount * 100)
    ) {
      await this.paymentModel.findOneAndUpdate(
        { orderId: record.orderId },
        {
          $set: {
            status: PaymentRecordStatus.FAILED,
            failureReason: 'amount_mismatch',
          },
        },
      );
      this.metrics?.incrementBusiness('payment_amount_validation', 'error');
      throw new BadRequestException('支付金额校验失败');
    }
    await this.finalizePayment(record, result);
  }

  private async finalizePayment(
    record: PaymentRecordDocument,
    result: PaymentQueryResult,
  ): Promise<void> {
    const claimed = await this.paymentModel.findOneAndUpdate(
      {
        orderId: record.orderId,
        status: {
          $in: [PaymentRecordStatus.PENDING, PaymentRecordStatus.PROCESSING],
        },
      },
      {
        $set: {
          status: PaymentRecordStatus.PROCESSING,
          processingAt: new Date(),
          transactionId: result.transactionId,
          notificationPayload: {
            rawStatus: result.rawStatus,
            amount: result.amount,
            transactionId: result.transactionId,
          },
        },
      },
      { new: true },
    );
    if (!claimed) return;
    if (!claimed.userId || !Types.ObjectId.isValid(claimed.userId)) {
      throw new BadRequestException('支付订单缺少有效用户');
    }
    const benefits = this.recordBenefits(claimed);
    await this.userModel.findOneAndUpdate(
      {
        _id: claimed.userId,
        processedOrders: { $ne: claimed.orderId },
      },
      {
        $inc: {
          wwCoinBalance: Number(benefits.wwCoins || 0),
          resumeRemainingCount: Number(benefits.resumeCount || 0),
          specialRemainingCount: Number(benefits.specialCount || 0),
          behaviorRemainingCount: Number(benefits.behaviorCount || 0),
        },
        $addToSet: { processedOrders: claimed.orderId },
      },
      { new: true },
    );
    await this.transactionModel.findOneAndUpdate(
      { relatedOrderId: claimed.orderId },
      {
        $setOnInsert: {
          user: new Types.ObjectId(claimed.userId),
          userIdentifier: claimed.userId,
          type: UserTransactionType.RECHARGE,
          amount: claimed.amount,
          currency: claimed.currency || 'CNY',
          description: `充值${claimed.planName || ''}`,
          planId: claimed.planId,
          planName: claimed.planName,
          source: claimed.channel,
          relatedOrderId: claimed.orderId,
          metadata: { ...claimed.metadata, benefits },
          payData: {
            orderId: claimed.orderId,
            transactionId: result.transactionId,
            amount: result.amount,
            rawStatus: result.rawStatus,
            paidAt: result.paidAt,
          },
        },
        $set: { status: 'success' },
      },
      { upsert: true, new: true },
    );
    await this.paymentModel.findOneAndUpdate(
      { orderId: claimed.orderId, status: PaymentRecordStatus.PROCESSING },
      {
        $set: {
          status: PaymentRecordStatus.SUCCESS,
          paidAt: result.paidAt || new Date(),
          transactionId: result.transactionId,
        },
        $unset: { failureReason: 1 },
      },
    );
    this.metrics?.incrementBusiness('payment_grant', 'success');
  }

  private resolvePlan(dto: InitiatePaymentDto): PaymentPlan {
    if (dto.planId === 'custom') {
      if (dto.amount === undefined)
        throw new BadRequestException('自定义充值金额不能为空');
      return {
        id: 'custom',
        name: '自定义充值',
        priceFen: Math.round(dto.amount * 100),
        wwCoins: dto.amount,
        resumeCount: 0,
        specialCount: 0,
        behaviorCount: 0,
      };
    }
    const plan = PAYMENT_PLANS[dto.planId];
    if (!plan) throw new BadRequestException('充值套餐不存在');
    if (
      dto.amount !== undefined &&
      Math.round(dto.amount * 100) !== plan.priceFen
    )
      throw new BadRequestException('套餐金额与服务端配置不一致');
    return plan;
  }

  private recordBenefits(
    record: PaymentRecordDocument,
  ): Record<string, number> {
    const metadataBenefits = record.metadata?.benefits;
    if (metadataBenefits && typeof metadataBenefits === 'object') {
      const values = metadataBenefits as Record<string, unknown>;
      return {
        wwCoins: this.numberValue(values.wwCoins),
        resumeCount: this.numberValue(values.resumeCount),
        specialCount: this.numberValue(values.specialCount),
        behaviorCount: this.numberValue(values.behaviorCount),
      };
    }
    const planId = record.planId;
    if (!planId) throw new BadRequestException('支付订单缺少套餐快照');
    if (planId === 'custom') {
      return {
        wwCoins: record.amount,
        resumeCount: 0,
        specialCount: 0,
        behaviorCount: 0,
      };
    }
    const plan = PAYMENT_PLANS[planId];
    if (!plan) throw new BadRequestException('支付订单套餐无效');
    return {
      wwCoins: plan.wwCoins,
      resumeCount: plan.resumeCount,
      specialCount: plan.specialCount,
      behaviorCount: plan.behaviorCount,
    };
  }

  private numberValue(value: unknown): number {
    return typeof value === 'number' && Number.isFinite(value) ? value : 0;
  }

  private provider(channel: PaymentChannel): PaymentProvider {
    if (channel === PaymentChannel.TEST) {
      const enabled =
        this.configService.get<string>('PAYMENT_TEST_MODE') === 'true' &&
        this.configService.get<string>('NODE_ENV') !== 'production';
      if (!enabled) {
        throw new BadRequestException('测试支付渠道未启用');
      }
      return this.testPayment;
    }
    return channel === PaymentChannel.ALIPAY ? this.alipay : this.wechat;
  }
}
