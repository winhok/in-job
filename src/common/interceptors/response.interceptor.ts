import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpStatus,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Request } from 'express';

export interface ResponseFormat<T = unknown> {
  code: number;
  message: string;
  data: T;
  timestamp: string;
  path: string;
}

function isResponseFormat<T>(value: T): value is T & ResponseFormat<T> {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Partial<ResponseFormat<T>>;
  return (
    typeof candidate.code === 'number' && typeof candidate.message === 'string'
  );
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<
  T,
  ResponseFormat<T | null>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ResponseFormat<T | null>> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();

    return next.handle().pipe(
      map((data: T): ResponseFormat<T | null> => {
        // 处理空数据
        if (data === null || data === undefined) {
          return {
            code: HttpStatus.OK,
            message: '操作成功',
            data: null,
            timestamp: new Date().toISOString(),
            path: request.url,
          };
        }

        // 如果返回的数据已经是标准格式，直接返回
        if (isResponseFormat(data)) {
          return {
            ...data,
            timestamp: new Date().toISOString(),
            path: request.url,
          };
        }

        // 标准成功响应格式
        return {
          code: HttpStatus.OK,
          message: '操作成功',
          data: data,
          timestamp: new Date().toISOString(),
          path: request.url,
        };
      }),
    );
  }
}
