import type { UserDocument } from '../../user/schemas/user.schema';

export enum QrCodeStatus {
  PENDING = 'pending',
  SCANNED = 'scanned',
  CONFIRMED = 'confirmed',
  EXPIRED = 'expired',
}

export interface WechatLoginResult {
  user: Record<string, unknown>;
  token: string;
}

export interface QrCodeState {
  id: string;
  status: QrCodeStatus;
  openid?: string;
  serviceAccountId?: string;
  expireTime: number;
  createdAt: number;
  loginResult?: WechatLoginResult;
}

export interface WechatMessage {
  ToUserName?: string;
  FromUserName?: string;
  MsgType?: string;
  Event?: string;
  EventKey?: string;
}

export interface WechatAccessTokenResponse {
  access_token?: string;
  expires_in?: number;
  errcode?: number;
  errmsg?: string;
}

export interface WechatQrCodeResponse {
  ticket?: string;
  expire_seconds?: number;
  url?: string;
  errcode?: number;
  errmsg?: string;
}

export interface WechatApiResponse {
  errcode?: number;
  errmsg?: string;
  media_id?: string;
  [key: string]: unknown;
}

export type WechatUserDocument = UserDocument;
