import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { ConnectionStates, type Connection } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import {
  collectDefaultMetrics,
  Counter,
  Gauge,
  Histogram,
  Registry,
} from 'prom-client';

@Injectable()
export class MetricsService {
  readonly registry = new Registry();
  private readonly httpDuration = new Histogram({
    name: 'http_request_duration_seconds',
    help: 'HTTP request duration in seconds',
    labelNames: ['method', 'route', 'status'] as const,
    buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
    registers: [this.registry],
  });
  readonly httpRequestsTotal = new Counter({
    name: 'http_requests_total',
    help: 'HTTP request count',
    labelNames: ['method', 'route', 'status'] as const,
    registers: [this.registry],
  });
  readonly httpRequestDurationMs = new Histogram({
    name: 'http_request_duration_ms',
    help: 'HTTP request duration in milliseconds',
    labelNames: ['method', 'route'] as const,
    buckets: [10, 50, 100, 500, 1_000, 2_000, 5_000, 10_000],
    registers: [this.registry],
  });
  readonly dbQueryDurationMs = new Histogram({
    name: 'db_query_duration_ms',
    help: 'Database query duration in milliseconds',
    labelNames: ['operation', 'collection'] as const,
    buckets: [10, 50, 100, 500, 1_000],
    registers: [this.registry],
  });
  readonly dbActiveConnections = new Gauge({
    name: 'db_active_connections',
    help: 'Active MongoDB connection indicator',
    registers: [this.registry],
  });
  private readonly aiCalls = new Counter({
    name: 'ai_calls_total',
    help: 'AI calls by operation, model and result',
    labelNames: ['operation', 'model', 'result'] as const,
    registers: [this.registry],
  });
  private readonly aiDuration = new Histogram({
    name: 'ai_call_duration_seconds',
    help: 'AI call duration in seconds',
    labelNames: ['operation', 'model', 'result'] as const,
    buckets: [0.1, 0.5, 1, 2.5, 5, 10, 30, 60, 120],
    registers: [this.registry],
  });
  private readonly businessEvents = new Counter({
    name: 'business_events_total',
    help: 'Low-cardinality business events',
    labelNames: ['event', 'result'] as const,
    registers: [this.registry],
  });
  private readonly aiTokens = new Counter({
    name: 'ai_tokens_total',
    help: 'AI tokens by model and direction',
    labelNames: ['model', 'direction'] as const,
    registers: [this.registry],
  });
  private readonly aiCost = new Counter({
    name: 'ai_estimated_cost_yuan_total',
    help: 'Estimated AI cost in yuan',
    labelNames: ['model'] as const,
    registers: [this.registry],
  });
  readonly aiCallDurationMs = new Histogram({
    name: 'ai_call_duration_ms',
    help: 'AI call duration in milliseconds',
    labelNames: ['service', 'model'] as const,
    buckets: [100, 500, 1_000, 2_000, 5_000, 10_000, 30_000],
    registers: [this.registry],
  });
  readonly aiTokensUsed = new Counter({
    name: 'ai_tokens_used_total',
    help: 'AI token usage',
    labelNames: ['service', 'model', 'type'] as const,
    registers: [this.registry],
  });
  readonly aiCostTotal = new Counter({
    name: 'ai_cost_total',
    help: 'Estimated AI cost in yuan',
    labelNames: ['service', 'model'] as const,
    registers: [this.registry],
  });
  readonly virtualCoinSpent = new Counter({
    name: 'virtual_coin_spent_total',
    help: 'Virtual coin spending',
    labelNames: ['package_type'] as const,
    registers: [this.registry],
  });
  readonly interviewsCompleted = new Counter({
    name: 'interviews_completed_total',
    help: 'Completed interviews',
    registers: [this.registry],
  });
  readonly onlineUsers = new Gauge({
    name: 'online_users',
    help: 'Current online users supplied by the application',
    registers: [this.registry],
  });
  readonly errorsTotal = new Counter({
    name: 'errors_total',
    help: 'Application errors',
    labelNames: ['type', 'service'] as const,
    registers: [this.registry],
  });
  private readonly aiCacheRequests = new Counter({
    name: 'ai_cache_requests_total',
    help: 'AI cache requests by operation and result',
    labelNames: ['operation', 'result'] as const,
    registers: [this.registry],
  });
  private readonly ragRequests = new Counter({
    name: 'rag_requests_total',
    help: 'RAG operations by path and result',
    labelNames: ['path', 'result'] as const,
    registers: [this.registry],
  });

  constructor(
    @InjectConnection() connection: Connection,
    private readonly configService: ConfigService,
  ) {
    collectDefaultMetrics({ register: this.registry, prefix: 'in_job_' });
    const activeConnections = this.dbActiveConnections;
    new Gauge({
      name: 'mongodb_connection_state',
      help: 'Mongoose connection ready state',
      registers: [this.registry],
      collect() {
        this.set(connection.readyState);
        activeConnections.set(
          connection.readyState === ConnectionStates.connected ? 1 : 0,
        );
      },
    });
  }

  observeHttp(
    method: string,
    route: string,
    status: number,
    seconds: number,
  ): void {
    this.httpDuration.observe(
      { method, route, status: String(status) },
      seconds,
    );
    this.httpRequestsTotal.inc({ method, route, status: String(status) });
    this.httpRequestDurationMs.observe({ method, route }, seconds * 1_000);
    if (status >= 500) {
      this.errorsTotal.inc({ type: 'http_error', service: 'api' });
    }
  }

  observeAi(
    operation: string,
    model: string,
    result: 'success' | 'error',
    seconds: number,
  ): void {
    this.aiCalls.inc({ operation, model, result });
    this.aiDuration.observe({ operation, model, result }, seconds);
    this.aiCallDurationMs.observe(
      { service: operation, model },
      seconds * 1_000,
    );
  }

  incrementBusiness(event: string, result: 'success' | 'error'): void {
    this.businessEvents.inc({ event, result });
  }

  incrementAiCache(
    operation: string,
    result: 'hit' | 'miss' | 'coalesced',
  ): void {
    this.aiCacheRequests.inc({ operation, result });
  }

  incrementRag(path: 'vector' | 'text' | 'index', result: 'success' | 'error') {
    this.ragRequests.inc({ path, result });
  }

  observeAiUsage(
    model: string,
    inputTokens: number,
    outputTokens: number,
  ): void {
    if (inputTokens > 0)
      this.aiTokens.inc({ model, direction: 'input' }, inputTokens);
    if (outputTokens > 0)
      this.aiTokens.inc({ model, direction: 'output' }, outputTokens);
    if (inputTokens > 0) {
      this.aiTokensUsed.inc(
        { service: 'interview', model, type: 'prompt' },
        inputTokens,
      );
    }
    if (outputTokens > 0) {
      this.aiTokensUsed.inc(
        { service: 'interview', model, type: 'completion' },
        outputTokens,
      );
    }
    const inputRate =
      Number(this.configService.get<string>('AI_INPUT_COST_PER_MILLION')) || 0;
    const outputRate =
      Number(this.configService.get<string>('AI_OUTPUT_COST_PER_MILLION')) || 0;
    const estimatedCost =
      (inputTokens * inputRate + outputTokens * outputRate) / 1_000_000;
    if (estimatedCost > 0) this.aiCost.inc({ model }, estimatedCost);
    if (estimatedCost > 0) {
      this.aiCostTotal.inc({ service: 'interview', model }, estimatedCost);
    }
  }

  getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  getRegister(): Registry {
    return this.registry;
  }
}
