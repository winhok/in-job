import { UnauthorizedException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { AlertsController } from './alerts.controller';

describe('AlertsController DingTalk relay', () => {
  function createController(authorized = true) {
    const dingTalkAlertService = {
      verifyRelayToken: vi.fn().mockReturnValue(authorized),
      forward: vi.fn().mockResolvedValue(undefined),
    };
    return {
      controller: new AlertsController(dingTalkAlertService as never),
      dingTalkAlertService,
    };
  }

  it('鉴权通过后转发 Grafana 告警并返回 accepted', async () => {
    const { controller, dingTalkAlertService } = createController();
    const payload = {
      status: 'firing',
      commonLabels: { alertname: 'HighErrorRate' },
    };

    await expect(
      controller.forwardDingTalk('Bearer relay-token', payload),
    ).resolves.toEqual({ accepted: true });
    expect(dingTalkAlertService.verifyRelayToken).toHaveBeenCalledWith(
      'Bearer relay-token',
    );
    expect(dingTalkAlertService.forward).toHaveBeenCalledWith(payload);
  });

  it('鉴权失败时拒绝请求且不会向钉钉转发', async () => {
    const { controller, dingTalkAlertService } = createController(false);

    await expect(
      controller.forwardDingTalk(undefined, { status: 'firing' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(dingTalkAlertService.forward).not.toHaveBeenCalled();
  });
});
