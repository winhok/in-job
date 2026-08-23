import { describe, expect, it } from 'vitest';
import { RunnableLambda } from '@langchain/core/runnables';
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

describe('InterviewAIService assessment report', () => {
  const context = {
    interviewType: 'special' as const,
    company: '示例公司',
    positionName: '前端开发工程师',
    jd: '要求熟悉 TypeScript 和性能优化',
    resumeContent: '三年前端开发经验',
    qaList: [
      {
        question: '如何定位页面性能问题？',
        answer: '先采集指标，再使用 Performance 面板定位瓶颈。',
        standardAnswer: '建立基线、定位瓶颈、实施优化并验证。',
      },
    ],
  };

  function createService(result: Record<string, unknown>) {
    const model = RunnableLambda.from(() => JSON.stringify(result));
    return new InterviewAIService({
      createDefaultModel: () => model,
    } as never);
  }

  it('解析并返回结构完整的评估结果', async () => {
    const expected = {
      overallScore: 82,
      overallLevel: '良好',
      overallComment: '技术基础扎实',
      radarData: [{ dimension: '技术能力', score: 84 }],
      strengths: ['基础扎实'],
      weaknesses: ['架构经验不足'],
      improvements: [
        {
          category: '架构能力',
          suggestion: '补充系统设计实践',
          priority: 'high',
        },
      ],
      fluencyScore: 80,
      logicScore: 82,
      professionalScore: 84,
    };

    await expect(
      createService(expected).generateInterviewAssessmentReport(context),
    ).resolves.toEqual(expected);
  });

  it('拒绝持久化越界的 AI 分数', async () => {
    const invalid = {
      overallScore: 120,
      overallLevel: '优秀',
      overallComment: '不可信的高分',
      radarData: [],
      strengths: [],
      weaknesses: [],
      improvements: [],
      fluencyScore: 80,
      logicScore: 80,
      professionalScore: 80,
    };

    await expect(
      createService(invalid).generateInterviewAssessmentReport(context),
    ).rejects.toThrow('AI返回的评估分数或综合评价格式不正确');
  });
});
