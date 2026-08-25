import {
  BadGatewayException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { StsService } from './sts.service';

const { axiosGet } = vi.hoisted(() => ({ axiosGet: vi.fn() }));
vi.mock('axios', () => ({ default: { get: axiosGet } }));

describe('StsService', () => {
  const userId = '507f1f77bcf86cd799439011';
  const values = new Map<string, string>([
    ['ALIYUN_ACCESS_KEY_ID', 'access-key-id'],
    ['ALIYUN_ACCESS_KEY_SECRET', 'access-key-secret'],
    ['ALIYUN_STS_ROLE_ARN', 'acs:ram::123456789:role/resume-uploader'],
    ['ALIYUN_OSS_BUCKET', 'example-bucket'],
  ]);

  beforeEach(() => vi.clearAllMocks());

  it('配置缺失时不返回伪造凭证', async () => {
    const service = new StsService({ get: vi.fn() } as never);
    await expect(service.assumeUploadRole(userId)).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
    expect(axiosGet).not.toHaveBeenCalled();
  });

  it('请求只允许当前用户简历前缀的短期上传凭证', async () => {
    const credentials = {
      AccessKeyId: 'temporary-id',
      AccessKeySecret: 'temporary-secret',
      SecurityToken: 'temporary-token',
      Expiration: '2026-08-24T01:00:00Z',
    };
    let capturedOptions: unknown;
    axiosGet.mockImplementation((_url: unknown, options: unknown) => {
      capturedOptions = options;
      return Promise.resolve({ data: { Credentials: credentials } });
    });
    const service = new StsService({
      get: vi.fn((key: string) => values.get(key)),
    } as never);

    await expect(service.assumeUploadRole(userId)).resolves.toEqual(
      credentials,
    );
    const options = capturedOptions as {
      params: Record<string, string>;
    };
    expect(options.params.DurationSeconds).toBe('900');
    expect(options.params.Policy).toContain(
      `example-bucket/user-resumes/${userId}/*`,
    );
    expect(options.params.Signature).toBeTruthy();
  });

  it('上游异常时只返回受控错误', async () => {
    axiosGet.mockRejectedValue(new Error('upstream details'));
    const service = new StsService({
      get: vi.fn((key: string) => values.get(key)),
    } as never);
    await expect(service.assumeUploadRole(userId)).rejects.toBeInstanceOf(
      BadGatewayException,
    );
  });
});
