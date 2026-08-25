import { describe, expect, it } from 'vitest';
import { PAYMENT_PLANS } from './payment.catalog';

describe('PAYMENT_PLANS source compatibility', () => {
  it('固定套餐只发服务次数，自定义充值才按金额增加旺旺币', () => {
    expect(PAYMENT_PLANS.single).toMatchObject({
      priceFen: 1880,
      wwCoins: 0,
      specialCount: 1,
    });
    expect(PAYMENT_PLANS.pro).toMatchObject({
      priceFen: 2880,
      wwCoins: 0,
      resumeCount: 1,
      specialCount: 1,
      behaviorCount: 1,
    });
  });
});
