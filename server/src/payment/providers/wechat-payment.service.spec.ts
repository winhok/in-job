import { BadRequestException } from '@nestjs/common';
import { createCipheriv, createSign, generateKeyPairSync } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WechatPaymentService } from './wechat-payment.service';

const { axiosGet } = vi.hoisted(() => ({ axiosGet: vi.fn() }));
vi.mock('axios', () => ({
  default: { get: axiosGet, post: vi.fn() },
}));

describe('WechatPaymentService signatures', () => {
  const merchantKeys = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const platformKeys = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const merchantPrivateKey = merchantKeys.privateKey.export({
    type: 'pkcs8',
    format: 'pem',
  });
  const platformPublicKey = platformKeys.publicKey.export({
    type: 'spki',
    format: 'pem',
  });
  const apiV3Key = '12345678901234567890123456789012';
  const values = new Map<string, string>([
    ['WECHAT_PAY_APP_ID', 'app-id'],
    ['WECHAT_PAY_MCH_ID', 'merchant-id'],
    ['WECHAT_PAY_MCH_SERIAL', 'serial'],
    ['WECHAT_PAY_PRIVATE_KEY', merchantPrivateKey],
    ['WECHAT_PAY_PLATFORM_PUBLIC_KEY', platformPublicKey],
    ['WECHAT_PAY_API_V3_KEY', apiV3Key],
    ['WECHAT_PAY_NOTIFY_URL', 'https://example.com/callback'],
  ]);

  const sign = (timestamp: string, nonce: string, body: string) => {
    const signer = createSign('RSA-SHA256');
    signer.update(`${timestamp}\n${nonce}\n${body}\n`);
    return signer.sign(platformKeys.privateKey, 'base64');
  };

  const service = () =>
    new WechatPaymentService({
      get: vi.fn((key: string) => values.get(key)),
    } as never);

  beforeEach(() => vi.clearAllMocks());

  it('主动查询只接受微信平台签名的原始响应', async () => {
    const body = JSON.stringify({
      trade_state: 'SUCCESS',
      transaction_id: 'wx-trade',
      amount: { total: 1880 },
    });
    const timestamp = '1787520000';
    const nonce = 'response-nonce';
    axiosGet.mockResolvedValue({
      data: body,
      headers: {
        'wechatpay-timestamp': timestamp,
        'wechatpay-nonce': nonce,
        'wechatpay-signature': sign(timestamp, nonce, body),
      },
    });
    await expect(service().queryTrade('order-id')).resolves.toMatchObject({
      paid: true,
      amount: 18.8,
      transactionId: 'wx-trade',
    });

    axiosGet.mockResolvedValue({
      data: body,
      headers: {
        'wechatpay-timestamp': timestamp,
        'wechatpay-nonce': nonce,
        'wechatpay-signature': 'invalid',
      },
    });
    await expect(service().queryTrade('order-id')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('回调验签、解密后继续校验商户与 AppID', async () => {
    const plaintext = JSON.stringify({
      out_trade_no: 'order-id',
      trade_state: 'SUCCESS',
      mchid: 'merchant-id',
      appid: 'app-id',
      amount: { total: 1880 },
    });
    const resourceNonce = '123456789012';
    const associatedData = '';
    const cipher = createCipheriv(
      'aes-256-gcm',
      Buffer.from(apiV3Key),
      Buffer.from(resourceNonce),
    );
    cipher.setAAD(Buffer.from(associatedData));
    const encrypted = Buffer.concat([
      cipher.update(plaintext),
      cipher.final(),
      cipher.getAuthTag(),
    ]).toString('base64');
    const payload = {
      resource: {
        ciphertext: encrypted,
        nonce: resourceNonce,
        associated_data: associatedData,
      },
    };
    const rawBody = JSON.stringify(payload);
    const timestamp = '1787520000';
    const nonce = 'callback-nonce';

    await expect(
      service().verifyNotification(
        { ...payload, __rawBody: rawBody },
        {
          timestamp,
          nonce,
          signature: sign(timestamp, nonce, rawBody),
        },
      ),
    ).resolves.toMatchObject({
      orderId: 'order-id',
      paid: true,
      amount: 18.8,
    });
  });
});
