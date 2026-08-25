import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Observable, tap } from 'rxjs';
import { MetricsService } from '../metrics/metrics.service';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly metrics: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const startedAt = process.hrtime.bigint();
    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    const route = `${context.getClass().name}.${context.getHandler().name}`;
    return next.handle().pipe(
      tap({
        finalize: () => {
          const seconds = Number(process.hrtime.bigint() - startedAt) / 1e9;
          this.metrics.observeHttp(
            request.method,
            route,
            response.statusCode,
            seconds,
          );
        },
      }),
    );
  }
}
