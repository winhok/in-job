import { describe, expect, it } from 'vitest';
import { validateEnvironment } from './env.validation';

describe('validateEnvironment', () => {
  it('生产环境拒绝缺少基础配置或短 JWT', () => {
    expect(() => validateEnvironment({ NODE_ENV: 'production' })).toThrow(
      '生产基础配置不完整',
    );
    expect(() =>
      validateEnvironment({
        NODE_ENV: 'production',
        AI_PROVIDER: 'deepseek',
        MONGODB_URI: 'mongodb://db/app',
        CORS_ORIGINS: 'https://example.com',
        DEEPSEEK_API_KEY: 'key',
        JWT_SECRET: 'short',
      }),
    ).toThrow('长度必须至少');
  });

  it('可选第三方服务只要配置一项就必须配置完整组', () => {
    expect(() => validateEnvironment({ ALIPAY_APP_ID: 'app-id' })).toThrow(
      '支付宝配置不完整',
    );
  });
});
