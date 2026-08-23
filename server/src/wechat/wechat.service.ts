import {
  ForbiddenException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import axios from 'axios';
import FormData from 'form-data';
import { createHash, randomUUID } from 'node:crypto';
import { createReadStream, existsSync } from 'node:fs';
import { isAbsolute, resolve } from 'node:path';
import type { Model } from 'mongoose';
import { User, UserDocument } from '../user/schemas/user.schema';
import {
  QrCodeState,
  QrCodeStatus,
  WechatAccessTokenResponse,
  WechatApiResponse,
  WechatLoginResult,
  WechatMessage,
  WechatQrCodeResponse,
} from './dto/wechat.dto';
import { buildImageReply, buildTextReply } from './utils/wechat';

@Injectable()
export class WechatService {
  private readonly logger = new Logger(WechatService.name);
  private readonly qrCodeStore = new Map<string, QrCodeState>();
  private readonly loginPromises = new Map<
    string,
    Promise<WechatLoginResult>
  >();
  private accessToken = '';
  private accessTokenExpiresAt = 0;
  private accessTokenPromise?: Promise<string>;

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  private getRequiredConfig(name: string): string {
    const value = this.configService.get<string>(name)?.trim();
    if (!value) {
      throw new ServiceUnavailableException(`${name} 未配置`);
    }
    return value;
  }

  private describeWechatError(data: {
    errcode?: number;
    errmsg?: string;
  }): string {
    return `errcode=${data.errcode ?? 'unknown'}, errmsg=${data.errmsg ?? 'unknown'}`;
  }

  async getAccessToken(): Promise<string> {
    const now = Date.now();
    if (this.accessToken && now < this.accessTokenExpiresAt) {
      return this.accessToken;
    }
    if (this.accessTokenPromise) {
      return this.accessTokenPromise;
    }

    this.accessTokenPromise = this.fetchAccessToken(now).finally(() => {
      this.accessTokenPromise = undefined;
    });
    return this.accessTokenPromise;
  }

  private async fetchAccessToken(requestedAt: number): Promise<string> {
    const { data } = await axios.post<WechatAccessTokenResponse>(
      'https://api.weixin.qq.com/cgi-bin/stable_token',
      {
        appid: this.getRequiredConfig('WECHAT_APP_ID'),
        secret: this.getRequiredConfig('WECHAT_APP_SECRET'),
        grant_type: 'client_credential',
        force_refresh: false,
      },
      { timeout: 10_000 },
    );

    if (!data.access_token || !data.expires_in) {
      throw new ServiceUnavailableException(
        `获取微信 access_token 失败：${this.describeWechatError(data)}`,
      );
    }

    this.accessToken = data.access_token;
    this.accessTokenExpiresAt =
      requestedAt + Math.max(data.expires_in - 200, 60) * 1000;
    this.logger.log('微信 access_token 已刷新');
    return this.accessToken;
  }

  async generateLoginQrCode(): Promise<{
    qrCodeUrl: string;
    qrCodeId: string;
    expireTime: number;
  }> {
    this.removeExpiredQrCodes();
    const qrCodeId = `qr_${randomUUID()}`;
    const expireSeconds = 300;
    const expireTime = Date.now() + expireSeconds * 1000;
    const accessToken = await this.getAccessToken();

    const { data } = await axios.post<WechatQrCodeResponse>(
      'https://api.weixin.qq.com/cgi-bin/qrcode/create',
      {
        expire_seconds: expireSeconds,
        action_name: 'QR_STR_SCENE',
        action_info: { scene: { scene_str: qrCodeId } },
      },
      {
        params: { access_token: accessToken },
        timeout: 10_000,
      },
    );

    if (!data.ticket) {
      throw new ServiceUnavailableException(
        `生成微信二维码失败：${this.describeWechatError(data)}`,
      );
    }

    this.qrCodeStore.set(qrCodeId, {
      id: qrCodeId,
      status: QrCodeStatus.PENDING,
      expireTime,
      createdAt: Date.now(),
    });

    return {
      qrCodeUrl: `https://mp.weixin.qq.com/cgi-bin/showqrcode?ticket=${encodeURIComponent(data.ticket)}`,
      qrCodeId,
      expireTime,
    };
  }

  verifyWechatSignature(
    signature: string,
    timestamp: string,
    nonce: string,
  ): boolean {
    if (!signature || !timestamp || !nonce) {
      return false;
    }
    const token = this.getRequiredConfig('WECHAT_TOKEN');
    const digest = createHash('sha1')
      .update([token, timestamp, nonce].sort().join(''))
      .digest('hex');
    return digest === signature;
  }

  markQrCodeScanned(message: WechatMessage, openid: string): boolean {
    const eventKey = message.EventKey;
    if (!eventKey) {
      return false;
    }

    const qrCodeId = eventKey.startsWith('qrscene_')
      ? eventKey.slice('qrscene_'.length)
      : eventKey;
    const state = this.qrCodeStore.get(qrCodeId);
    if (!state) {
      return false;
    }

    if (state.expireTime <= Date.now()) {
      state.status = QrCodeStatus.EXPIRED;
      this.qrCodeStore.set(qrCodeId, state);
      return false;
    }

    state.status = QrCodeStatus.CONFIRMED;
    state.openid = openid;
    state.serviceAccountId = message.ToUserName;
    this.qrCodeStore.set(qrCodeId, state);
    this.logger.log(`微信登录二维码已确认：${qrCodeId}`);
    return true;
  }

  async getQrCodeStatus(qrCodeId: string): Promise<{
    status: QrCodeStatus;
    user?: Record<string, unknown>;
    token?: string;
  }> {
    const state = this.qrCodeStore.get(qrCodeId);
    if (!state) {
      return { status: QrCodeStatus.EXPIRED };
    }

    if (Date.now() >= state.expireTime) {
      this.qrCodeStore.delete(qrCodeId);
      this.loginPromises.delete(qrCodeId);
      return { status: QrCodeStatus.EXPIRED };
    }

    if (state.status !== QrCodeStatus.CONFIRMED || !state.openid) {
      return { status: state.status };
    }

    if (!state.loginResult) {
      let loginPromise = this.loginPromises.get(qrCodeId);
      if (!loginPromise) {
        loginPromise = this.completeWechatLogin(state.openid);
        this.loginPromises.set(qrCodeId, loginPromise);
      }
      state.loginResult = await loginPromise;
      this.loginPromises.delete(qrCodeId);
      this.qrCodeStore.set(qrCodeId, state);
    }

    return {
      status: QrCodeStatus.CONFIRMED,
      ...state.loginResult,
    };
  }

  private async completeWechatLogin(
    openid: string,
  ): Promise<WechatLoginResult> {
    const user = await this.findOrCreateWechatUser(openid);
    const id = user._id.toString();
    const token = this.jwtService.sign({
      userId: id,
      username: user.username,
      email: user.email,
    });
    const userObject = user.toObject() as Record<string, unknown>;
    delete userObject.password;
    this.logger.log(`微信用户登录成功：userId=${id}`);
    return { user: userObject, token };
  }

  private async findOrCreateWechatUser(openid: string): Promise<UserDocument> {
    const now = new Date();
    const user = await this.userModel
      .findOneAndUpdate(
        { openid },
        {
          $set: {
            isWechatBound: true,
            wechatBoundTime: now,
            lastLoginTime: now,
          },
          $setOnInsert: {
            openid,
            username: `旺旺-${randomUUID().slice(0, 6)}`,
            phone: '',
            wwCoinBalance: 20,
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      )
      .exec();

    if (!user) {
      throw new ServiceUnavailableException('创建微信用户失败');
    }
    return user;
  }

  handleSubscribe(message: WechatMessage): string {
    return buildTextReply(
      message,
      '👋 您好，欢迎来到面试汪！使用微信扫码即可登录，继续您的 AI 模拟面试训练。',
    );
  }

  async handleMenuClick(message: WechatMessage): Promise<string> {
    if (message.EventKey !== 'about_us') {
      return buildTextReply(message, '暂时还未定义这个菜单行为');
    }

    const { media_id: mediaId } = await this.uploadImage();
    if (typeof mediaId !== 'string' || !mediaId) {
      throw new ServiceUnavailableException('微信素材上传未返回 media_id');
    }
    return buildImageReply(message, mediaId);
  }

  async uploadImage(): Promise<WechatApiResponse> {
    const configuredPath = this.getRequiredConfig('WECHAT_MENU_IMAGE_PATH');
    const filePath = isAbsolute(configuredPath)
      ? configuredPath
      : resolve(process.cwd(), configuredPath);
    if (!existsSync(filePath)) {
      throw new ServiceUnavailableException('微信菜单图片不存在');
    }

    const form = new FormData();
    form.append('media', createReadStream(filePath));
    const { data } = await axios.post<WechatApiResponse>(
      'https://api.weixin.qq.com/cgi-bin/media/upload',
      form,
      {
        params: { access_token: await this.getAccessToken(), type: 'image' },
        headers: form.getHeaders(),
        timeout: 15_000,
        maxBodyLength: 10 * 1024 * 1024,
      },
    );
    if (data.errcode && data.errcode !== 0) {
      throw new ServiceUnavailableException(
        `上传微信素材失败：${this.describeWechatError(data)}`,
      );
    }
    return data;
  }

  async createMenu(): Promise<WechatApiResponse> {
    const { data } = await axios.post<WechatApiResponse>(
      'https://api.weixin.qq.com/cgi-bin/menu/create',
      {
        button: [
          { type: 'click', name: '关于我们', key: 'about_us' },
          {
            type: 'view',
            name: '简历汪',
            url: this.getRequiredConfig('WECHAT_RESUME_URL'),
          },
          {
            type: 'view',
            name: '面试汪',
            url: this.getRequiredConfig('WECHAT_WEB_URL'),
          },
        ],
      },
      {
        params: { access_token: await this.getAccessToken() },
        timeout: 10_000,
      },
    );
    this.assertWechatApiSuccess(data, '创建公众号菜单');
    return data;
  }

  async deleteMenu(): Promise<WechatApiResponse> {
    const { data } = await axios.post<WechatApiResponse>(
      'https://api.weixin.qq.com/cgi-bin/menu/delete',
      undefined,
      {
        params: { access_token: await this.getAccessToken() },
        timeout: 10_000,
      },
    );
    this.assertWechatApiSuccess(data, '删除公众号菜单');
    return data;
  }

  async getMenu(): Promise<WechatApiResponse> {
    const { data } = await axios.get<WechatApiResponse>(
      'https://api.weixin.qq.com/cgi-bin/menu/get',
      {
        params: { access_token: await this.getAccessToken() },
        timeout: 10_000,
      },
    );
    this.assertWechatApiSuccess(data, '获取公众号菜单');
    return data;
  }

  async assertAdmin(userId: string): Promise<void> {
    const admin = await this.userModel.exists({
      _id: userId,
      roles: 'admin',
      isActive: true,
    });
    if (!admin) {
      throw new ForbiddenException('仅管理员可以管理公众号菜单');
    }
  }

  private assertWechatApiSuccess(
    data: WechatApiResponse,
    operation: string,
  ): void {
    if (data.errcode !== undefined && data.errcode !== 0) {
      throw new ServiceUnavailableException(
        `${operation}失败：${this.describeWechatError(data)}`,
      );
    }
  }

  private removeExpiredQrCodes(): void {
    const now = Date.now();
    for (const [id, state] of this.qrCodeStore) {
      if (state.expireTime <= now) {
        this.qrCodeStore.delete(id);
        this.loginPromises.delete(id);
      }
    }
  }
}
