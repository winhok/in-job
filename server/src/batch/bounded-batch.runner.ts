import { Injectable } from '@nestjs/common';

export interface BatchItemResult<T> {
  index: number;
  status: 'fulfilled' | 'rejected';
  value?: T;
  error?: string;
}

@Injectable()
export class BoundedBatchRunner {
  async run<TInput, TOutput>(
    items: TInput[],
    worker: (item: TInput, index: number) => Promise<TOutput>,
    concurrency: number,
  ): Promise<Array<BatchItemResult<TOutput>>> {
    const workerCount = Math.min(
      Math.max(1, Math.floor(concurrency)),
      Math.max(items.length, 1),
    );
    const results = new Array<BatchItemResult<TOutput>>(items.length);
    let cursor = 0;

    const consume = async (): Promise<void> => {
      while (cursor < items.length) {
        const index = cursor;
        cursor += 1;
        try {
          results[index] = {
            index,
            status: 'fulfilled',
            value: await worker(items[index], index),
          };
        } catch (error) {
          results[index] = {
            index,
            status: 'rejected',
            error: error instanceof Error ? error.message : 'unknown error',
          };
        }
      }
    };
    await Promise.all(Array.from({ length: workerCount }, () => consume()));
    return results;
  }
}
