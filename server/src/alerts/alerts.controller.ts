import {
  Body,
  Controller,
  Headers,
  HttpCode,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { Public } from '../auth/public.decorator';
import { DingTalkAlertService } from './dingtalk-alert.service';
import type { GrafanaAlertPayload } from './dingtalk-alert.service';

@Controller('internal/alerts')
export class AlertsController {
  constructor(private readonly dingTalkAlertService: DingTalkAlertService) {}

  @Public()
  @Post('dingtalk')
  @HttpCode(202)
  async forwardDingTalk(
    @Headers('authorization') authorization: string | undefined,
    @Body() payload: GrafanaAlertPayload,
  ) {
    if (!this.dingTalkAlertService.verifyRelayToken(authorization)) {
      throw new UnauthorizedException('告警中继鉴权失败');
    }
    await this.dingTalkAlertService.forward(payload);
    return { accepted: true };
  }
}
