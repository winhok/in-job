export enum PaymentChannel {
  ALIPAY = 'alipay',
  WECHAT = 'wechat',
  TEST = 'test',
}

export interface PaymentOrderPayload {
  orderId: string;
  amount: number;
  subject: string;
  description: string;
  notifyUrl?: string;
  metadata?: Record<string, string>;
}

export interface PaymentInitiationResult {
  channel: PaymentChannel;
  orderId: string;
  codeUrl: string;
  createdAt: string;
}

export interface PaymentQueryResult {
  paid: boolean;
  closed?: boolean;
  amount?: number;
  transactionId?: string;
  paidAt?: Date;
  rawStatus: string;
}

export interface PaymentRecordContext {
  userId: string;
  buyerLogonId?: string;
  buyerPayAmount: string;
  invoiceAmount?: string;
  outTradeNo: string;
  passbackParams?: string;
  pointAmount?: string;
  receiptAmount?: string;
  totalAmount: string;
  tradeNo?: string;
  tradeStatus: string;
  buyerOpenId?: string;
  traceId?: string;
  metadata?: Record<string, unknown>;
  channel: string;
  paidAt: Date;
  currency: string;
}

export interface PaymentProvider {
  initiatePayment(
    payload: PaymentOrderPayload,
  ): Promise<PaymentInitiationResult>;
  queryTrade(orderId: string): Promise<PaymentQueryResult>;
  verifyNotification(
    payload: Record<string, unknown>,
    headers?: Record<string, string | undefined>,
  ): Promise<PaymentQueryResult & { orderId: string }>;
}
