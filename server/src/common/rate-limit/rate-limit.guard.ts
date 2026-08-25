import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { RATE_LIMIT_KEY, RateLimitOptions } from './rate-limit.decorator';

@Injectable()
export class RateLimitGuard
  implements CanActivate, OnModuleInit, OnModuleDestroy
{
  private readonly buckets = new Map<
    string,
    { count: number; resetAt: number }
  >();
  private cleanupTimer?: NodeJS.Timeout;

  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
  ) {}

  onModuleInit(): void {
    this.cleanupTimer = setInterval(() => this.cleanup(), 60_000);
    this.cleanupTimer.unref();
  }

  onModuleDestroy(): void {
    if (this.cleanupTimer) clearInterval(this.cleanupTimer);
  }

  canActivate(context: ExecutionContext): boolean {
    const options = this.reflector.getAllAndOverride<RateLimitOptions>(
      RATE_LIMIT_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!options) return true;
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: { userId?: string } }>();
    const identity =
      request.user?.userId ||
      this.readJwtUserId(request.header('authorization')) ||
      request.ip ||
      'anonymous';
    const route = `${context.getClass().name}.${context.getHandler().name}`;
    const key = `${route}:${identity}`;
    const now = Date.now();
    const current = this.buckets.get(key);
    if (!current || current.resetAt <= now) {
      this.buckets.set(key, { count: 1, resetAt: now + options.windowMs });
      return true;
    }
    if (current.count >= options.limit) {
      throw new HttpException(
        '请求过于频繁，请稍后再试',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    current.count += 1;
    return true;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, bucket] of this.buckets) {
      if (bucket.resetAt <= now) this.buckets.delete(key);
    }
  }

  private readJwtUserId(authorization?: string): string | undefined {
    if (!authorization?.startsWith('Bearer ')) return undefined;
    try {
      const payload: unknown = this.jwtService.verify(
        authorization.slice('Bearer '.length),
      );
      if (!payload || typeof payload !== 'object') return undefined;
      const userId = (payload as Record<string, unknown>).userId;
      return typeof userId === 'string' ? userId : undefined;
    } catch {
      return undefined;
    }
  }
}
