import { Injectable, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { MetricsService } from '../common/metrics/metrics.service';

interface GrafanaAlert {
  status?: string;
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
  startsAt?: string;
  endsAt?: string;
  generatorURL?: string;
}

export interface GrafanaAlertPayload {
  receiver?: string;
  status?: string;
  alerts?: GrafanaAlert[];
  commonLabels?: Record<string, string>;
  commonAnnotations?: Record<string, string>;
  externalURL?: string;
  truncatedAlerts?: number;
}

@Injectable()
export class DingTalkAlertService {
  constructor(
    private readonly configService: ConfigService,
    @Optional() private readonly metricsService?: MetricsService,
  ) {}

  verifyRelayToken(authorization?: string): boolean {
    const expected = this.configService.get<string>('ALERT_RELAY_TOKEN');
    const supplied = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
    if (!expected || !supplied) return false;
    return timingSafeEqual(
      createHash('sha256').update(expected).digest(),
      createHash('sha256').update(supplied).digest(),
    );
  }

  async forward(payload: GrafanaAlertPayload): Promise<void> {
    const webhook = this.configService.get<string>('DINGTALK_WEBHOOK_URL');
    const secret = this.configService.get<string>('DINGTALK_SECRET');
    if (!webhook || !secret) throw new Error('钉钉告警配置不完整');
    const signedUrl = this.buildSignedWebhook(webhook, secret, Date.now());
    const message = this.formatGrafanaAlert(payload);
    let response: { data: unknown };
    try {
      response = await axios.post(
        signedUrl,
        {
          msgtype: 'markdown',
          markdown: message,
          at: { isAtAll: false },
        },
        { timeout: 10_000 },
      );
    } catch {
      this.metricsService?.incrementBusiness('dingtalk_alert', 'error');
      throw new Error('钉钉告警请求失败');
    }
    const data = response.data as { errcode?: number; errmsg?: string };
    if (data.errcode !== 0) {
      this.metricsService?.incrementBusiness('dingtalk_alert', 'error');
      throw new Error(`钉钉告警发送失败: ${data.errmsg || data.errcode}`);
    }
    this.metricsService?.incrementBusiness('dingtalk_alert', 'success');
  }

  buildSignedWebhook(
    webhook: string,
    secret: string,
    timestamp: number,
  ): string {
    const url = new URL(webhook);
    if (
      url.protocol !== 'https:' ||
      (url.hostname !== 'oapi.dingtalk.com' &&
        !url.hostname.endsWith('.dingtalk.com'))
    ) {
      throw new Error('DINGTALK_WEBHOOK_URL 必须是钉钉 HTTPS 地址');
    }
    const signature = createHmac('sha256', secret)
      .update(`${timestamp}\n${secret}`)
      .digest('base64');
    url.searchParams.set('timestamp', String(timestamp));
    url.searchParams.set('sign', signature);
    return url.toString();
  }

  formatGrafanaAlert(payload: GrafanaAlertPayload): {
    title: string;
    text: string;
  } {
    const status = payload.status === 'resolved' ? '已恢复' : '告警触发';
    const alerts = Array.isArray(payload.alerts)
      ? payload.alerts.slice(0, 20)
      : [];
    const commonName =
      payload.commonLabels?.alertname ||
      payload.commonAnnotations?.summary ||
      'in-job 监控告警';
    const lines = alerts.flatMap((alert, index) => {
      const labels = Object.entries(alert.labels || {})
        .slice(0, 12)
        .map(([key, value]) => `${key}=${value}`)
        .join(', ');
      const summary =
        alert.annotations?.summary ||
        alert.annotations?.description ||
        '无详细说明';
      return [
        `### ${index + 1}. ${alert.labels?.alertname || commonName}`,
        `- 状态：${alert.status || payload.status || 'unknown'}`,
        `- 摘要：${summary}`,
        labels ? `- 标签：${labels}` : '',
        alert.startsAt ? `- 开始：${alert.startsAt}` : '',
        alert.generatorURL ? `- [查看告警详情](${alert.generatorURL})` : '',
        '',
      ].filter(Boolean);
    });
    if (alerts.length === 0) lines.push('- Grafana 未提供具体告警条目');
    if (payload.truncatedAlerts) {
      lines.push(`- 另有 ${payload.truncatedAlerts} 条告警被截断`);
    }
    return {
      title: `[${status}] ${commonName}`.slice(0, 100),
      text: [`## ${status}：${commonName}`, '', ...lines]
        .join('\n')
        .slice(0, 18_000),
    };
  }
}
