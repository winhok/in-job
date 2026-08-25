import { lastValueFrom, toArray } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';

vi.mock('./document-parser.service', () => ({
  DocumentParserService: class DocumentParserService {},
}));

import { ResumeQuizDto } from '../dto/resume-quiz.dto';
import {
  MockInterviewEventType,
  MockInterviewType,
} from '../dto/mock-interview.dto';
import {
  QuestionCategory,
  QuestionDifficulty,
} from '../schemas/interview-quiz-result.schema';
import { InterviewService, ProgressEvent } from './interview.service';
import { ReportStatus } from '../dto/analysis-report.dto';

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
    const aiInterviewResultModel = {
      findOne: vi.fn().mockResolvedValue(null),
      findOneAndUpdate: vi.fn().mockResolvedValue(null),
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
      aiInterviewResultModel as never,
      userModel as never,
      {} as never,
      {
        retrieve: vi.fn().mockResolvedValue([]),
        indexResume: vi.fn().mockResolvedValue(undefined),
      } as never,
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

describe('InterviewService mock interview lifecycle', () => {
  const userId = '507f1f77bcf86cd799439011';

  function createFlowService() {
    type QaRecord = Record<string, unknown>;
    interface FlowRecord extends Record<string, unknown> {
      qaList: QaRecord[];
      status?: string;
      sessionState?: { isActive?: boolean };
    }
    interface ModelUpdate {
      $push?: { qaList?: QaRecord };
      $set?: Record<string, unknown>;
      $inc?: Record<string, number>;
    }
    const record: FlowRecord = { qaList: [] };
    const aiInterviewResultModel = {
      create: vi.fn((value: Record<string, unknown>) => {
        Object.assign(record, value);
        return Promise.resolve(record);
      }),
      findOne: vi.fn().mockResolvedValue(record),
      findOneAndUpdate: vi.fn((_query: unknown, update: ModelUpdate) => {
        if (update.$push?.qaList) record.qaList.push(update.$push.qaList);
        for (const [path, value] of Object.entries(update.$set || {})) {
          const match = path.match(/^qaList\.(\d+)\.(.+)$/);
          if (match) {
            record.qaList[Number(match[1])][match[2]] = value;
          } else {
            record[path] = value;
          }
        }
        for (const [field, value] of Object.entries(update.$inc || {})) {
          const current = typeof record[field] === 'number' ? record[field] : 0;
          record[field] = current + value;
        }
        return Promise.resolve(record);
      }),
    };
    const consumptionRecordModel = {
      create: vi.fn().mockResolvedValue({}),
      findOneAndUpdate: vi.fn().mockResolvedValue({}),
    };
    const userModel = {
      findOneAndUpdate: vi.fn().mockResolvedValue({
        specialRemainingCount: 2,
        behaviorRemainingCount: 2,
      }),
      findByIdAndUpdate: vi.fn().mockResolvedValue({}),
    };
    const documentParserService = {
      cleanText: vi.fn((value: string) => value.trim()),
      validateResumeContent: vi.fn(() => ({ isValid: true })),
    };
    const aiService = {
      async *generateOpeningStatementStream() {
        await Promise.resolve();
        yield '你好，请先自我介绍。';
        return '你好，请先自我介绍。';
      },
      async *generateInterviewQuestionStream() {
        await Promise.resolve();
        yield '谢谢你的介绍，请说明一个项目难点。';
        yield '[STANDARD_ANSWER]说明背景、行动和结果。';
        return {
          question: '谢谢你的介绍，请说明一个项目难点。',
          shouldEnd: false,
          standardAnswer: '说明背景、行动和结果。',
        };
      },
      generateClosingStatement: vi.fn(() => '感谢参与，面试结束。'),
      generateInterviewAssessmentReport: vi.fn().mockResolvedValue({
        overallScore: 80,
        overallLevel: '良好',
        overallComment: '面试表现良好',
        radarData: [],
        strengths: [],
        weaknesses: [],
        improvements: [],
        fluencyScore: 80,
        logicScore: 80,
        professionalScore: 80,
      }),
    };
    const service = new InterviewService(
      {} as never,
      {} as never,
      {} as never,
      documentParserService as never,
      aiService as never,
      consumptionRecordModel as never,
      {} as never,
      aiInterviewResultModel as never,
      userModel as never,
      {} as never,
      {
        retrieve: vi.fn().mockResolvedValue([]),
        indexResume: vi.fn().mockResolvedValue(undefined),
      } as never,
    );
    return { service, record, userModel, aiInterviewResultModel };
  }

  it('完成开始、回答、暂停、恢复和结束的完整状态流转', async () => {
    const { service, record, userModel } = createFlowService();
    const startEvents = await lastValueFrom(
      service
        .startMockInterviewWithStream(userId, {
          interviewType: MockInterviewType.SPECIAL,
          candidateName: '小王',
          positionName: '前端开发工程师',
          resumeContent:
            '姓名小王，计算机专业毕业，具有三年前端开发工作经验。熟悉 Vue、TypeScript 和工程化，负责过多个企业项目并参与性能优化与团队协作。',
        })
        .pipe(toArray()),
    );
    const startEvent = startEvents.find(
      (event) => event.type === MockInterviewEventType.START,
    );
    expect(startEvents.at(-1)?.type).toBe(MockInterviewEventType.WAITING);
    expect(startEvent?.sessionId).toBeTruthy();
    expect(startEvent?.resultId).toBeTruthy();
    expect(record.qaList).toHaveLength(1);
    expect(userModel.findOneAndUpdate).toHaveBeenCalledTimes(1);

    const answerEvents = await lastValueFrom(
      service
        .answerMockInterviewWithStream(
          userId,
          startEvent!.sessionId!,
          '我负责过一个复杂的中后台项目。',
        )
        .pipe(toArray()),
    );
    expect(answerEvents.map(({ type }) => type)).toEqual(
      expect.arrayContaining([
        MockInterviewEventType.THINKING,
        MockInterviewEventType.QUESTION,
        MockInterviewEventType.REFERENCE_ANSWER,
        MockInterviewEventType.WAITING,
      ]),
    );
    expect(record.qaList[0].answer).toContain('中后台项目');
    expect(record.qaList[1]).toMatchObject({
      question: '谢谢你的介绍，请说明一个项目难点。',
      standardAnswer: '说明背景、行动和结果。',
    });

    await service.pauseMockInterview(userId, startEvent!.resultId!);
    expect(record.status).toBe('paused');
    const resumed = await service.resumeMockInterview(
      userId,
      startEvent!.resultId!,
    );
    expect(resumed.sessionId).toBe(startEvent!.sessionId);
    expect(record.status).toBe('in_progress');

    await service.endMockInterview(userId, startEvent!.resultId!);
    expect(record.status).toBe('completed');
    expect(record.sessionState?.isActive).toBe(false);
    await vi.waitFor(() => expect(record.reportStatus).toBe('completed'));
  });
});

describe('InterviewService analysis reports', () => {
  const userId = '507f1f77bcf86cd799439011';

  interface MutableReport extends Record<string, unknown> {
    _id?: string;
    resultId: string;
    userId: string;
    reportStatus?: string;
    viewCount?: number;
    overallScore?: number;
    reportError?: string;
  }

  interface ReportQuery {
    resultId?: string;
    userId?: string;
    reportStatus?: string | { $in: string[] };
    reportAttempts?: { $lt: number };
    nextReportRetryAt?: { $lte: Date };
    $or?: ReportQuery[];
  }

  interface ReportUpdate {
    $set?: Record<string, unknown>;
    $inc?: Record<string, number>;
    $unset?: Record<string, unknown>;
  }

  function createReportService(options?: {
    resumeResult?: MutableReport | null;
    interviewResult?: MutableReport | null;
    assessment?: Record<string, unknown>;
    assessmentError?: Error;
  }) {
    const resumeResult = options?.resumeResult ?? null;
    const interviewResult = options?.interviewResult ?? null;
    if (interviewResult && !interviewResult.status) {
      interviewResult.status = 'completed';
    }
    const matches = (record: MutableReport | null, query: ReportQuery) => {
      if (!record) return false;
      if (query.resultId && record.resultId !== query.resultId) return false;
      if (query.userId && record.userId !== query.userId) return false;
      if (
        query.reportAttempts?.$lt !== undefined &&
        Number(record.reportAttempts || 0) >= query.reportAttempts.$lt
      ) {
        return false;
      }
      if (
        query.nextReportRetryAt?.$lte &&
        (!(record.nextReportRetryAt instanceof Date) ||
          record.nextReportRetryAt > query.nextReportRetryAt.$lte)
      ) {
        return false;
      }
      if (query.$or && !query.$or.some((branch) => matches(record, branch))) {
        return false;
      }
      if (typeof query.reportStatus === 'string') {
        return record.reportStatus === query.reportStatus;
      }
      if (query.reportStatus?.$in) {
        return query.reportStatus.$in.includes(record.reportStatus);
      }
      return true;
    };
    const applyUpdate = (record: MutableReport, update: ReportUpdate) => {
      Object.assign(record, update.$set || {});
      for (const [field, amount] of Object.entries(update.$inc || {})) {
        const current = record[field];
        record[field] = (typeof current === 'number' ? current : 0) + amount;
      }
      for (const field of Object.keys(update.$unset || {})) {
        delete record[field];
      }
    };
    const resumeQuizResultModel = {
      findOne: vi.fn((query: ReportQuery) =>
        Promise.resolve(matches(resumeResult, query) ? resumeResult : null),
      ),
      findByIdAndUpdate: vi.fn((_id: unknown, update: ReportUpdate) => {
        if (resumeResult) applyUpdate(resumeResult, update);
        return Promise.resolve(resumeResult);
      }),
    };
    const aiInterviewResultModel = {
      findOne: vi.fn((query: ReportQuery) =>
        Promise.resolve(
          matches(interviewResult, query) ? interviewResult : null,
        ),
      ),
      findOneAndUpdate: vi.fn((query: ReportQuery, update: ReportUpdate) => {
        if (!matches(interviewResult, query)) return Promise.resolve(null);
        applyUpdate(interviewResult!, update);
        return Promise.resolve(interviewResult);
      }),
    };
    const aiService = {
      generateInterviewAssessmentReport: options?.assessmentError
        ? vi.fn().mockRejectedValue(options.assessmentError)
        : vi.fn().mockResolvedValue(
            options?.assessment || {
              overallScore: 82,
              overallLevel: '良好',
              overallComment: '技术基础扎实，表达清晰。',
              radarData: [
                { dimension: '技术能力', score: 84, description: '基础扎实' },
              ],
              strengths: ['技术基础扎实'],
              weaknesses: ['系统设计经验不足'],
              improvements: [
                {
                  category: '架构能力',
                  suggestion: '补充系统设计实践',
                  priority: 'high',
                },
              ],
              fluencyScore: 80,
              logicScore: 83,
              professionalScore: 84,
            },
          ),
    };
    const service = new InterviewService(
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      aiService as never,
      {} as never,
      resumeQuizResultModel as never,
      aiInterviewResultModel as never,
      {} as never,
      {} as never,
    );
    return {
      service,
      resumeQuizResultModel,
      aiInterviewResultModel,
      aiService,
      interviewResult,
    };
  }

  it('格式化简历押题报告并原子增加查看次数', async () => {
    const resumeResult: MutableReport = {
      _id: 'resume-id',
      resultId: 'resume-result',
      userId,
      company: '示例公司',
      position: '前端开发工程师',
      questions: [{ question: 'Vue 原理' }],
      viewCount: 2,
      createdAt: new Date('2026-08-20T00:00:00.000Z'),
    };
    const { service, resumeQuizResultModel } = createReportService({
      resumeResult,
    });

    const report = (await service.getAnalysisReport(
      userId,
      'resume-result',
    )) as Record<string, unknown>;

    expect(report).toMatchObject({
      resultId: 'resume-result',
      type: 'resume_quiz',
      matchScore: 0,
      totalQuestions: 1,
      viewCount: 3,
    });
    expect(resumeQuizResultModel.findByIdAndUpdate).toHaveBeenCalledWith(
      'resume-id',
      expect.objectContaining({ $inc: { viewCount: 1 } }),
      { new: true },
    );
  });

  it('待生成报告在查询时异步生成，完成后返回脱敏结构', async () => {
    const interviewResult: MutableReport = {
      resultId: 'mock-result',
      userId,
      interviewType: 'special',
      company: '示例公司',
      position: '前端开发工程师',
      reportStatus: ReportStatus.PENDING,
      viewCount: 0,
      totalQuestions: 1,
      answeredQuestions: 1,
      qaList: [
        {
          question: '介绍一次性能优化',
          answer: '我先建立性能基线，再定位瓶颈并验证优化收益。',
          standardAnswer: '说明指标、定位、措施和结果。',
        },
      ],
      sessionState: { resumeContent: '三年前端开发经验' },
    };
    const { service, aiService } = createReportService({ interviewResult });

    await expect(
      service.getAnalysisReport(userId, 'mock-result'),
    ).rejects.toThrow('评估报告正在生成中');
    await vi.waitFor(() => {
      expect(interviewResult.reportStatus).toBe(ReportStatus.COMPLETED);
    });

    const report = (await service.getAnalysisReport(
      userId,
      'mock-result',
    )) as Record<string, unknown>;
    expect(aiService.generateInterviewAssessmentReport).toHaveBeenCalledTimes(
      1,
    );
    expect(report).toMatchObject({
      resultId: 'mock-result',
      type: 'special_interview',
      overallScore: 82,
      viewCount: 1,
    });
    expect(report).not.toHaveProperty('sessionState');
    expect(report).not.toHaveProperty('userId');
  });

  it('并发重新生成只会认领一次 AI 任务', async () => {
    const interviewResult: MutableReport = {
      resultId: 'retry-result',
      userId,
      interviewType: 'behavior',
      reportStatus: ReportStatus.FAILED,
      qaList: [
        { question: '如何处理冲突', answer: '先对齐目标，再讨论方案。' },
      ],
    };
    const { service, aiService } = createReportService({ interviewResult });

    await Promise.all([
      service.regenerateAssessmentReport(userId, 'retry-result'),
      service.regenerateAssessmentReport(userId, 'retry-result'),
    ]);
    await vi.waitFor(() => {
      expect(interviewResult.reportStatus).toBe(ReportStatus.COMPLETED);
    });
    expect(aiService.generateInterviewAssessmentReport).toHaveBeenCalledTimes(
      1,
    );
  });

  it('无有效回答时直接生成默认低分报告', async () => {
    const interviewResult: MutableReport = {
      resultId: 'empty-result',
      userId,
      interviewType: 'special',
      reportStatus: ReportStatus.PENDING,
      qaList: [{ question: '请自我介绍', answer: '   ' }],
    };
    const { service, aiService } = createReportService({ interviewResult });

    await service.regenerateAssessmentReport(userId, 'empty-result');
    await vi.waitFor(() => {
      expect(interviewResult.reportStatus).toBe(ReportStatus.COMPLETED);
    });
    expect(interviewResult.overallScore).toBe(30);
    expect(aiService.generateInterviewAssessmentReport).not.toHaveBeenCalled();
  });

  it('AI 失败时保存失败状态并允许后续重试', async () => {
    const interviewResult: MutableReport = {
      resultId: 'failed-result',
      userId,
      interviewType: 'special',
      reportStatus: ReportStatus.PENDING,
      qaList: [
        { question: '解释事件循环', answer: '宏任务与微任务按规则调度。' },
      ],
    };
    const { service } = createReportService({
      interviewResult,
      assessmentError: new Error('model unavailable'),
    });

    await service.regenerateAssessmentReport(userId, 'failed-result');
    await vi.waitFor(() => {
      expect(interviewResult.reportStatus).toBe(ReportStatus.FAILED);
    });
    expect(interviewResult.reportError).toBe('model unavailable');
  });

  it('其他用户的结果按不存在处理', async () => {
    const { service } = createReportService({
      interviewResult: {
        resultId: 'private-result',
        userId: 'another-user',
        reportStatus: ReportStatus.COMPLETED,
      },
    });

    await expect(
      service.getAnalysisReport(userId, 'private-result'),
    ).rejects.toThrow('未找到该分析报告');
    await expect(
      service.regenerateAssessmentReport(userId, 'private-result'),
    ).rejects.toThrow('未找到该分析报告');
  });

  it('进行中的面试不能提前生成评估报告', async () => {
    const { service } = createReportService({
      interviewResult: {
        resultId: 'active-result',
        userId,
        status: 'in_progress',
        reportStatus: ReportStatus.PENDING,
      },
    });

    await expect(
      service.regenerateAssessmentReport(userId, 'active-result'),
    ).rejects.toThrow('面试尚未结束');
  });
});
