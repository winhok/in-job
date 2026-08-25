import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AlipaySdk } from 'alipay-sdk';
import {
  PaymentChannel,
  PaymentInitiationResult,
  PaymentOrderPayload,
  PaymentProvider,
  PaymentQueryResult,
} from '../payment.types';

@Injectable()
export class AlipayPaymentService implements PaymentProvider {
  constructor(private readonly configService: ConfigService) {}

  async initiatePayment(
    payload: PaymentOrderPayload,
  ): Promise<PaymentInitiationResult> {
    const sdk = this.createSdk();
    const rawResponse: unknown = await sdk.exec('alipay.trade.precreate', {
      bizContent: {
        out_trade_no: payload.orderId,
        total_amount: payload.amount.toFixed(2),
        subject: payload.subject,
        product_code: 'QR_CODE_OFFLINE',
      },
      notifyUrl:
        payload.notifyUrl ||
        this.configService.get<string>('ALIPAY_NOTIFY_URL'),
    });
    const response = this.asRecord(rawResponse);
    const qrCode = this.stringValue(response.qrCode);
    if (!qrCode) throw new BadRequestException('支付宝未返回支付二维码');
    return {
      channel: PaymentChannel.ALIPAY,
      orderId: payload.orderId,
      codeUrl: qrCode,
      createdAt: new Date().toISOString(),
    };
  }

  async queryTrade(orderId: string): Promise<PaymentQueryResult> {
    const rawResponse: unknown = await this.createSdk().exec(
      'alipay.trade.query',
      {
        bizContent: { out_trade_no: orderId },
      },
    );
    const response = this.asRecord(rawResponse);
    const rawStatus =
      this.stringValue(response.tradeStatus) ||
      this.stringValue(response.subCode) ||
      'UNKNOWN';
    const totalAmount = this.numberValue(response.totalAmount);
    return {
      paid: ['TRADE_SUCCESS', 'TRADE_FINISHED'].includes(rawStatus),
      closed: rawStatus === 'TRADE_CLOSED',
      amount: totalAmount,
      transactionId: this.stringValue(response.tradeNo) || undefined,
      paidAt: this.stringValue(response.sendPayDate)
        ? new Date(this.stringValue(response.sendPayDate))
        : undefined,
      rawStatus,
    };
  }

  verifyNotification(
    payload: Record<string, unknown>,
  ): Promise<PaymentQueryResult & { orderId: string }> {
    const sdk = this.createSdk();
    if (!sdk.checkNotifySign(payload))
      throw new BadRequestException('支付宝回调签名无效');
    if (
      this.stringValue(payload.app_id) !==
      this.configService.get<string>('ALIPAY_APP_ID')
    ) {
      throw new BadRequestException('支付宝回调 AppID 不匹配');
    }
    const orderId = this.stringValue(payload.out_trade_no);
    if (!orderId) throw new BadRequestException('支付宝回调缺少订单号');
    const rawStatus = this.stringValue(payload.trade_status) || 'UNKNOWN';
    const totalAmount = this.numberValue(payload.total_amount);
    return Promise.resolve({
      orderId,
      paid: ['TRADE_SUCCESS', 'TRADE_FINISHED'].includes(rawStatus),
      closed: rawStatus === 'TRADE_CLOSED',
      amount: totalAmount,
      transactionId: this.stringValue(payload.trade_no) || undefined,
      paidAt: this.stringValue(payload.gmt_payment)
        ? new Date(this.stringValue(payload.gmt_payment))
        : undefined,
      rawStatus,
    });
  }

  private createSdk(): AlipaySdk {
    const appId = this.configService.get<string>('ALIPAY_APP_ID');
    const privateKey = this.configService
      .get<string>('ALIPAY_PRIVATE_KEY')
      ?.replace(/\\n/g, '\n');
    const alipayPublicKey = this.configService
      .get<string>('ALIPAY_PUBLIC_KEY')
      ?.replace(/\\n/g, '\n');
    if (!appId || !privateKey || !alipayPublicKey)
      throw new ServiceUnavailableException('支付宝支付尚未配置');
    return new AlipaySdk({
      appId,
      privateKey,
      alipayPublicKey,
      gateway:
        this.configService.get<string>('ALIPAY_GATEWAY') ||
        'https://openapi.alipay.com/gateway.do',
      signType: 'RSA2',
    });
  }

  private asRecord(value: unknown): Record<string, unknown> {
    return value && typeof value === 'object'
      ? (value as Record<string, unknown>)
      : {};
  }

  private stringValue(value: unknown): string {
    return typeof value === 'string' || typeof value === 'number'
      ? String(value)
      : '';
  }

  private numberValue(value: unknown): number | undefined {
    if (typeof value !== 'string' && typeof value !== 'number')
      return undefined;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
}
