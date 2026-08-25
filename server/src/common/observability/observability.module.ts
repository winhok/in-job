import { Global, Module } from '@nestjs/common';
import { MetricsController } from '../metrics/metrics.controller';
import { MetricsService } from '../metrics/metrics.service';
import { TraceContextService } from './trace-context.service';
import { HealthController } from '../health/health.controller';

@Global()
@Module({
  controllers: [MetricsController, HealthController],
  providers: [MetricsService, TraceContextService],
  exports: [MetricsService, TraceContextService],
})
export class ObservabilityModule {}
