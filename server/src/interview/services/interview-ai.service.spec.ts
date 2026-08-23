import { describe, expect, it } from 'vitest';
import { InterviewAIService } from './interview-ai.service';

describe('InterviewAIService mock interview copy', () => {
  const service = new InterviewAIService({} as never);

  it('按候选人和岗位生成稳定的开场白', () => {
    const opening = service.generateOpeningStatement(
      '张',
      '小王',
      '前端开发工程师',
    );

    expect(opening).toContain('小王好');
    expect(opening).toContain('张老师');
    expect(opening).toContain('前端开发工程师岗位');
    expect(opening).toContain('请你简单介绍一下自己');
  });

  it('流式开场白的累积内容与完整开场白一致', async () => {
    const chunks: string[] = [];
    const generator = service.generateOpeningStatementStream('张');
    let iteration = await generator.next();
    while (!iteration.done) {
      chunks.push(iteration.value);
      iteration = await generator.next();
    }

    expect(chunks.join('')).toBe(service.generateOpeningStatement('张'));
    expect(iteration.value).toBe(service.generateOpeningStatement('张'));
  });

  it('生成专业的结束语', () => {
    const closing = service.generateClosingStatement('张', '小王');
    expect(closing).toContain('小王');
    expect(closing).toContain('3-5个工作日');
    expect(closing).toContain('张老师');
  });
});
