import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { TraceContextService } from '../observability/trace-context.service';

@Injectable()
export class TraceIdMiddleware implements NestMiddleware {
  constructor(private readonly traceContext: TraceContextService) {}

  use(request: Request, response: Response, next: NextFunction): void {
    const incoming = request.header('x-trace-id');
    const traceId =
      incoming && /^[a-zA-Z0-9_-]{8,64}$/.test(incoming)
        ? incoming
        : randomUUID();
    response.setHeader('x-trace-id', traceId);
    this.traceContext.run(traceId, next);
  }
}
