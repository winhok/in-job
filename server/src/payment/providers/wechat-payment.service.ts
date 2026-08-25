import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import {
  createDecipheriv,
  createPrivateKey,
  createVerify,
  randomBytes,
  createSign,
} from 'node:crypto';
import {
  PaymentChannel,
  PaymentInitiationResult,
  PaymentOrderPayload,
  PaymentProvider,
  PaymentQueryResult,
} from '../payment.types';

@Injectable()
export class WechatPaymentService implements PaymentProvider {
  constructor(private readonly configService: ConfigService) {}

  async initiatePayment(
    payload: PaymentOrderPayload,
  ): Promise<PaymentInitiationResult> {
    const path = '/v3/pay/transactions/native';
    const body = JSON.stringify({
      appid: this.getConfig('WECHAT_PAY_APP_ID'),
      mchid: this.getConfig('WECHAT_PAY_MCH_ID'),
      description: payload.description,
      out_trade_no: payload.orderId,
      notify_url: payload.notifyUrl || this.getConfig('WECHAT_PAY_NOTIFY_URL'),
      amount: { total: Math.round(payload.amount * 100), currency: 'CNY' },
    });
    const response = await axios.post<string>(
      `${this.apiBase()}${path}`,
      body,
      {
        headers: this.signedHeaders('POST', path, body),
        timeout: 10_000,
        transformResponse: [(data: string) => data],
      },
    );
    this.verifyApiResponse(response.data, response.headers);
    const responseBody = JSON.parse(response.data) as { code_url?: string };
    if (!responseBody.code_url)
      throw new BadRequestException('微信支付未返回支付二维码');
    return {
      channel: PaymentChannel.WECHAT,
      orderId: payload.orderId,
      codeUrl: responseBody.code_url,
      createdAt: new Date().toISOString(),
    };
  }

  async queryTrade(orderId: string): Promise<PaymentQueryResult> {
    const mchId = this.getConfig('WECHAT_PAY_MCH_ID');
    const path = `/v3/pay/transactions/out-trade-no/${encodeURIComponent(orderId)}?mchid=${encodeURIComponent(mchId)}`;
    const response = await axios.get<string>(`${this.apiBase()}${path}`, {
      headers: this.signedHeaders('GET', path, ''),
      timeout: 10_000,
      transformResponse: [(data: string) => data],
    });
    this.verifyApiResponse(response.data, response.headers);
    return this.normalizeTrade(
      JSON.parse(response.data) as Record<string, unknown>,
    );
  }

  verifyNotification(
    payload: Record<string, unknown>,
    headers: Record<string, string | undefined> = {},
  ): Promise<PaymentQueryResult & { orderId: string }> {
    const rawBody = this.stringValue(payload.__rawBody);
    const timestamp = headers.timestamp || '';
    const nonce = headers.nonce || '';
    const signature = headers.signature || '';
    const verifier = createVerify('RSA-SHA256');
    verifier.update(`${timestamp}\n${nonce}\n${rawBody}\n`);
    const platformKey = this.getConfig(
      'WECHAT_PAY_PLATFORM_PUBLIC_KEY',
    ).replace(/\\n/g, '\n');
    if (!verifier.verify(platformKey, signature, 'base64'))
      throw new BadRequestException('微信支付回调签名无效');
    const resource = payload.resource as Record<string, string> | undefined;
    if (
      !resource?.ciphertext ||
      !resource.nonce ||
      typeof resource.associated_data !== 'string'
    )
      throw new BadRequestException('微信支付回调资源无效');
    const plaintext = this.decryptResource(resource);
    const trade = JSON.parse(plaintext) as Record<string, unknown>;
    const orderId = this.stringValue(trade.out_trade_no);
    if (!orderId) throw new BadRequestException('微信支付回调缺少订单号');
    if (
      trade.mchid !== this.getConfig('WECHAT_PAY_MCH_ID') ||
      trade.appid !== this.getConfig('WECHAT_PAY_APP_ID')
    ) {
      throw new BadRequestException('微信支付回调商户信息不匹配');
    }
    return Promise.resolve({ orderId, ...this.normalizeTrade(trade) });
  }

  private normalizeTrade(data: Record<string, unknown>): PaymentQueryResult {
    const rawStatus = this.stringValue(data.trade_state) || 'UNKNOWN';
    const amount = data.amount as { total?: number } | undefined;
    return {
      paid: rawStatus === 'SUCCESS',
      closed: ['CLOSED', 'REVOKED', 'PAYERROR'].includes(rawStatus),
      amount:
        typeof amount?.total === 'number' ? amount.total / 100 : undefined,
      transactionId: this.stringValue(data.transaction_id) || undefined,
      paidAt: this.stringValue(data.success_time)
        ? new Date(this.stringValue(data.success_time))
        : undefined,
      rawStatus,
    };
  }

  private decryptResource(resource: Record<string, string>): string {
    const key = Buffer.from(this.getConfig('WECHAT_PAY_API_V3_KEY'), 'utf8');
    if (key.length !== 32)
      throw new ServiceUnavailableException('微信支付 APIv3 密钥长度无效');
    const encrypted = Buffer.from(resource.ciphertext, 'base64');
    const authTag = encrypted.subarray(encrypted.length - 16);
    const ciphertext = encrypted.subarray(0, encrypted.length - 16);
    const decipher = createDecipheriv(
      'aes-256-gcm',
      key,
      Buffer.from(resource.nonce),
    );
    decipher.setAuthTag(authTag);
    decipher.setAAD(Buffer.from(resource.associated_data));
    return Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]).toString('utf8');
  }

  private signedHeaders(method: string, path: string, body: string) {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const nonce = randomBytes(16).toString('hex');
    const privateKey = this.getConfig('WECHAT_PAY_PRIVATE_KEY').replace(
      /\\n/g,
      '\n',
    );
    createPrivateKey(privateKey);
    const signer = createSign('RSA-SHA256');
    signer.update(`${method}\n${path}\n${timestamp}\n${nonce}\n${body}\n`);
    const signature = signer.sign(privateKey, 'base64');
    const authorization = `WECHATPAY2-SHA256-RSA2048 mchid="${this.getConfig('WECHAT_PAY_MCH_ID')}",nonce_str="${nonce}",timestamp="${timestamp}",serial_no="${this.getConfig('WECHAT_PAY_MCH_SERIAL')}",signature="${signature}"`;
    return {
      Authorization: authorization,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    };
  }

  private verifyApiResponse(
    rawBody: string,
    headers: Record<string, unknown>,
  ): void {
    const timestamp = this.stringValue(headers['wechatpay-timestamp']);
    const nonce = this.stringValue(headers['wechatpay-nonce']);
    const signature = this.stringValue(headers['wechatpay-signature']);
    const verifier = createVerify('RSA-SHA256');
    verifier.update(`${timestamp}\n${nonce}\n${rawBody}\n`);
    const publicKey = this.getConfig('WECHAT_PAY_PLATFORM_PUBLIC_KEY').replace(
      /\\n/g,
      '\n',
    );
    if (!verifier.verify(publicKey, signature, 'base64')) {
      throw new BadRequestException('微信支付响应签名无效');
    }
  }

  private getConfig(name: string): string {
    const value = this.configService.get<string>(name);
    if (!value)
      throw new ServiceUnavailableException(`微信支付配置缺失: ${name}`);
    return value;
  }

  private stringValue(value: unknown): string {
    return typeof value === 'string' || typeof value === 'number'
      ? String(value)
      : '';
  }
  private apiBase(): string {
    return (
      this.configService.get<string>('WECHAT_PAY_API_BASE') ||
      'https://api.mch.weixin.qq.com'
    );
  }
}
