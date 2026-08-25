import { format, transports, LoggerOptions } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { LoggerSanitizeUtil } from '../utils/logger-sanitize.util';
import { getCurrentTraceId } from '../observability/trace-context.service';

export function createWinstonOptions(): LoggerOptions {
  const traceFormat = format((info) => {
    info.traceId = getCurrentTraceId() || 'system';
    return info;
  });
  const output = format.printf((info) =>
    JSON.stringify(LoggerSanitizeUtil.sanitize(info)),
  );
  const configuredTransports: LoggerOptions['transports'] = [
    new transports.Console({
      format: format.combine(
        traceFormat(),
        format.timestamp(),
        format.errors({ stack: true }),
        output,
      ),
    }),
  ];
  if (process.env.LOG_FILE_ENABLED === 'true') {
    configuredTransports.push(
      new DailyRotateFile({
        dirname: process.env.LOG_DIR || 'logs',
        filename: 'application-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '14d',
        format: format.combine(
          traceFormat(),
          format.timestamp(),
          format.errors({ stack: true }),
          output,
        ),
      }),
    );
  }
  return {
    level:
      process.env.LOG_LEVEL ||
      (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
    defaultMeta: { service: 'in-job-server' },
    transports: configuredTransports,
  };
}
