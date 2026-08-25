import { Module } from '@nestjs/common';
import { AlertsController } from './alerts.controller';
import { DingTalkAlertService } from './dingtalk-alert.service';

@Module({
  controllers: [AlertsController],
  providers: [DingTalkAlertService],
})
export class AlertsModule {}
