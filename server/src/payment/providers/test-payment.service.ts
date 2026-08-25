import { BadRequestException, Injectable } from '@nestjs/common';
import {
  PaymentChannel,
  PaymentInitiationResult,
  PaymentOrderPayload,
  PaymentProvider,
  PaymentQueryResult,
} from '../payment.types';

/** 仅供自动化测试或显式开启的非生产环境使用。 */
@Injectable()
export class TestPaymentService implements PaymentProvider {
  private readonly orders = new Map<
    string,
    { amount: number; paid: boolean }
  >();

  initiatePayment(
    payload: PaymentOrderPayload,
  ): Promise<PaymentInitiationResult> {
    this.orders.set(payload.orderId, {
      amount: payload.amount,
      paid: false,
    });
    return Promise.resolve({
      channel: PaymentChannel.TEST,
      orderId: payload.orderId,
      codeUrl: `testpay://${payload.orderId}`,
      createdAt: new Date().toISOString(),
    });
  }

  queryTrade(orderId: string): Promise<PaymentQueryResult> {
    const order = this.orders.get(orderId);
    if (!order) throw new BadRequestException('测试支付订单不存在');
    return Promise.resolve({
      paid: order.paid,
      amount: order.amount,
      transactionId: order.paid ? `test-${orderId}` : undefined,
      paidAt: order.paid ? new Date() : undefined,
      rawStatus: order.paid ? 'SUCCESS' : 'NOTPAY',
    });
  }

  async verifyNotification(
    payload: Record<string, unknown>,
  ): Promise<PaymentQueryResult & { orderId: string }> {
    const orderId = typeof payload.orderId === 'string' ? payload.orderId : '';
    return { orderId, ...(await this.queryTrade(orderId)) };
  }

  markPaid(orderId: string): void {
    const order = this.orders.get(orderId);
    if (!order) throw new BadRequestException('测试支付订单不存在');
    order.paid = true;
  }

  reset(): void {
    this.orders.clear();
  }
}
