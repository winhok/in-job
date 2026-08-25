import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import { MetricsService } from './metrics.service';

@Controller('metrics')
export class MetricsController {
  constructor(private readonly metrics: MetricsService) {}

  @Get()
  async metricsText(@Res() response: Response): Promise<void> {
    response
      .type('text/plain; version=0.0.4; charset=utf-8')
      .send(await this.metrics.registry.metrics());
  }
}
