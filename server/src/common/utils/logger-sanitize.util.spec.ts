import { describe, expect, it } from 'vitest';
import { LoggerSanitizeUtil } from './logger-sanitize.util';

describe('LoggerSanitizeUtil', () => {
  it('递归隐藏凭据、认证头和简历正文', () => {
    const result = LoggerSanitizeUtil.sanitize({
      authorization: 'Bearer secret',
      nested: {
        password: '123456',
        resumeContent: '候选人完整简历',
        safe: '可记录',
      },
    });
    expect(result).toEqual({
      authorization: '[REDACTED]',
      nested: {
        password: '[REDACTED]',
        resumeContent: '[REDACTED]',
        safe: '可记录',
      },
    });
  });
});
