import { BadRequestException, NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { PaymentChannel } from './payment.types';
import { PaymentRecordStatus } from './schemas/payment-record.schema';
import { PaymentService } from './payment.service';

describe('PaymentService', () => {
  const userId = '507f1f77bcf86cd799439011';

  function createService(record: Record<string, unknown> | null = null) {
    const paymentModel = {
      create: vi.fn().mockResolvedValue({ _id: 'payment-id' }),
      findByIdAndUpdate: vi.fn().mockResolvedValue(null),
      findOne: vi.fn().mockResolvedValue(record),
      findOneAndUpdate: vi.fn().mockResolvedValue(record),
    };
    const transactionModel = {
      findOneAndUpdate: vi.fn().mockResolvedValue({}),
    };
    const userModel = { findOneAndUpdate: vi.fn().mockResolvedValue({}) };
    const alipay = {
      initiatePayment: vi.fn().mockResolvedValue({
        channel: PaymentChannel.ALIPAY,
        orderId: 'provider-order',
        codeUrl: 'https://qr.example/alipay',
        createdAt: new Date().toISOString(),
      }),
      queryTrade: vi.fn(),
      verifyNotification: vi.fn(),
    };
    const wechat = {
      initiatePayment: vi.fn(),
      queryTrade: vi.fn(),
      verifyNotification: vi.fn(),
    };
    const testPayment = {};
    const configService = { get: vi.fn() };
    return {
      service: new PaymentService(
        paymentModel as never,
        transactionModel as never,
        userModel as never,
        alipay as never,
        wechat as never,
        testPayment as never,
        configService as never,
      ),
      paymentModel,
      transactionModel,
      userModel,
      alipay,
      wechat,
    };
  }

  it('固定套餐金额由服务端决定并拒绝客户端篡改', async () => {
    const { service, paymentModel } = createService();
    await expect(
      service.initiatePayment(userId, {
        channel: PaymentChannel.ALIPAY,
        planId: 'pro',
        amount: 0.01,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(paymentModel.create).not.toHaveBeenCalled();
  });

  it('订单查询同时绑定用户、订单号和渠道', async () => {
    const { service, paymentModel, alipay } = createService(null);
    await expect(
      service.queryPaymentStatus(userId, {
        orderId: 'private-order',
        channel: PaymentChannel.ALIPAY,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(paymentModel.findOne).toHaveBeenCalledWith({
      orderId: 'private-order',
      userId,
      channel: PaymentChannel.ALIPAY,
    });
    expect(alipay.queryTrade).not.toHaveBeenCalled();
  });

  it('支付成功后用订单键防止重复发放并 upsert 唯一流水', async () => {
    const record = {
      orderId: 'order-1',
      userId,
      channel: PaymentChannel.ALIPAY,
      amount: 28.8,
      planName: '突击包',
      status: PaymentRecordStatus.PENDING,
      metadata: {
        benefits: {
          wwCoins: 0,
          resumeCount: 1,
          specialCount: 1,
          behaviorCount: 1,
        },
      },
    };
    const { service, alipay, userModel, transactionModel } =
      createService(record);
    alipay.queryTrade.mockResolvedValue({
      paid: true,
      amount: 28.8,
      transactionId: 'alipay-trade',
      rawStatus: 'TRADE_SUCCESS',
    });

    await service.queryPaymentStatus(userId, {
      orderId: record.orderId,
      channel: PaymentChannel.ALIPAY,
    });

    expect(userModel.findOneAndUpdate).toHaveBeenCalledWith(
      {
        _id: userId,
        processedOrders: { $ne: record.orderId },
      },
      expect.objectContaining({
        $addToSet: { processedOrders: record.orderId },
      }),
      { new: true },
    );
    expect(transactionModel.findOneAndUpdate).toHaveBeenCalledWith(
      { relatedOrderId: record.orderId },
      expect.any(Object),
      { upsert: true, new: true },
    );
  });

  it('provider 金额不一致时不发放权益', async () => {
    const record = {
      orderId: 'order-2',
      userId,
      channel: PaymentChannel.ALIPAY,
      amount: 18.8,
      status: PaymentRecordStatus.PENDING,
    };
    const { service, alipay, userModel, paymentModel } = createService(record);
    alipay.queryTrade.mockResolvedValue({
      paid: true,
      amount: 0.01,
      rawStatus: 'TRADE_SUCCESS',
    });

    await expect(
      service.queryPaymentStatus(userId, {
        orderId: record.orderId,
        channel: PaymentChannel.ALIPAY,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(userModel.findOneAndUpdate).not.toHaveBeenCalled();
    expect(paymentModel.findOneAndUpdate).toHaveBeenCalledWith(
      { orderId: record.orderId },
      {
        $set: {
          status: PaymentRecordStatus.FAILED,
          failureReason: 'amount_mismatch',
        },
      },
    );
  });

  it('重复通知通过订单发放键和唯一流水收敛', async () => {
    const record = {
      orderId: 'order-repeat',
      userId,
      channel: PaymentChannel.ALIPAY,
      amount: 18.8,
      planName: '单次包',
      status: PaymentRecordStatus.PENDING,
      metadata: {
        benefits: { wwCoins: 0, specialCount: 1 },
      },
    };
    const { service, alipay, userModel, transactionModel } =
      createService(record);
    alipay.verifyNotification.mockResolvedValue({
      orderId: record.orderId,
      paid: true,
      amount: 18.8,
      rawStatus: 'TRADE_SUCCESS',
    });

    await service.handleNotification(PaymentChannel.ALIPAY, {});
    await service.handleNotification(PaymentChannel.ALIPAY, {});

    expect(userModel.findOneAndUpdate).toHaveBeenCalledTimes(2);
    for (const [filter] of userModel.findOneAndUpdate.mock.calls) {
      expect(filter).toEqual({
        _id: userId,
        processedOrders: { $ne: record.orderId },
      });
    }
    expect(transactionModel.findOneAndUpdate).toHaveBeenCalledTimes(2);
  });

  it('流水写入暂时失败后可重试且用户更新仍带幂等条件', async () => {
    const record = {
      orderId: 'order-recovery',
      userId,
      channel: PaymentChannel.ALIPAY,
      amount: 18.8,
      planName: '单次包',
      status: PaymentRecordStatus.PROCESSING,
      metadata: {
        benefits: { wwCoins: 0, specialCount: 1 },
      },
    };
    const { service, alipay, userModel, transactionModel } =
      createService(record);
    alipay.verifyNotification.mockResolvedValue({
      orderId: record.orderId,
      paid: true,
      amount: 18.8,
      rawStatus: 'TRADE_SUCCESS',
    });
    transactionModel.findOneAndUpdate
      .mockRejectedValueOnce(new Error('temporary database error'))
      .mockResolvedValueOnce({});

    await expect(
      service.handleNotification(PaymentChannel.ALIPAY, {}),
    ).rejects.toThrow('temporary database error');
    await expect(
      service.handleNotification(PaymentChannel.ALIPAY, {}),
    ).resolves.toBeUndefined();
    expect(userModel.findOneAndUpdate).toHaveBeenCalledTimes(2);
  });

  it('按原仓库单一元金额字段和套餐字段处理订单', async () => {
    const record = {
      orderId: 'legacy-order',
      userId,
      channel: PaymentChannel.ALIPAY,
      amount: 18.8,
      currency: 'CNY',
      planId: 'single',
      planName: '单次包',
      status: PaymentRecordStatus.PENDING,
    };
    const { service, alipay, userModel, transactionModel } =
      createService(record);
    let capturedUserUpdate: unknown;
    let capturedTransactionUpdate: unknown;
    userModel.findOneAndUpdate.mockImplementation(
      (_filter: unknown, update: unknown) => {
        capturedUserUpdate = update;
        return Promise.resolve({});
      },
    );
    transactionModel.findOneAndUpdate.mockImplementation(
      (_filter: unknown, update: unknown) => {
        capturedTransactionUpdate = update;
        return Promise.resolve({});
      },
    );
    alipay.queryTrade.mockResolvedValue({
      paid: true,
      amount: 18.8,
      rawStatus: 'TRADE_SUCCESS',
    });

    await service.queryPaymentStatus(userId, {
      orderId: record.orderId,
      channel: PaymentChannel.ALIPAY,
    });

    expect(capturedUserUpdate).toMatchObject({
      $inc: { wwCoinBalance: 0, specialRemainingCount: 1 },
      $addToSet: { processedOrders: record.orderId },
    });
    expect(capturedTransactionUpdate).toMatchObject({
      $setOnInsert: {
        amount: 18.8,
        currency: 'CNY',
        relatedOrderId: record.orderId,
        userIdentifier: userId,
      },
    });
  });
});
