import { ServiceUnavailableException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { ResumeStorageService } from './resume-storage.service';

describe('ResumeStorageService', () => {
  it('根据服务端 bucket 和 region 构造对象 URL', () => {
    const values = new Map([
      ['ALIYUN_OSS_BUCKET', 'private-resumes'],
      ['ALIYUN_OSS_REGION', 'oss-cn-beijing'],
    ]);
    const service = new ResumeStorageService({
      get: vi.fn((key: string) => values.get(key)),
    } as never);
    expect(
      service.canonicalUrl('user-resumes/user-1/resumes/中文 简历.pdf'),
    ).toBe(
      'https://private-resumes.oss-cn-beijing.aliyuncs.com/user-resumes/user-1/resumes/%E4%B8%AD%E6%96%87%20%E7%AE%80%E5%8E%86.pdf',
    );
  });

  it('缺少服务端存储配置时拒绝信任客户端 URL', () => {
    const service = new ResumeStorageService({ get: vi.fn() } as never);
    expect(() => service.canonicalUrl('user-resumes/a/resume.pdf')).toThrow(
      ServiceUnavailableException,
    );
  });
});
