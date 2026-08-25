import { ServiceUnavailableException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { AlipayPaymentService } from './alipay-payment.service';
import { WechatPaymentService } from './wechat-payment.service';

describe('payment provider configuration boundaries', () => {
  const config = { get: vi.fn() };

  it('支付宝缺少配置时不发出外部请求', async () => {
    const provider = new AlipayPaymentService(config as never);
    await expect(provider.queryTrade('order-id')).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it('微信支付缺少配置时不发出外部请求', async () => {
    const provider = new WechatPaymentService(config as never);
    await expect(provider.queryTrade('order-id')).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
