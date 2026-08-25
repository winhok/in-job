import { HttpException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { RateLimitGuard } from './rate-limit.guard';

describe('RateLimitGuard', () => {
  it('达到用户路由限额后返回 429', () => {
    const reflector = {
      getAllAndOverride: vi
        .fn()
        .mockReturnValue({ limit: 2, windowMs: 60_000 }),
    };
    const guard = new RateLimitGuard(
      reflector as never,
      { verify: vi.fn() } as never,
    );
    const context = {
      getHandler: () => function handler() {},
      getClass: () => class Controller {},
      switchToHttp: () => ({
        getRequest: () => ({
          user: { userId: 'user-1' },
          ip: '127.0.0.1',
          header: () => undefined,
        }),
      }),
    };

    expect(guard.canActivate(context as never)).toBe(true);
    expect(guard.canActivate(context as never)).toBe(true);
    expect(() => guard.canActivate(context as never)).toThrow(HttpException);
  });
});
