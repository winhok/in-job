import { Injectable, Logger, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { createHash } from 'node:crypto';
import { Model } from 'mongoose';
import { MetricsService } from '../common/metrics/metrics.service';
import {
  AiResultCache,
  AiResultCacheDocument,
} from './schemas/ai-result-cache.schema';

export interface AiCacheOptions {
  operation: string;
  scopeKey: string;
  provider: string;
  model: string;
  locale: 'zh-CN' | 'en-US';
  promptVersion: string;
  input: unknown;
  ttlSeconds?: number;
}

@Injectable()
export class AiCacheService {
  private readonly logger = new Logger(AiCacheService.name);
  private readonly inFlight = new Map<string, Promise<unknown>>();

  constructor(
    @InjectModel(AiResultCache.name)
    private readonly cacheModel: Model<AiResultCacheDocument>,
    private readonly configService: ConfigService,
    @Optional() private readonly metrics?: MetricsService,
  ) {}

  async getOrCompute<T>(
    options: AiCacheOptions,
    compute: () => Promise<T>,
  ): Promise<T> {
    if (!this.isEnabled()) return compute();
    if (!options.scopeKey.trim()) throw new Error('AI cache scopeKey 不能为空');
    const cacheKey = this.createKey(options);
    const cached = await this.cacheModel.findOneAndUpdate(
      { cacheKey, expiresAt: { $gt: new Date() } },
      { $inc: { hitCount: 1 }, $set: { lastHitAt: new Date() } },
      { new: true },
    );
    if (cached) {
      this.metrics?.incrementAiCache(options.operation, 'hit');
      return cached.value as T;
    }

    this.metrics?.incrementAiCache(options.operation, 'miss');
    const running = this.inFlight.get(cacheKey) as Promise<T> | undefined;
    if (running) {
      this.metrics?.incrementAiCache(options.operation, 'coalesced');
      return running;
    }

    const promise = this.computeAndStore(cacheKey, options, compute);
    this.inFlight.set(cacheKey, promise);
    try {
      return await promise;
    } finally {
      this.inFlight.delete(cacheKey);
    }
  }

  async invalidateScope(scopeKey: string, operation?: string): Promise<number> {
    const result = await this.cacheModel.deleteMany({
      scopeKey,
      ...(operation ? { operation } : {}),
    });
    return result.deletedCount;
  }

  createKey(options: AiCacheOptions): string {
    const canonical = this.canonicalize({
      operation: options.operation,
      scopeKey: options.scopeKey,
      provider: options.provider,
      model: options.model,
      locale: options.locale,
      promptVersion: options.promptVersion,
      input: options.input,
    });
    return createHash('sha256').update(canonical).digest('hex');
  }

  private async computeAndStore<T>(
    cacheKey: string,
    options: AiCacheOptions,
    compute: () => Promise<T>,
  ): Promise<T> {
    const value = await compute();
    const serialized = JSON.stringify(value);
    const maxBytes =
      Number(this.configService.get<string>('AI_CACHE_MAX_VALUE_BYTES')) ||
      1_000_000;
    if (Buffer.byteLength(serialized) > maxBytes) {
      this.logger.warn(
        `AI 缓存结果过大，跳过写入: operation=${options.operation}`,
      );
      return value;
    }
    const ttlSeconds = Math.max(
      60,
      options.ttlSeconds ||
        Number(this.configService.get<string>('AI_CACHE_TTL_SECONDS')) ||
        86_400,
    );
    await this.cacheModel.findOneAndUpdate(
      { cacheKey },
      {
        $set: {
          operation: options.operation,
          scopeKey: options.scopeKey,
          provider: options.provider,
          model: options.model,
          locale: options.locale,
          promptVersion: options.promptVersion,
          value,
          expiresAt: new Date(Date.now() + ttlSeconds * 1_000),
        },
        $setOnInsert: { hitCount: 0 },
      },
      { upsert: true, new: true },
    );
    return value;
  }

  private isEnabled(): boolean {
    return this.configService.get<string>('AI_CACHE_ENABLED') !== 'false';
  }

  private canonicalize(value: unknown): string {
    return JSON.stringify(this.normalize(value));
  }

  private normalize(value: unknown): unknown {
    if (value instanceof Date) return value.toISOString();
    if (Array.isArray(value)) return value.map((item) => this.normalize(item));
    if (value && typeof value === 'object') {
      return Object.fromEntries(
        Object.entries(value)
          .filter(([, item]) => item !== undefined)
          .sort(([left], [right]) => left.localeCompare(right))
          .map(([key, item]) => [key, this.normalize(item)]),
      );
    }
    return value;
  }
}
