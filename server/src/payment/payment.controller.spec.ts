import { describe, expect, it, vi } from 'vitest';
import { PaymentController } from './payment.controller';
import { PaymentChannel } from './payment.types';

describe('PaymentController callbacks', () => {
  function createController() {
    const paymentService = {
      handleNotification: vi.fn().mockResolvedValue(undefined),
    };
    return {
      controller: new PaymentController(paymentService as never),
      paymentService,
    };
  }

  it('支付宝回调交给服务层验签处理并返回纯文本 success', async () => {
    const { controller, paymentService } = createController();
    const body = { out_trade_no: 'order-1', sign: 'mock-signature' };
    const response = {
      type: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
    };

    await controller.alipayCallback(body, response as never);

    expect(paymentService.handleNotification).toHaveBeenCalledWith(
      PaymentChannel.ALIPAY,
      body,
    );
    expect(response.type).toHaveBeenCalledWith('text/plain');
    expect(response.send).toHaveBeenCalledWith('success');
  });

  it('微信回调保留原始请求体与签名头并返回微信成功响应', async () => {
    const { controller, paymentService } = createController();
    const body = { id: 'notification-id' };
    const rawBody = Buffer.from(JSON.stringify(body));
    const response = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    await controller.wechatCallback(
      body,
      { rawBody } as never,
      'timestamp',
      'nonce',
      'mock-signature',
      response as never,
    );

    expect(paymentService.handleNotification).toHaveBeenCalledWith(
      PaymentChannel.WECHAT,
      { ...body, __rawBody: rawBody.toString('utf8') },
      {
        timestamp: 'timestamp',
        nonce: 'nonce',
        signature: 'mock-signature',
      },
    );
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith({
      code: 'SUCCESS',
      message: '成功',
    });
  });
});
