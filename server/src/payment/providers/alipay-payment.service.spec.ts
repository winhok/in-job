import { BadRequestException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { AlipayPaymentService } from './alipay-payment.service';

describe('AlipayPaymentService notification boundary', () => {
  it('签名通过后仍校验回调 AppID', () => {
    const provider = new AlipayPaymentService({
      get: vi.fn((key: string) =>
        key === 'ALIPAY_APP_ID' ? 'app-id' : 'configured',
      ),
    } as never);
    Reflect.set(provider, 'createSdk', () => ({
      checkNotifySign: () => true,
    }));

    expect(() =>
      provider.verifyNotification({
        app_id: 'other-app',
        out_trade_no: 'order-id',
        trade_status: 'TRADE_SUCCESS',
        total_amount: '18.80',
      }),
    ).toThrow(BadRequestException);
  });
});
