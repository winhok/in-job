/* eslint-disable @typescript-eslint/unbound-method, @typescript-eslint/no-unsafe-assignment */
import { createHmac } from 'node:crypto';
import axios from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DingTalkAlertService } from './dingtalk-alert.service';

vi.mock('axios', () => ({
  default: { post: vi.fn() },
}));

describe('DingTalkAlertService', () => {
  const values: Record<string, string> = {
    ALERT_RELAY_TOKEN: 'relay-token',
    DINGTALK_WEBHOOK_URL:
      'https://oapi.dingtalk.com/robot/send?access_token=test-token',
    DINGTALK_SECRET: 'SEC-test-secret',
  };
  const service = new DingTalkAlertService({
    get: vi.fn((key: string) => values[key]),
  } as never);

  beforeEach(() => vi.clearAllMocks());

  it('使用恒定时间摘要校验 Bearer token', () => {
    expect(service.verifyRelayToken('Bearer relay-token')).toBe(true);
    expect(service.verifyRelayToken('Bearer wrong')).toBe(false);
    expect(service.verifyRelayToken(undefined)).toBe(false);
  });

  it('按钉钉规则生成 timestamp 与 HMAC-SHA256 签名', () => {
    const timestamp = 1_700_000_000_000;
    const signed = new URL(
      service.buildSignedWebhook(
        values.DINGTALK_WEBHOOK_URL,
        values.DINGTALK_SECRET,
        timestamp,
      ),
    );
    const expected = createHmac('sha256', values.DINGTALK_SECRET)
      .update(`${timestamp}\n${values.DINGTALK_SECRET}`)
      .digest('base64');

    expect(signed.searchParams.get('access_token')).toBe('test-token');
    expect(signed.searchParams.get('timestamp')).toBe(String(timestamp));
    expect(signed.searchParams.get('sign')).toBe(expected);
  });

  it('转换 Grafana payload 并发送 markdown', async () => {
    vi.mocked(axios.post).mockResolvedValue({
      data: { errcode: 0, errmsg: 'ok' },
    });

    await service.forward({
      status: 'firing',
      commonLabels: { alertname: 'HighErrorRate' },
      alerts: [
        {
          status: 'firing',
          labels: { alertname: 'HighErrorRate', severity: 'critical' },
          annotations: { summary: '5xx 错误率过高' },
          startsAt: '2026-08-24T12:00:00Z',
        },
      ],
    });

    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining('sign='),
      expect.objectContaining({
        msgtype: 'markdown',
        markdown: expect.objectContaining({
          title: '[告警触发] HighErrorRate',
        }),
      }),
      { timeout: 10_000 },
    );
  });

  it('钉钉业务错误会让中继请求失败', async () => {
    vi.mocked(axios.post).mockResolvedValue({
      data: { errcode: 310000, errmsg: 'sign not match' },
    });
    await expect(service.forward({ status: 'firing' })).rejects.toThrow(
      'sign not match',
    );
  });

  it('网络错误不会泄露 webhook 或签名地址', async () => {
    vi.mocked(axios.post).mockRejectedValue(
      new Error(values.DINGTALK_WEBHOOK_URL),
    );
    await expect(service.forward({ status: 'firing' })).rejects.toThrow(
      '钉钉告警请求失败',
    );
  });
});
