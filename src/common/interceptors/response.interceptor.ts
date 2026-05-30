import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ResponseFormat<T = any> {
  code: number;
  message: string;
  data: T;
  timestamp: string;
  path: string;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<
  T,
  ResponseFormat<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ResponseFormat<T>> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();

    return next.handle().pipe(
      map((data: T): ResponseFormat<T> => {
        // empty data
        if (data === null || data === undefined) {
          return {
            code: HttpStatus.OK,
            message: 'Success',
            data: null as T,
            timestamp: new Date().toISOString(),
            path: request.url,
          };
        }
        // already in the standard format, pass it through
        if (
          data &&
          typeof data === 'object' &&
          'code' in data &&
          'message' in data
        ) {
          return {
            ...(data as unknown as ResponseFormat<T>),
            timestamp: new Date().toISOString(),
            path: request.url,
          };
        }

        // standard success response format
        return {
          code: HttpStatus.OK,
          message: 'Success',
          data: data,
          timestamp: new Date().toISOString(),
          path: request.url,
        };
      }),
    );
  }
}
