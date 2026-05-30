import * as winston from 'winston';
import 'winston-daily-rotate-file';
import { utilities as nestWinstonModuleUtilities } from 'nest-winston';

// Log-level colors (for console output)
const customColors = {
  silly: 'magenta',
  debug: 'cyan',
  verbose: 'gray',
  info: 'green',
  warn: 'yellow',
  error: 'red',
};

winston.addColors(customColors);

// Shared log format
const commonFormat = winston.format.combine(
  // timestamp
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  // elapsed time since the previous log
  winston.format.ms(),
  // JSON output
  winston.format.json(),
);

/**
 * Create a Winston logger instance.
 * @param nodeEnv runtime environment (development / production)
 */
export function createWinstonLogger(nodeEnv: string) {
  const transports: winston.transport[] = [];

  // ===== General log (all levels) =====
  // Rotate daily, up to 20MB per file.
  transports.push(
    new winston.transports.DailyRotateFile({
      filename: 'logs/application-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d', // a "d" suffix deletes by day count; keep 14 days
      format: commonFormat,
    }),
  );

  // ===== Error log (ERROR and above only) =====
  transports.push(
    new winston.transports.DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: '20m',
      maxFiles: '30d', // keep error logs longer
      format: commonFormat,
    }),
  );

  // ===== Audit log (money-related operations) =====
  transports.push(
    new winston.transports.DailyRotateFile({
      filename: 'logs/audit-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '50m',
      maxFiles: '365d', // keep audit logs for 1 year
      format: commonFormat,
    }),
  );

  // ===== Console output (for development) =====
  if (nodeEnv !== 'production') {
    transports.push(
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
          winston.format.ms(),
          nestWinstonModuleUtilities.format.nestLike('WWZhiDao', {
            colors: true,
            prettyPrint: true,
          }),
        ),
      }),
    );
  }

  return winston.createLogger({
    level: nodeEnv === 'production' ? 'info' : 'debug',
    format: commonFormat,
    defaultMeta: {
      service: 'wwzhidao-server',
      environment: nodeEnv,
    },
    transports,
  });
}
