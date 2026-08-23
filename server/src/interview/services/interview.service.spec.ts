import { lastValueFrom, toArray } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { ResumeQuizDto } from '../dto/resume-quiz.dto';
import {
  QuestionCategory,
  QuestionDifficulty,
} from '../schemas/interview-quiz-result.schema';
import { InterviewService, ProgressEvent } from './interview.service';

describe('InterviewService resume quiz', () => {
  const userId = '507f1f77bcf86cd799439011';
  const dto: ResumeQuizDto = {
    positionName: '前端开发工程师',
    jd: '负责前端架构设计和项目开发，要求熟悉 Vue、TypeScript 和前端工程化，具备良好的项目经验和沟通能力。',
    resumeContent:
      '姓名：张三\n教育经历：某大学计算机专业\n工作经验：三年前端开发\n项目经历：负责企业管理系统\n技能：Vue TypeScript Vite 性能优化 团队协作。',
  };

  function createService(options?: {
    aiFailure?: Error;
    existingRecord?: Record<string, unknown>;
    existingResult?: Record<string, unknown>;
  }) {
    const consumptionRecordModel = {
      findOne: vi.fn().mockResolvedValue(options?.existingRecord ?? null),
      findOneAndUpdate: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({
        _id: 'consumption-object-id',
        recordId: 'consumption-record-id',
      }),
      findByIdAndUpdate: vi.fn().mockResolvedValue(null),
    };
    const resumeQuizResultModel = {
      findOne: vi.fn().mockResolvedValue(options?.existingResult ?? null),
      create: vi.fn().mockResolvedValue({}),
    };
    const userModel = {
      findOneAndUpdate: vi.fn().mockResolvedValue({ resumeRemainingCount: 2 }),
      findByIdAndUpdate: vi.fn().mockResolvedValue({ resumeRemainingCount: 2 }),
      findById: vi.fn().mockResolvedValue({ resumeRemainingCount: 1 }),
    };
    const documentParserService = {
      cleanText: vi.fn((value: string) => value),
      validateResumeContent: vi.fn(() => ({ isValid: true })),
      estimateTokens: vi.fn(() => 100),
      parseDocumentFromUrl: vi.fn(),
    };
    const aiService = {
      generateResumeQuizQuestionsOnly: options?.aiFailure
        ? vi.fn().mockRejectedValue(options.aiFailure)
        : vi.fn().mockResolvedValue({
            questions: [
              {
                question: '请介绍 Vue 项目中的性能优化实践',
                answer: '从性能指标、定位方法、优化措施和最终结果四方面回答。',
                category: QuestionCategory.PROJECT,
                difficulty: QuestionDifficulty.MEDIUM,
                tips: '使用 STAR 法则',
              },
              {
                question: 'TypeScript 类型系统如何改善项目质量',
                answer: '结合真实项目中的类型建模、编译期检查和重构经历回答。',
                category: QuestionCategory.TECHNICAL,
                difficulty: QuestionDifficulty.MEDIUM,
                tips: '结合项目例子',
              },
              {
                question: '如何处理前端项目中的紧急线上故障',
                answer: '说明止损、定位、修复、验证和复盘的完整过程。',
                category: QuestionCategory.PROBLEM_SOLVING,
                difficulty: QuestionDifficulty.HARD,
                tips: '突出取舍和结果',
              },
            ],
            summary: '候选人具备前端工程实践，需重点准备技术深度与项目成果。',
          }),
      generateResumeQuizAnalysisOnly: vi.fn().mockResolvedValue({
        matchScore: 80,
        matchLevel: '良好',
        matchedSkills: [],
        missingSkills: [],
        knowledgeGaps: [],
        learningPriorities: [],
        radarData: [],
        strengths: [],
        weaknesses: [],
        interviewTips: [],
      }),
    };

    const service = new InterviewService(
      {} as never,
      {} as never,
      {} as never,
      documentParserService as never,
      aiService as never,
      consumptionRecordModel as never,
      resumeQuizResultModel as never,
      userModel as never,
    );

    return {
      service,
      consumptionRecordModel,
      resumeQuizResultModel,
      userModel,
    };
  }

  it('生成成功后保存结果并将消费记录标记为成功', async () => {
    const { service, consumptionRecordModel, resumeQuizResultModel } =
      createService();

    const events = await lastValueFrom(
      service.generateResumeQuizWithProgress(userId, dto).pipe(toArray()),
    );

    expect(events.at(-1)).toMatchObject<Partial<ProgressEvent>>({
      type: 'complete',
      progress: 100,
    });
    expect(resumeQuizResultModel.create).toHaveBeenCalledTimes(1);
    const successUpdate = consumptionRecordModel.findByIdAndUpdate.mock
      .calls[0] as unknown as [string, { $set: { status: string } }];
    expect(successUpdate[0]).toBe('consumption-object-id');
    expect(successUpdate[1].$set.status).toBe('success');
  });

  it('AI 生成失败时退还已扣除的次数', async () => {
    const { service, userModel, consumptionRecordModel } = createService({
      aiFailure: new Error('AI unavailable'),
    });

    const events = await lastValueFrom(
      service.generateResumeQuizWithProgress(userId, dto).pipe(toArray()),
    );

    expect(events.at(-1)).toMatchObject<Partial<ProgressEvent>>({
      type: 'error',
      error: '生成失败，请稍后重试',
    });
    expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
      userId,
      { $inc: { resumeRemainingCount: 1 } },
      { new: true },
    );
    const failureUpdate = consumptionRecordModel.findByIdAndUpdate.mock
      .calls[0] as unknown as [
      string,
      { $set: { status: string; isRefunded: boolean } },
    ];
    expect(failureUpdate[0]).toBe('consumption-object-id');
    expect(failureUpdate[1].$set.status).toBe('failed');
    expect(failureUpdate[1].$set.isRefunded).toBe(true);
  });

  it('相同 requestId 已成功时直接返回缓存且不再扣费', async () => {
    const requestDto = {
      ...dto,
      requestId: '123e4567-e89b-42d3-a456-426614174000',
    };
    const { service, userModel, resumeQuizResultModel } = createService({
      existingRecord: {
        status: 'success',
        resultId: 'existing-result-id',
        recordId: 'existing-record-id',
      },
      existingResult: {
        resultId: 'existing-result-id',
        questions: [],
        summary: '已有结果',
      },
    });

    const events = await lastValueFrom(
      service
        .generateResumeQuizWithProgress(userId, requestDto)
        .pipe(toArray()),
    );

    const lastEvent = events.at(-1);
    expect(lastEvent?.type).toBe('complete');
    const cachedData = lastEvent?.data as {
      resultId?: string;
      isFromCache?: boolean;
    };
    expect(cachedData.resultId).toBe('existing-result-id');
    expect(cachedData.isFromCache).toBe(true);
    expect(userModel.findOneAndUpdate).not.toHaveBeenCalled();
    expect(resumeQuizResultModel.create).not.toHaveBeenCalled();
  });
});
