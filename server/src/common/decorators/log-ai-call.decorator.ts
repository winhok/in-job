import { Logger } from '@nestjs/common';

/** 记录 AI 操作名、结果与耗时，不记录 prompt、响应或用户内容。 */
export function LogAiCall(operation: string): MethodDecorator {
  return (
    _target: object,
    _propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    const original: unknown = descriptor.value;
    if (typeof original !== 'function') {
      throw new TypeError('LogAiCall 只能用于方法');
    }
    const logger = new Logger('AICall');
    descriptor.value = function (...args: unknown[]): Promise<unknown> {
      const startedAt = Date.now();
      try {
        const result: unknown = Reflect.apply(original, this, args);
        return Promise.resolve(result).then(
          (value: unknown) => {
            logger.log(
              `operation=${operation} result=success durationMs=${Date.now() - startedAt}`,
            );
            return value;
          },
          (error: unknown) => {
            logger.error(
              `operation=${operation} result=error durationMs=${Date.now() - startedAt}`,
            );
            throw error;
          },
        );
      } catch (error) {
        logger.error(
          `operation=${operation} result=error durationMs=${Date.now() - startedAt}`,
        );
        return Promise.reject(
          error instanceof Error ? error : new Error('AI 调用失败'),
        );
      }
    };
  };
}
