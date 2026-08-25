import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface HttpErrorResponse {
  message?: string | string[];
  error?: string;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = '服务器内部错误';
    let error: string | null = null;

    // 处理 HttpException
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const responseObj = exceptionResponse as HttpErrorResponse;
        message = responseObj.message ?? '请求失败';
        error = responseObj.error ?? null;
      }
    }
    // 处理其他异常
    else if (exception instanceof Error) {
      this.logger.error(
        `未处理的异常: ${exception.message}`,
        exception.stack,
        'AllExceptionsFilter',
      );
    }

    // 记录错误日志
    const messageText = Array.isArray(message) ? message[0] : message;
    this.logger.error(
      `${request.method} ${request.path} - ${status} - ${messageText}`,
    );

    // 返回统一格式的错误响应
    const errorResponse = {
      code: status,
      message: messageText,
      data: null,
      timestamp: new Date().toISOString(),
      path: request.path,
      ...(error !== null && { error }),
    };

    response.status(status).json(errorResponse);
  }
}
