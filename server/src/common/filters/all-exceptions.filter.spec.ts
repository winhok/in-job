import { ArgumentsHost } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { AllExceptionsFilter } from './all-exceptions.filter';

describe('AllExceptionsFilter', () => {
  it('未知异常不向客户端泄露内部消息或查询参数', () => {
    const json = vi.fn();
    const status = vi.fn().mockReturnValue({ json });
    const host = {
      switchToHttp: () => ({
        getResponse: () => ({ status }),
        getRequest: () => ({
          method: 'GET',
          path: '/private',
          url: '/private?token=secret',
        }),
      }),
    } as unknown as ArgumentsHost;

    new AllExceptionsFilter().catch(
      new Error('database password leaked in stack'),
      host,
    );
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 500,
        message: '服务器内部错误',
        path: '/private',
      }),
    );
    expect(JSON.stringify(json.mock.calls[0][0])).not.toContain('password');
    expect(JSON.stringify(json.mock.calls[0][0])).not.toContain('token');
  });
});
