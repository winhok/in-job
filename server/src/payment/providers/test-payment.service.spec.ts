import { describe, expect, it } from 'vitest';
import { PaymentChannel } from '../payment.types';
import { TestPaymentService } from './test-payment.service';

describe('TestPaymentService', () => {
  it('只有显式标记后才返回支付成功', async () => {
    const provider = new TestPaymentService();
    const created = await provider.initiatePayment({
      orderId: 'test-order',
      amount: 18.8,
      subject: '测试订单',
      description: '测试订单',
    });
    expect(created.channel).toBe(PaymentChannel.TEST);
    await expect(provider.queryTrade('test-order')).resolves.toMatchObject({
      paid: false,
      amount: 18.8,
    });

    provider.markPaid('test-order');
    await expect(provider.queryTrade('test-order')).resolves.toMatchObject({
      paid: true,
      amount: 18.8,
      rawStatus: 'SUCCESS',
    });
  });
});
