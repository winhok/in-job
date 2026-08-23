import { ForbiddenException } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QrCodeStatus } from './dto/wechat.dto';
import { WechatService } from './wechat.service';

const { getMock, postMock } = vi.hoisted(() => ({
  getMock: vi.fn(),
  postMock: vi.fn(),
}));

vi.mock('axios', () => ({
  default: {
    get: getMock,
    post: postMock,
  },
}));

describe('WechatService', () => {
  const config = new Map<string, string>([
    ['WECHAT_APP_ID', 'app-id'],
    ['WECHAT_APP_SECRET', 'app-secret'],
    ['WECHAT_TOKEN', 'callback-token'],
    ['WECHAT_RESUME_URL', 'https://example.com/resume'],
    ['WECHAT_WEB_URL', 'https://example.com'],
  ]);
  const userDocument = {
    _id: { toString: () => 'user-id' },
    username: '旺旺-user',
    email: undefined,
    toObject: () => ({
      _id: 'user-id',
      username: '旺旺-user',
      password: 'hidden',
    }),
  };

  function createService() {
    const configService = {
      get: vi.fn((name: string) => config.get(name)),
    };
    const jwtService = {
      sign: vi.fn().mockReturnValue('signed-jwt'),
    };
    const exec = vi.fn().mockResolvedValue(userDocument);
    const userModel = {
      findOneAndUpdate: vi.fn().mockReturnValue({ exec }),
      exists: vi.fn().mockResolvedValue({ _id: 'user-id' }),
    };
    const service = new WechatService(
      configService as never,
      jwtService as never,
      userModel as never,
    );
    return { service, jwtService, userModel, exec };
  }

  beforeEach(() => {
    vi.clearAllMocks();
    postMock.mockImplementation((url: string) => {
      if (url.endsWith('/stable_token')) {
        return Promise.resolve({
          data: { access_token: 'wechat-token', expires_in: 7200 },
        });
      }
      if (url.endsWith('/qrcode/create')) {
        return Promise.resolve({ data: { ticket: 'qr-ticket' } });
      }
      if (url.endsWith('/menu/create')) {
        return Promise.resolve({ data: { errcode: 0, errmsg: 'ok' } });
      }
      return Promise.resolve({ data: {} });
    });
  });

  it('缓存 access token 并为每次登录生成独立二维码', async () => {
    const { service } = createService();

    const first = await service.generateLoginQrCode();
    const second = await service.generateLoginQrCode();

    expect(first.qrCodeId).not.toBe(second.qrCodeId);
    expect(first.qrCodeUrl).toContain('qr-ticket');
    expect(postMock).toHaveBeenCalledTimes(3);
    expect(
      postMock.mock.calls.filter(([url]) =>
        String(url).endsWith('/stable_token'),
      ),
    ).toHaveLength(1);
  });

  it('按照微信规则校验回调签名', () => {
    const { service } = createService();
    const timestamp = '1700000000';
    const nonce = 'nonce';
    const signature = createHash('sha1')
      .update(['callback-token', timestamp, nonce].sort().join(''))
      .digest('hex');

    expect(service.verifyWechatSignature(signature, timestamp, nonce)).toBe(
      true,
    );
    expect(service.verifyWechatSignature('invalid', timestamp, nonce)).toBe(
      false,
    );
  });

  it('扫码确认后只创建一次用户并返回兼容现有策略的 JWT', async () => {
    const { service, jwtService, userModel } = createService();
    const qrCode = await service.generateLoginQrCode();

    service.markQrCodeScanned(
      {
        EventKey: `qrscene_${qrCode.qrCodeId}`,
        ToUserName: 'service-account',
      },
      'openid-1',
    );
    const first = await service.getQrCodeStatus(qrCode.qrCodeId);
    const second = await service.getQrCodeStatus(qrCode.qrCodeId);

    expect(first).toMatchObject({
      status: QrCodeStatus.CONFIRMED,
      token: 'signed-jwt',
      user: { _id: 'user-id', username: '旺旺-user' },
    });
    expect(second.token).toBe('signed-jwt');
    expect(userModel.findOneAndUpdate).toHaveBeenCalledTimes(1);
    expect(jwtService.sign).toHaveBeenCalledWith({
      userId: 'user-id',
      username: '旺旺-user',
      email: undefined,
    });
    expect(first.user).not.toHaveProperty('password');
  });

  it('不存在的二维码返回过期状态', async () => {
    const { service } = createService();

    await expect(service.getQrCodeStatus('missing')).resolves.toEqual({
      status: QrCodeStatus.EXPIRED,
    });
  });

  it('仅允许激活的管理员调用菜单管理能力', async () => {
    const { service, userModel } = createService();
    await expect(service.assertAdmin('user-id')).resolves.toBeUndefined();
    expect(userModel.exists).toHaveBeenCalledWith({
      _id: 'user-id',
      roles: 'admin',
      isActive: true,
    });

    userModel.exists.mockResolvedValueOnce(null);
    await expect(service.assertAdmin('normal-user')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('使用运行时地址创建公众号菜单且不硬编码课程域名', async () => {
    const { service } = createService();

    await expect(service.createMenu()).resolves.toEqual({
      errcode: 0,
      errmsg: 'ok',
    });
    const menuCall = postMock.mock.calls.find(([url]) =>
      String(url).endsWith('/menu/create'),
    );
    expect(menuCall?.[1]).toEqual({
      button: [
        { type: 'click', name: '关于我们', key: 'about_us' },
        {
          type: 'view',
          name: '简历汪',
          url: 'https://example.com/resume',
        },
        {
          type: 'view',
          name: '面试汪',
          url: 'https://example.com',
        },
      ],
    });
  });
});
