import { describe, expect, it } from 'vitest';
import { MetricsService } from './metrics.service';

describe('MetricsService', () => {
  it('只输出受控 HTTP、AI、数据库和业务标签', async () => {
    const service = new MetricsService(
      { readyState: 1 } as never,
      { get: () => undefined } as never,
    );
    service.observeHttp('GET', 'UserController.getInfo', 200, 0.05);
    service.observeAi('assessment', 'deepseek', 'success', 1.2);
    service.incrementBusiness('payment_grant', 'success');
    service.observeAiUsage('deepseek', 100, 50);
    const output = await service.registry.metrics();

    expect(output).toContain('route="UserController.getInfo"');
    expect(output).toContain('operation="assessment"');
    expect(output).toContain('event="payment_grant"');
    expect(output).toContain(
      'ai_tokens_total{model="deepseek",direction="input"} 100',
    );
    expect(output).toContain('mongodb_connection_state 1');
    expect(output).toContain('http_requests_total');
    expect(output).toContain('http_request_duration_ms');
    expect(output).toContain('db_query_duration_ms');
    expect(output).toContain('virtual_coin_spent_total');
    expect(output).toContain('interviews_completed_total');
    expect(output).toContain('online_users');
    expect(output).toContain('errors_total');
    expect(output).not.toContain('userId');
  });
});
