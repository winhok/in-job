import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { randomUUID } from 'node:crypto';
import { ReplaySubject, Subject } from 'rxjs';
import { SessionManager } from '../../ai/services/session.manager';
import { User, UserDocument } from '../../user/schemas/user.schema';
import { ResumeService } from '../../resume/resume.service';
import { InterviewKnowledgeService } from '../../knowledge/interview-knowledge.service';
import { ResumeQuizDto } from '../dto/resume-quiz.dto';
import {
  ReportStatus,
  ResumeQuizAnalysisDto,
} from '../dto/analysis-report.dto';
import { RESUME_ANALYSIS_SYSTEM_MESSAGE } from '../prompts/resume-analysis.prompts';
import {
  ConsumptionRecord,
  ConsumptionRecordDocument,
  ConsumptionStatus,
  ConsumptionType,
} from '../schemas/consumption-record.schema';
import {
  ResumeQuizResult,
  ResumeQuizResultDocument,
} from '../schemas/interview-quiz-result.schema';
import { ConversationContinuationService } from './conversation-continuation.service';
import { DocumentParserService } from './document-parser.service';
import {
  InterviewAIService,
  ResumeQuizAnalysisResult,
  ResumeQuizQuestionsResult,
} from './interview-ai.service';
import { ResumeAnalysisService } from './resume-analysis.service';
import {
  AnswerMockInterviewDto,
  MockInterviewEventDto,
  MockInterviewEventType,
  MockInterviewType,
  StartMockInterviewDto,
} from '../dto/mock-interview.dto';
import {
  AIInterviewResult,
  AIInterviewResultDocument,
  AIInterviewType,
} from '../schemas/ai-interview-result.schema';
import { InterviewSession } from '../interfaces/interview-session.interface';

export interface ProgressEvent {
  type: 'progress' | 'complete' | 'error' | 'timeout';
  step?: number;
  label?: string;
  progress: number;
  message?: string;
  data?: unknown;
  error?: string;
  stage?: 'prepare' | 'generating' | 'saving' | 'done';
}

@Injectable()
export class InterviewService {
  private readonly logger = new Logger(InterviewService.name);
  private readonly SPECIAL_INTERVIEW_MAX_DURATION = 120;
  private readonly BEHAVIOR_INTERVIEW_MAX_DURATION = 120;
  private readonly interviewSessions = new Map<string, InterviewSession>();
  private readonly sessionsProcessingAnswer = new Set<string>();

  constructor(
    private readonly sessionManager: SessionManager,
    private readonly resumeAnalysisService: ResumeAnalysisService,
    private readonly conversationContinuationService: ConversationContinuationService,
    private readonly documentParserService: DocumentParserService,
    private readonly aiService: InterviewAIService,
    @InjectModel(ConsumptionRecord.name)
    private readonly consumptionRecordModel: Model<ConsumptionRecordDocument>,
    @InjectModel(ResumeQuizResult.name)
    private readonly resumeQuizResultModel: Model<ResumeQuizResultDocument>,
    @InjectModel(AIInterviewResult.name)
    private readonly aiInterviewResultModel: Model<AIInterviewResultDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly resumeService: ResumeService,
    private readonly knowledgeService: InterviewKnowledgeService,
    @Optional() private readonly configService?: ConfigService,
  ) {}

  async analyzeResume(
    userId: string,
    position: string,
    resumeContent: string,
    jobDescription: string,
  ) {
    try {
      const sessionId = this.sessionManager.createSession(
        userId,
        position,
        RESUME_ANALYSIS_SYSTEM_MESSAGE(position),
      );
      const result = await this.resumeAnalysisService.analyze(
        resumeContent,
        jobDescription,
      );

      this.sessionManager.addMessage(
        sessionId,
        'user',
        `简历内容：${resumeContent}`,
      );
      this.sessionManager.addMessage(
        sessionId,
        'assistant',
        JSON.stringify(result),
      );
      return { sessionId, analysis: result };
    } catch (error) {
      this.logger.error(`分析简历失败: ${this.getErrorMessage(error)}`);
      throw error;
    }
  }

  async continueConversation(
    userId: string,
    sessionId: string,
    userQuestion: string,
  ): Promise<string> {
    try {
      const session = this.sessionManager.getSession(sessionId);
      if (!session || session.userId !== userId) {
        throw new NotFoundException('会话不存在');
      }
      this.sessionManager.addMessage(sessionId, 'user', userQuestion);
      await this.sessionManager.summarizeLongConversation(sessionId);
      const history = this.sessionManager.getRecentMessages(sessionId, 10);
      const aiResponse =
        await this.conversationContinuationService.continue(history);
      this.sessionManager.addMessage(sessionId, 'assistant', aiResponse);
      return aiResponse;
    } catch (error) {
      this.logger.error(`继续对话失败: ${this.getErrorMessage(error)}`);
      throw error;
    }
  }

  /** 根据结果 ID 自动识别简历押题或模拟面试报告。 */
  async getAnalysisReport(userId: string, resultId: string): Promise<unknown> {
    const resumeQuizResult = await this.resumeQuizResultModel.findOne({
      resultId,
      userId,
    });
    if (resumeQuizResult) {
      return this.generateResumeQuizAnalysis(resumeQuizResult);
    }

    const aiInterviewResult = await this.aiInterviewResultModel.findOne({
      resultId,
      userId,
    });
    if (!aiInterviewResult) throw new NotFoundException('未找到该分析报告');

    const reportStatus =
      (aiInterviewResult.reportStatus as ReportStatus | undefined) ??
      ReportStatus.PENDING;
    if (reportStatus === ReportStatus.PENDING) {
      this.triggerAssessmentReportGeneration(userId, resultId);
    }
    if (reportStatus !== ReportStatus.COMPLETED) {
      throw new BadRequestException(
        '评估报告正在生成中，请稍后再试（预计1-2分钟）',
      );
    }

    const viewedResult = await this.aiInterviewResultModel.findOneAndUpdate(
      { resultId, userId, reportStatus: ReportStatus.COMPLETED },
      { $inc: { viewCount: 1 }, $set: { lastViewedAt: new Date() } },
      { new: true },
    );
    if (!viewedResult) throw new NotFoundException('未找到该分析报告');
    return this.formatAIInterviewAnalysis(viewedResult);
  }

  /** 重新触发待生成或失败的模拟面试报告。 */
  async regenerateAssessmentReport(
    userId: string,
    resultId: string,
  ): Promise<void> {
    const result = await this.aiInterviewResultModel.findOne({
      resultId,
      userId,
    });
    if (!result) throw new NotFoundException('未找到该分析报告');
    if (result.status !== 'completed') {
      throw new BadRequestException('面试尚未结束，不能生成评估报告');
    }
    if ((result.reportStatus as ReportStatus) === ReportStatus.COMPLETED) {
      throw new BadRequestException('评估报告已经生成完成');
    }
    const maxAttempts = this.reportMaxAttempts();
    if ((result.reportAttempts || 0) >= maxAttempts) {
      throw new BadRequestException('评估报告已达到最大重试次数');
    }
    await this.aiInterviewResultModel.findOneAndUpdate(
      { resultId, userId },
      { $set: { nextReportRetryAt: new Date() } },
    );
    this.triggerAssessmentReportGeneration(userId, resultId);
  }

  generateResumeQuizWithProgress(
    userId: string,
    dto: ResumeQuizDto,
  ): Subject<ProgressEvent> {
    const subject = new ReplaySubject<ProgressEvent>(1);
    void this.executeResumeQuiz(userId, dto, subject);
    return subject;
  }

  startMockInterviewWithStream(
    userId: string,
    dto: StartMockInterviewDto,
  ): Subject<MockInterviewEventDto> {
    const subject = new Subject<MockInterviewEventDto>();
    queueMicrotask(() => {
      void this.executeStartMockInterview(userId, dto, subject).catch(
        (error: unknown) => {
          const message = this.getErrorMessage(error);
          this.logger.error(`模拟面试启动失败: ${message}`);
          if (!subject.closed) {
            subject.next({
              type: MockInterviewEventType.ERROR,
              content: message,
              error: message,
            });
            subject.complete();
          }
        },
      );
    });
    return subject;
  }

  answerMockInterviewWithStream(
    userId: string,
    sessionId: string,
    answer: AnswerMockInterviewDto['answer'],
  ): Subject<MockInterviewEventDto> {
    const subject = new Subject<MockInterviewEventDto>();
    queueMicrotask(() => {
      void this.executeAnswerMockInterview(
        userId,
        sessionId,
        answer,
        subject,
      ).catch((error: unknown) => {
        const message = this.getErrorMessage(error);
        this.logger.error(`处理面试回答失败: ${message}`);
        if (!subject.closed) {
          subject.next({
            type: MockInterviewEventType.ERROR,
            content: message,
            error: message,
          });
          subject.complete();
        }
      });
    });
    return subject;
  }

  async pauseMockInterview(
    userId: string,
    resultId: string,
  ): Promise<{ resultId: string; pausedAt: Date }> {
    const dbResult = await this.aiInterviewResultModel.findOne({
      resultId,
      userId,
    });
    if (!dbResult) throw new NotFoundException('面试记录不存在');
    if (dbResult.status === 'paused') {
      throw new BadRequestException('面试已经暂停');
    }
    if (dbResult.status === 'completed') {
      throw new BadRequestException('面试已经结束，无法暂停');
    }

    const pausedAt = new Date();
    const session = dbResult.sessionState
      ? this.hydrateInterviewSession(dbResult.sessionState)
      : undefined;
    if (session) session.isActive = false;
    await this.aiInterviewResultModel.findOneAndUpdate(
      { resultId, userId, status: 'in_progress' },
      {
        $set: {
          status: 'paused',
          pausedAt,
          ...(session ? { sessionState: session } : {}),
        },
      },
    );
    if (session?.sessionId) {
      this.interviewSessions.delete(session.sessionId);
    }
    this.logger.log(`⏸️ 面试已暂停: resultId=${resultId}`);
    return { resultId, pausedAt };
  }

  async resumeMockInterview(
    userId: string,
    resultId: string,
  ): Promise<{
    resultId: string;
    sessionId: string;
    currentQuestion: number;
    totalQuestions: number;
    lastQuestion?: string;
    conversationHistory: InterviewSession['conversationHistory'];
  }> {
    const dbResult = await this.aiInterviewResultModel.findOne({
      resultId,
      userId,
      status: 'paused',
    });
    if (!dbResult) {
      throw new NotFoundException('未找到可恢复的面试，或面试未暂停');
    }
    if (!dbResult.sessionState) {
      throw new BadRequestException('会话数据不完整，无法恢复');
    }

    const session = this.hydrateInterviewSession(dbResult.sessionState);
    session.isActive = true;
    this.interviewSessions.set(session.sessionId, session);
    await this.aiInterviewResultModel.findOneAndUpdate(
      { resultId, userId, status: 'paused' },
      {
        $set: {
          status: 'in_progress',
          resumedAt: new Date(),
          sessionState: session,
        },
      },
    );

    const lastEntry = session.conversationHistory.at(-1);
    const lastQuestion =
      lastEntry?.role === 'interviewer' ? lastEntry.content : undefined;
    this.logger.log(
      `▶️ 面试已恢复: resultId=${resultId}, sessionId=${session.sessionId}`,
    );
    return {
      resultId,
      sessionId: session.sessionId,
      currentQuestion: session.questionCount,
      totalQuestions:
        session.interviewType === MockInterviewType.SPECIAL ? 12 : 8,
      lastQuestion,
      conversationHistory: session.conversationHistory,
    };
  }

  async endMockInterview(userId: string, resultId: string): Promise<void> {
    const dbResult = await this.aiInterviewResultModel.findOne({
      resultId,
      userId,
    });
    if (!dbResult) throw new NotFoundException('面试记录不存在');
    if (dbResult.status === 'completed') {
      throw new BadRequestException('面试已经结束');
    }
    if (!dbResult.sessionState) {
      throw new NotFoundException('无法加载面试状态');
    }

    const session = this.hydrateInterviewSession(dbResult.sessionState);
    session.isActive = false;
    session.conversationHistory.push({
      role: 'interviewer',
      content: this.aiService.generateClosingStatement(
        session.interviewerName,
        session.candidateName,
        session.locale,
      ),
      timestamp: new Date(),
    });
    await this.saveMockInterviewResult(session);
    this.interviewSessions.delete(session.sessionId);
    this.sessionsProcessingAnswer.delete(session.sessionId);
  }

  async getResumeQuizHistory(
    userId: string,
    rawPage?: string,
    rawLimit?: string,
  ): Promise<{
    records: Array<Record<string, unknown>>;
    total: number;
    page: number;
    limit: number;
  }> {
    const { page, limit, skip } = this.normalizePagination(rawPage, rawLimit);
    const filter = { userId, isArchived: { $ne: true } };
    const [documents, total] = await Promise.all([
      this.resumeQuizResultModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      this.resumeQuizResultModel.countDocuments(filter),
    ]);

    return {
      records: documents.map((result) => ({
        resultId: result.resultId,
        status: 'success',
        inputData: {
          company: result.company,
          positionName: result.position,
          salaryRange: result.salaryRange,
        },
        totalQuestions: result.totalQuestions ?? result.questions.length,
        createdAt: this.getDocumentDate(result, 'createdAt'),
      })),
      total,
      page,
      limit,
    };
  }

  async getMockInterviewHistory(
    userId: string,
    interviewType: AIInterviewType,
    rawPage?: string,
    rawLimit?: string,
  ): Promise<{
    records: Array<Record<string, unknown>>;
    total: number;
    page: number;
    limit: number;
  }> {
    const { page, limit, skip } = this.normalizePagination(rawPage, rawLimit);
    const filter = {
      userId,
      interviewType,
      isArchived: { $ne: true },
    };
    const [documents, total] = await Promise.all([
      this.aiInterviewResultModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      this.aiInterviewResultModel.countDocuments(filter),
    ]);

    return {
      records: documents.map((result) => ({
        resultId: result.resultId,
        status: result.status,
        reportStatus: result.reportStatus,
        inputData: {
          company: result.company || '',
          positionName: result.position || '',
          salaryRange: result.salaryRange,
        },
        totalQuestions: result.totalQuestions,
        answeredQuestions: result.answeredQuestions,
        createdAt: this.getDocumentDate(result, 'createdAt'),
        completedAt: result.completedAt,
      })),
      total,
      page,
      limit,
    };
  }

  async getResumeQuizResult(
    userId: string,
    resultId: string,
  ): Promise<Record<string, unknown>> {
    const result = await this.resumeQuizResultModel.findOne({
      userId,
      resultId,
      isArchived: { $ne: true },
    });
    if (!result) throw new NotFoundException('简历押题结果不存在');

    return {
      resultId: result.resultId,
      company: result.company,
      position: result.position,
      salaryRange: result.salaryRange,
      questions: result.questions,
      summary: result.summary,
      matchScore: result.matchScore,
      matchLevel: result.matchLevel,
      matchedSkills: result.matchedSkills,
      missingSkills: result.missingSkills,
      knowledgeGaps: result.knowledgeGaps,
      learningPriorities: result.learningPriorities,
      radarData: result.radarData,
      strengths: result.strengths,
      weaknesses: result.weaknesses,
      interviewTips: result.interviewTips,
      createdAt: this.getDocumentDate(result, 'createdAt'),
    };
  }

  async getUnfinishedMockInterviews(
    userId: string,
  ): Promise<Array<Record<string, unknown>>> {
    const documents = await this.aiInterviewResultModel
      .find({ userId, status: { $in: ['in_progress', 'paused'] } })
      .sort({ updatedAt: -1 })
      .limit(20);
    return documents.map((result) => ({
      resultId: result.resultId,
      interviewType: result.interviewType,
      status: result.status,
      company: result.company || '',
      position: result.position || '',
      totalQuestions: result.totalQuestions,
      answeredQuestions: result.answeredQuestions,
      pausedAt: result.pausedAt,
      updatedAt: this.getDocumentDate(result, 'updatedAt'),
    }));
  }

  async getMockInterviewQAResult(
    userId: string,
    resultId: string,
  ): Promise<Record<string, unknown>> {
    const result = await this.findOwnedMockInterview(userId, resultId);
    return {
      resultId: result.resultId,
      interviewType: result.interviewType,
      status: result.status,
      questions: result.qaList.map((qa) => ({
        question: qa.question,
        answer: qa.answer,
        standardAnswer: qa.standardAnswer,
        score: qa.score,
        starAnalysis: qa.starAnalysis,
        aiComment: qa.aiComment,
        highlights: qa.highlights,
        improvements: qa.improvements,
        askedAt: qa.askedAt,
        answeredAt: qa.answeredAt,
      })),
    };
  }

  async getMockInterviewSessionHistory(
    userId: string,
    resultId: string,
  ): Promise<Record<string, unknown>> {
    const result = await this.findOwnedMockInterview(userId, resultId);
    const session = result.sessionState
      ? this.hydrateInterviewSession(result.sessionState)
      : undefined;
    const metadata = result.metadata || {};
    const conversationHistory =
      session?.conversationHistory ??
      result.qaList.flatMap((qa) => [
        {
          role: 'interviewer',
          content: qa.question,
          timestamp: qa.askedAt,
          standardAnswer: qa.standardAnswer,
          referenceAnswer: qa.standardAnswer,
        },
        ...(qa.answer
          ? [
              {
                role: 'candidate',
                content: qa.answer,
                timestamp: qa.answeredAt,
              },
            ]
          : []),
      ]);

    return {
      conversationHistory,
      sessionInfo: {
        resultId: result.resultId,
        sessionId: session?.sessionId ?? result.resultId,
        interviewerName:
          session?.interviewerName ??
          (typeof metadata.interviewerName === 'string'
            ? metadata.interviewerName
            : 'AI 面试官'),
        position: result.position || '',
        company: result.company || '',
        interviewType: result.interviewType,
        status: result.status,
      },
    };
  }

  private async findOwnedMockInterview(
    userId: string,
    resultId: string,
  ): Promise<AIInterviewResultDocument> {
    const result = await this.aiInterviewResultModel.findOne({
      userId,
      resultId,
      isArchived: { $ne: true },
    });
    if (!result) throw new NotFoundException('模拟面试结果不存在');
    return result;
  }

  private normalizePagination(
    rawPage?: string,
    rawLimit?: string,
  ): { page: number; limit: number; skip: number } {
    const parsedPage = Number(rawPage);
    const parsedLimit = Number(rawLimit);
    const page =
      Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
    const limit =
      Number.isInteger(parsedLimit) && parsedLimit > 0
        ? Math.min(parsedLimit, 100)
        : 10;
    return { page, limit, skip: (page - 1) * limit };
  }

  private triggerAssessmentReportGeneration(
    userId: string,
    resultId: string,
  ): void {
    void this.generateAssessmentReport(userId, resultId).catch(
      (error: unknown) => {
        this.logger.error(
          `后台评估报告任务失败: resultId=${resultId}, error=${this.getErrorMessage(error)}`,
        );
      },
    );
  }

  /**
   * 原子认领并异步生成模拟面试评估报告。
   * 同一结果只有从 pending/failed 成功切换到 generating 的调用方会执行 AI 请求。
   */
  async generateAssessmentReport(
    userId: string,
    resultId: string,
  ): Promise<void> {
    try {
      const now = new Date();
      const leaseMs = Math.max(
        30_000,
        Number(this.configService?.get<string>('REPORT_RETRY_LEASE_MS')) ||
          300_000,
      );
      const dbResult = await this.aiInterviewResultModel.findOneAndUpdate(
        {
          resultId,
          userId,
          status: 'completed',
          reportAttempts: { $lt: this.reportMaxAttempts() },
          $or: [
            { reportStatus: ReportStatus.PENDING },
            {
              reportStatus: ReportStatus.FAILED,
              nextReportRetryAt: { $lte: now },
            },
          ],
        },
        {
          $set: {
            reportStatus: ReportStatus.GENERATING,
            lastReportAttemptAt: now,
            reportLeaseExpiresAt: new Date(now.getTime() + leaseMs),
          },
          $inc: { reportAttempts: 1 },
          $unset: { reportError: 1 },
        },
        { new: true },
      );

      if (!dbResult) {
        const existing = await this.aiInterviewResultModel.findOne({
          resultId,
          userId,
        });
        if (!existing) {
          throw new NotFoundException(`未找到面试记录: ${resultId}`);
        }
        this.logger.log(`评估报告无需重复生成: resultId=${resultId}`);
        return;
      }

      const qaList = (dbResult.qaList || [])
        .filter(
          (qa) =>
            typeof qa?.question === 'string' &&
            qa.question.trim() !== '' &&
            qa.question !== '[生成中...]' &&
            typeof qa.answer === 'string' &&
            qa.answer.trim() !== '',
        )
        .map((qa) => ({
          question: qa.question.trim(),
          answer: qa.answer.trim(),
          standardAnswer: qa.standardAnswer?.trim() || undefined,
        }));

      this.logger.log(
        `开始异步生成评估报告: resultId=${resultId}, qaCount=${qaList.length}`,
      );
      if (qaList.length === 0) {
        await this.saveEmptyAnswerAssessment(
          userId,
          resultId,
          dbResult.reportLocale,
        );
        return;
      }

      const totalAnswerLength = qaList.reduce(
        (sum, qa) => sum + qa.answer.length,
        0,
      );
      const avgAnswerLength = Math.round(totalAnswerLength / qaList.length);
      const emptyAnswersCount = qaList.filter(
        (qa) => qa.answer.length < 10,
      ).length;
      const assessment = await this.aiService.generateInterviewAssessmentReport(
        {
          interviewType:
            dbResult.interviewType === AIInterviewType.SPECIAL
              ? 'special'
              : 'comprehensive',
          company: dbResult.company || '',
          positionName: dbResult.position || '',
          jd: dbResult.jobDescription || '',
          resumeContent: this.getResumeContentFromSessionState(
            dbResult.sessionState,
          ),
          qaList,
          answerQualityMetrics: {
            totalQuestions: qaList.length,
            avgAnswerLength,
            emptyAnswersCount,
          },
          cacheScope: userId,
          locale: dbResult.reportLocale,
          promptVersion: dbResult.promptVersion || 'v1',
        },
      );

      await this.aiInterviewResultModel.findOneAndUpdate(
        {
          resultId,
          userId,
          reportStatus: ReportStatus.GENERATING,
        },
        {
          $set: {
            ...assessment,
            reportStatus: ReportStatus.COMPLETED,
            reportGeneratedAt: new Date(),
          },
          $unset: {
            reportError: 1,
            nextReportRetryAt: 1,
            reportLeaseExpiresAt: 1,
          },
        },
      );
      this.logger.log(
        `评估报告生成成功: resultId=${resultId}, overallScore=${assessment.overallScore}`,
      );
    } catch (error) {
      const message = this.getErrorMessage(error);
      const failedAt = new Date();
      const existing = await this.aiInterviewResultModel.findOne({
        resultId,
        userId,
      });
      const attempts = Math.max(1, Number(existing?.reportAttempts) || 1);
      const maxAttempts = this.reportMaxAttempts();
      const baseMs = Math.max(
        1_000,
        Number(this.configService?.get<string>('REPORT_RETRY_BASE_MS')) ||
          60_000,
      );
      const maxDelayMs = Math.max(
        baseMs,
        Number(this.configService?.get<string>('REPORT_RETRY_MAX_DELAY_MS')) ||
          3_600_000,
      );
      const nextRetryAt = new Date(
        failedAt.getTime() +
          Math.min(maxDelayMs, baseMs * 2 ** Math.max(0, attempts - 1)),
      );
      await this.aiInterviewResultModel.findOneAndUpdate(
        {
          resultId,
          userId,
          reportStatus: ReportStatus.GENERATING,
        },
        {
          $set: {
            reportStatus: ReportStatus.FAILED,
            reportError: message,
            reportLastFailureAt: failedAt,
            ...(attempts < maxAttempts
              ? { nextReportRetryAt: nextRetryAt }
              : {}),
          },
          $unset: {
            reportLeaseExpiresAt: 1,
            ...(attempts >= maxAttempts ? { nextReportRetryAt: 1 } : {}),
          },
        },
      );
      throw error;
    }
  }

  private async saveEmptyAnswerAssessment(
    userId: string,
    resultId: string,
    locale: 'zh-CN' | 'en-US' = 'zh-CN',
  ): Promise<void> {
    const english = locale === 'en-US';
    await this.aiInterviewResultModel.findOneAndUpdate(
      { resultId, userId, reportStatus: ReportStatus.GENERATING },
      {
        $set: {
          overallScore: 30,
          overallLevel: english ? 'Needs improvement' : '需提升',
          overallComment: english
            ? 'There were no substantive answers in this interview, so professional competencies could not be assessed. Prepare further and try another interview.'
            : '本次面试未能有效进行，候选人没有回答任何问题，无法评估专业能力。建议重新安排面试。',
          radarData: [
            {
              dimension: english ? 'Technical ability' : '技术能力',
              score: 0,
              description: english ? 'Not assessed' : '未评估',
            },
            {
              dimension: english ? 'Project experience' : '项目经验',
              score: 0,
              description: english ? 'Not assessed' : '未评估',
            },
            {
              dimension: english ? 'Problem solving' : '问题解决',
              score: 0,
              description: english ? 'Not assessed' : '未评估',
            },
            {
              dimension: english ? 'Learning ability' : '学习能力',
              score: 0,
              description: english ? 'Not assessed' : '未评估',
            },
            {
              dimension: english ? 'Communication' : '沟通表达',
              score: 0,
              description: english ? 'Not assessed' : '未评估',
            },
          ],
          strengths: [],
          weaknesses: english
            ? [
                'No interview answers were provided',
                'Professional ability could not be assessed',
              ]
            : ['未参与面试问答', '无法评估专业能力'],
          improvements: [
            {
              category: english ? 'Interview preparation' : '面试准备',
              suggestion: english
                ? 'Prepare complete examples and try the interview again.'
                : '建议充分准备后重新参加面试',
              priority: 'high',
            },
          ],
          fluencyScore: 0,
          logicScore: 0,
          professionalScore: 0,
          reportStatus: ReportStatus.COMPLETED,
          reportGeneratedAt: new Date(),
        },
        $unset: {
          reportError: 1,
          nextReportRetryAt: 1,
          reportLeaseExpiresAt: 1,
        },
      },
    );
    this.logger.log(`默认低分报告已生成: resultId=${resultId}`);
  }

  private reportMaxAttempts(): number {
    return Math.max(
      1,
      Math.min(
        10,
        Number(this.configService?.get<string>('REPORT_RETRY_MAX_ATTEMPTS')) ||
          5,
      ),
    );
  }

  private async generateResumeQuizAnalysis(
    result: ResumeQuizResultDocument,
  ): Promise<ResumeQuizAnalysisDto> {
    const viewedResult = await this.resumeQuizResultModel.findByIdAndUpdate(
      result._id,
      {
        $inc: { viewCount: 1 },
        $set: { lastViewedAt: new Date() },
      },
      { new: true },
    );
    const createdAt = this.getDocumentDate(result, 'createdAt');
    return {
      resultId: result.resultId,
      type: 'resume_quiz',
      company: result.company || '',
      position: result.position,
      salaryRange: result.salaryRange,
      createdAt,
      matchScore: result.matchScore ?? 0,
      matchLevel: result.matchLevel || '中等',
      matchedSkills: result.matchedSkills || [],
      missingSkills: result.missingSkills || [],
      knowledgeGaps: result.knowledgeGaps || [],
      learningPriorities: (result.learningPriorities || []).map((item) => ({
        topic: item.topic,
        priority: item.priority as 'high' | 'medium' | 'low',
        reason: item.reason,
      })),
      radarData: result.radarData || [],
      strengths: result.strengths || [],
      weaknesses: result.weaknesses || [],
      summary: result.summary || '',
      interviewTips: result.interviewTips || [],
      totalQuestions: result.questions?.length || 0,
      questionDistribution: result.questionDistribution || {},
      viewCount: viewedResult?.viewCount ?? (result.viewCount || 0) + 1,
    };
  }

  private formatAIInterviewAnalysis(result: AIInterviewResultDocument) {
    return {
      resultId: result.resultId,
      type:
        result.interviewType === AIInterviewType.SPECIAL
          ? 'special_interview'
          : 'comprehensive_interview',
      company: result.company || '',
      position: result.position || '',
      salaryRange: result.salaryRange,
      createdAt: this.getDocumentDate(result, 'createdAt'),
      completedAt: result.completedAt,
      reportStatus: result.reportStatus,
      reportGeneratedAt: result.reportGeneratedAt,
      overallScore: result.overallScore ?? 0,
      overallLevel: result.overallLevel || '需提升',
      overallComment: result.overallComment || '',
      radarData: result.radarData || [],
      strengths: result.strengths || [],
      weaknesses: result.weaknesses || [],
      improvements: result.improvements || [],
      fluencyScore: result.fluencyScore ?? 0,
      logicScore: result.logicScore ?? 0,
      professionalScore: result.professionalScore ?? 0,
      totalQuestions: result.totalQuestions || 0,
      answeredQuestions: result.answeredQuestions || 0,
      viewCount: result.viewCount || 0,
    };
  }

  private getResumeContentFromSessionState(sessionState: unknown): string {
    if (!sessionState || typeof sessionState !== 'object') return '';
    const resumeContent = (sessionState as Record<string, unknown>)
      .resumeContent;
    return typeof resumeContent === 'string' ? resumeContent : '';
  }

  private getDocumentDate(document: object, field: string): string {
    const value = (document as Record<string, unknown>)[field];
    return value
      ? new Date(value as string | number | Date).toISOString()
      : new Date().toISOString();
  }

  private async executeStartMockInterview(
    userId: string,
    dto: StartMockInterviewDto,
    progressSubject: Subject<MockInterviewEventDto>,
  ): Promise<void> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('用户信息无效，请重新登录');
    }
    const countField =
      dto.interviewType === MockInterviewType.SPECIAL
        ? 'specialRemainingCount'
        : 'behaviorRemainingCount';
    let charged = false;
    let createdSessionId: string | undefined;
    let createdResultId: string | undefined;

    try {
      const user = await this.userModel.findOneAndUpdate(
        { _id: userId, [countField]: { $gt: 0 } },
        { $inc: { [countField]: -1 } },
        { new: false },
      );
      if (!user) {
        const label =
          dto.interviewType === MockInterviewType.SPECIAL
            ? '专项面试'
            : '综合面试';
        throw new BadRequestException(`${label}次数不足，请前往充值页面购买`);
      }
      charged = true;

      const resumeContent = await this.extractMockResumeContent(userId, dto);
      if (dto.resumeId) {
        await this.knowledgeService.indexResume(
          userId,
          dto.resumeId,
          resumeContent,
        );
      }
      const sessionId = randomUUID();
      const resultId = randomUUID();
      createdSessionId = sessionId;
      createdResultId = resultId;
      const recordId = randomUUID();
      const interviewerName = '张老师';
      const targetDuration =
        dto.interviewType === MockInterviewType.SPECIAL
          ? this.SPECIAL_INTERVIEW_MAX_DURATION
          : this.BEHAVIOR_INTERVIEW_MAX_DURATION;
      const session: InterviewSession = {
        sessionId,
        resultId,
        consumptionRecordId: recordId,
        userId,
        interviewType: dto.interviewType,
        interviewerName,
        candidateName: dto.candidateName,
        company: dto.company || '',
        positionName: dto.positionName,
        salaryRange: this.formatSalaryRange(dto.minSalary, dto.maxSalary),
        jd: dto.jd,
        resumeContent,
        conversationHistory: [],
        questionCount: 0,
        startTime: new Date(),
        targetDuration,
        isActive: true,
        locale: dto.locale || 'zh-CN',
      };
      this.interviewSessions.set(sessionId, session);

      await this.aiInterviewResultModel.create({
        resultId,
        user: new Types.ObjectId(userId),
        userId,
        interviewType:
          dto.interviewType === MockInterviewType.SPECIAL
            ? AIInterviewType.SPECIAL
            : AIInterviewType.BEHAVIOR,
        company: dto.company || '',
        position: dto.positionName,
        salaryRange: session.salaryRange,
        jobDescription: dto.jd,
        interviewMode: 'text',
        qaList: [],
        totalQuestions: 0,
        answeredQuestions: 0,
        status: 'in_progress',
        consumptionRecordId: recordId,
        sessionState: session,
        reportLocale: session.locale,
        metadata: {
          interviewerName,
          candidateName: dto.candidateName,
          sessionId,
          resumeId: dto.resumeId,
        },
      });
      await this.consumptionRecordModel.create({
        resultId,
        recordId,
        user: new Types.ObjectId(userId),
        userId,
        type:
          dto.interviewType === MockInterviewType.SPECIAL
            ? ConsumptionType.SPECIAL_INTERVIEW
            : ConsumptionType.BEHAVIOR_INTERVIEW,
        status: ConsumptionStatus.SUCCESS,
        consumedCount: 1,
        description: `模拟面试 - ${dto.interviewType === MockInterviewType.SPECIAL ? '专项面试' : '综合面试'}`,
        inputData: {
          company: dto.company || '',
          position: dto.positionName,
          interviewType: dto.interviewType,
        },
        outputData: { resultId, sessionId },
        startedAt: session.startTime,
      });

      let fullOpeningStatement = '';
      for await (const chunk of this.aiService.generateOpeningStatementStream(
        interviewerName,
        dto.candidateName,
        dto.positionName,
        session.locale,
      )) {
        fullOpeningStatement += chunk;
        progressSubject.next({
          type: MockInterviewEventType.START,
          sessionId,
          resultId,
          interviewerName,
          content: fullOpeningStatement,
          questionNumber: 0,
          totalQuestions:
            dto.interviewType === MockInterviewType.SPECIAL ? 12 : 8,
          elapsedMinutes: 0,
          isStreaming: true,
        });
      }

      const askedAt = new Date();
      session.conversationHistory.push({
        role: 'interviewer',
        content: fullOpeningStatement,
        timestamp: askedAt,
      });
      await this.aiInterviewResultModel.findOneAndUpdate(
        { resultId, userId },
        {
          $push: {
            qaList: {
              question: fullOpeningStatement,
              answer: '',
              answerDuration: 0,
              askedAt,
            },
          },
          $inc: { totalQuestions: 1 },
          $set: { sessionState: session },
        },
      );
      progressSubject.next({
        type: MockInterviewEventType.START,
        sessionId,
        resultId,
        interviewerName,
        content: fullOpeningStatement,
        questionNumber: 0,
        totalQuestions:
          dto.interviewType === MockInterviewType.SPECIAL ? 12 : 8,
        elapsedMinutes: 0,
        isStreaming: false,
      });
      progressSubject.next({
        type: MockInterviewEventType.WAITING,
        sessionId,
      });
      progressSubject.complete();
    } catch (error) {
      if (createdSessionId) this.interviewSessions.delete(createdSessionId);
      if (createdResultId) {
        await this.aiInterviewResultModel
          .findOneAndUpdate(
            { resultId: createdResultId, status: 'in_progress' },
            {
              $set: {
                status: 'abandoned',
                reportError: '面试启动失败',
              },
            },
          )
          .catch(() => undefined);
      }
      if (charged) {
        await this.refundCount(
          userId,
          dto.interviewType === MockInterviewType.SPECIAL
            ? 'special'
            : 'behavior',
        );
      }
      throw error;
    }
  }

  private async executeAnswerMockInterview(
    userId: string,
    sessionId: string,
    answer: string,
    progressSubject: Subject<MockInterviewEventDto>,
  ): Promise<void> {
    const session = this.interviewSessions.get(sessionId);
    if (!session) throw new NotFoundException('面试会话不存在或已过期');
    if (session.userId !== userId) {
      throw new BadRequestException('无权访问此面试会话');
    }
    if (!session.isActive) throw new BadRequestException('面试会话已结束');
    if (this.sessionsProcessingAnswer.has(sessionId)) {
      throw new BadRequestException('上一条回答仍在处理中，请稍后再试');
    }
    this.sessionsProcessingAnswer.add(sessionId);

    try {
      const answeredAt = new Date();
      session.conversationHistory.push({
        role: 'candidate',
        content: answer,
        timestamp: answeredAt,
      });
      session.questionCount += 1;
      const elapsedMinutes = Math.floor(
        (Date.now() - session.startTime.getTime()) / 60_000,
      );

      if (elapsedMinutes >= session.targetDuration) {
        const closingStatement =
          session.locale === 'en-US'
            ? `Thank you for your time. We have reached the ${elapsedMinutes}-minute limit, so today’s interview is complete. We will now prepare your assessment report.`
            : `感谢你今天的面试表现。由于时间关系（已进行${elapsedMinutes}分钟），我们今天的面试就到这里。后续我们会进行综合评估，有结果会及时通知你。祝你生活愉快！`;
        await this.updateInterviewAnswer(
          session.resultId!,
          session.questionCount - 1,
          answer,
          answeredAt,
          session,
        );
        session.isActive = false;
        session.conversationHistory.push({
          role: 'interviewer',
          content: closingStatement,
          timestamp: new Date(),
        });
        const resultId = await this.saveMockInterviewResult(session);
        progressSubject.next({
          type: MockInterviewEventType.END,
          sessionId,
          content: closingStatement,
          resultId,
          elapsedMinutes,
          isStreaming: false,
          metadata: {
            totalQuestions: session.questionCount,
            interviewerName: session.interviewerName,
            reason: 'timeout',
          },
        });
        this.scheduleSessionCleanup(sessionId);
        progressSubject.complete();
        return;
      }

      progressSubject.next({
        type: MockInterviewEventType.THINKING,
        sessionId,
      });
      const questionStartTime = new Date();
      const generator = this.aiService.generateInterviewQuestionStream({
        interviewType:
          session.interviewType === MockInterviewType.SPECIAL
            ? 'special'
            : 'comprehensive',
        resumeContent: session.resumeContent,
        company: session.company,
        positionName: session.positionName,
        jd: session.jd,
        conversationHistory: session.conversationHistory.map(
          ({ role, content }) => ({ role, content }),
        ),
        elapsedMinutes,
        targetDuration: session.targetDuration,
        retrievedContext: await this.knowledgeService.retrieve(
          userId,
          [session.positionName, session.jd, answer].filter(Boolean).join(' '),
        ),
        locale: session.locale,
      });

      let fullContent = '';
      let questionOnlyContent = '';
      let standardAnswerContent = '';
      let hasStandardAnswer = false;
      let iteration = await generator.next();
      while (!iteration.done) {
        fullContent += iteration.value;
        const markerIndex = fullContent.indexOf('[STANDARD_ANSWER]');
        if (markerIndex >= 0) {
          if (!hasStandardAnswer) {
            hasStandardAnswer = true;
            questionOnlyContent = fullContent.slice(0, markerIndex).trim();
            progressSubject.next({
              type: MockInterviewEventType.QUESTION,
              sessionId,
              interviewerName: session.interviewerName,
              content: questionOnlyContent,
              questionNumber: session.questionCount,
              totalQuestions:
                session.interviewType === MockInterviewType.SPECIAL ? 12 : 8,
              elapsedMinutes,
              isStreaming: false,
            });
          }
          standardAnswerContent = fullContent
            .slice(markerIndex + '[STANDARD_ANSWER]'.length)
            .replace(/\[END_INTERVIEW\][\s\S]*$/, '')
            .trim();
          progressSubject.next({
            type: MockInterviewEventType.REFERENCE_ANSWER,
            sessionId,
            content: standardAnswerContent,
            questionNumber: session.questionCount,
            elapsedMinutes,
            isStreaming: true,
          });
        } else {
          progressSubject.next({
            type: MockInterviewEventType.QUESTION,
            sessionId,
            interviewerName: session.interviewerName,
            content: fullContent.replace(/\[END_INTERVIEW\].*$/, '').trim(),
            questionNumber: session.questionCount,
            totalQuestions:
              session.interviewType === MockInterviewType.SPECIAL ? 12 : 8,
            elapsedMinutes,
            isStreaming: true,
          });
        }
        iteration = await generator.next();
      }
      const aiResponse = iteration.value;

      if (!session.resultId) throw new Error('面试结果ID不存在，无法保存数据');
      await this.updateInterviewAnswer(
        session.resultId,
        session.questionCount - 1,
        answer,
        answeredAt,
        session,
      );
      const newQuestionIndex = await this.createInterviewQuestionPlaceholder(
        session.resultId,
        questionStartTime,
      );
      session.conversationHistory.push({
        role: 'interviewer',
        content: aiResponse.question,
        timestamp: questionStartTime,
        standardAnswer: aiResponse.standardAnswer,
      });
      await this.updateInterviewQuestion(
        session.resultId,
        newQuestionIndex,
        aiResponse.question,
        questionStartTime,
      );
      if (aiResponse.standardAnswer) {
        await this.updateInterviewStandardAnswer(
          session.resultId,
          newQuestionIndex,
          aiResponse.standardAnswer,
        );
      }
      await this.aiInterviewResultModel.findOneAndUpdate(
        { resultId: session.resultId, userId },
        { $set: { sessionState: session } },
      );

      if (hasStandardAnswer && standardAnswerContent) {
        progressSubject.next({
          type: MockInterviewEventType.REFERENCE_ANSWER,
          sessionId,
          content: aiResponse.standardAnswer || standardAnswerContent,
          questionNumber: session.questionCount,
          elapsedMinutes,
          isStreaming: false,
        });
      }
      if (aiResponse.shouldEnd) {
        session.isActive = false;
        const resultId = await this.saveMockInterviewResult(session);
        progressSubject.next({
          type: MockInterviewEventType.END,
          sessionId,
          content: aiResponse.question,
          resultId,
          elapsedMinutes,
          isStreaming: false,
          metadata: {
            totalQuestions: session.questionCount,
            interviewerName: session.interviewerName,
          },
        });
        this.scheduleSessionCleanup(sessionId);
      } else {
        if (!hasStandardAnswer) {
          progressSubject.next({
            type: MockInterviewEventType.QUESTION,
            sessionId,
            interviewerName: session.interviewerName,
            content: aiResponse.question,
            questionNumber: session.questionCount,
            totalQuestions:
              session.interviewType === MockInterviewType.SPECIAL ? 12 : 8,
            elapsedMinutes,
            isStreaming: false,
          });
        }
        progressSubject.next({
          type: MockInterviewEventType.WAITING,
          sessionId,
        });
      }
      progressSubject.complete();
    } finally {
      this.sessionsProcessingAnswer.delete(sessionId);
    }
  }

  private async extractMockResumeContent(
    userId: string,
    dto: StartMockInterviewDto,
  ): Promise<string> {
    let rawContent = dto.resumeContent?.trim();
    if (!rawContent && dto.resumeId) {
      const resume = await this.resumeService.getOwnedResume(
        userId,
        dto.resumeId,
      );
      rawContent = await this.documentParserService.parseDocumentFromUrl(
        resume.resumeUrl,
      );
    }
    if (!rawContent) throw new BadRequestException('请提供简历或简历文本');
    const cleanedText = this.documentParserService.cleanText(rawContent);
    const validation =
      this.documentParserService.validateResumeContent(cleanedText);
    if (!validation.isValid) {
      throw new BadRequestException(validation.reason);
    }
    return cleanedText;
  }

  private async saveMockInterviewResult(
    session: InterviewSession,
  ): Promise<string> {
    if (session.resultId) {
      const completedAt = new Date();
      const interviewDuration = Math.max(
        0,
        Math.floor(
          (completedAt.getTime() - session.startTime.getTime()) / 60_000,
        ),
      );
      const result = await this.aiInterviewResultModel.findOneAndUpdate(
        { resultId: session.resultId, userId: session.userId },
        {
          $set: {
            status: 'completed',
            completedAt,
            interviewDuration,
            sessionState: session,
          },
        },
        { new: true },
      );
      if (!result) throw new NotFoundException('面试记录不存在');
      if (session.consumptionRecordId) {
        await this.consumptionRecordModel.findOneAndUpdate(
          { recordId: session.consumptionRecordId },
          {
            $set: {
              status: ConsumptionStatus.SUCCESS,
              completedAt,
              outputData: {
                resultId: session.resultId,
                questionCount: session.questionCount,
                duration: interviewDuration,
              },
            },
          },
        );
      }
      this.triggerAssessmentReportGeneration(session.userId, session.resultId);
      return session.resultId;
    }

    const resultId = randomUUID();
    const recordId = randomUUID();
    const qaList = [] as Array<{
      question: string;
      answer: string;
      standardAnswer?: string;
      answerDuration: number;
      askedAt: Date;
      answeredAt: Date;
    }>;
    for (
      let index = 0;
      index + 1 < session.conversationHistory.length;
      index += 2
    ) {
      const question = session.conversationHistory[index];
      const answer = session.conversationHistory[index + 1];
      if (question.role !== 'interviewer' || answer.role !== 'candidate')
        continue;
      qaList.push({
        question: question.content,
        answer: answer.content,
        standardAnswer: question.standardAnswer,
        answerDuration: 0,
        askedAt: question.timestamp,
        answeredAt: answer.timestamp,
      });
    }
    const completedAt = new Date();
    await this.aiInterviewResultModel.create({
      resultId,
      user: new Types.ObjectId(session.userId),
      userId: session.userId,
      interviewType:
        session.interviewType === MockInterviewType.SPECIAL
          ? AIInterviewType.SPECIAL
          : AIInterviewType.BEHAVIOR,
      company: session.company,
      position: session.positionName,
      salaryRange: session.salaryRange,
      jobDescription: session.jd,
      interviewDuration: Math.floor(
        (completedAt.getTime() - session.startTime.getTime()) / 60_000,
      ),
      interviewMode: 'text',
      qaList,
      totalQuestions: qaList.length,
      answeredQuestions: qaList.length,
      status: 'completed',
      completedAt,
      consumptionRecordId: recordId,
      sessionState: session,
      metadata: {
        interviewerName: session.interviewerName,
        candidateName: session.candidateName,
      },
      reportLocale: session.locale,
    });
    this.triggerAssessmentReportGeneration(session.userId, resultId);
    return resultId;
  }

  private async updateInterviewAnswer(
    resultId: string,
    qaIndex: number,
    answer: string,
    answeredAt: Date,
    session: InterviewSession,
  ): Promise<void> {
    const existing = await this.aiInterviewResultModel.findOne({ resultId });
    if (!existing?.qaList[qaIndex]) {
      throw new NotFoundException('未找到对应的面试问题');
    }
    const isFirstAnswer = !existing.qaList[qaIndex].answer;
    const update: {
      $set: Record<string, unknown>;
      $inc?: { answeredQuestions: number };
    } = {
      $set: {
        [`qaList.${qaIndex}.answer`]: answer,
        [`qaList.${qaIndex}.answeredAt`]: answeredAt,
        sessionState: session,
      },
    };
    if (isFirstAnswer) update.$inc = { answeredQuestions: 1 };
    const result = await this.aiInterviewResultModel.findOneAndUpdate(
      { resultId },
      update,
      { new: true },
    );
    if (!result) throw new NotFoundException('面试记录不存在');
  }

  private async createInterviewQuestionPlaceholder(
    resultId: string,
    askedAt: Date,
  ): Promise<number> {
    const existing = await this.aiInterviewResultModel.findOne({ resultId });
    if (!existing) throw new NotFoundException('面试记录不存在');
    const qaIndex = existing.qaList.length;
    const result = await this.aiInterviewResultModel.findOneAndUpdate(
      { resultId },
      {
        $push: {
          qaList: {
            question: '[生成中...]',
            answer: '',
            standardAnswer: '',
            answerDuration: 0,
            askedAt,
          },
        },
        $inc: { totalQuestions: 1 },
      },
      { new: true },
    );
    if (!result) throw new NotFoundException('面试记录不存在');
    return qaIndex;
  }

  private async updateInterviewQuestion(
    resultId: string,
    qaIndex: number,
    question: string,
    askedAt: Date,
  ): Promise<void> {
    const result = await this.aiInterviewResultModel.findOneAndUpdate(
      { resultId },
      {
        $set: {
          [`qaList.${qaIndex}.question`]: question,
          [`qaList.${qaIndex}.askedAt`]: askedAt,
        },
      },
      { new: true },
    );
    if (!result) throw new NotFoundException('面试记录不存在');
  }

  private async updateInterviewStandardAnswer(
    resultId: string,
    qaIndex: number,
    standardAnswer: string,
  ): Promise<void> {
    const result = await this.aiInterviewResultModel.findOneAndUpdate(
      { resultId },
      { $set: { [`qaList.${qaIndex}.standardAnswer`]: standardAnswer } },
      { new: true },
    );
    if (!result) throw new NotFoundException('面试记录不存在');
  }

  private hydrateInterviewSession(rawSession: unknown): InterviewSession {
    if (!rawSession || typeof rawSession !== 'object') {
      throw new BadRequestException('会话数据不完整，无法恢复');
    }
    const candidate = rawSession as Partial<InterviewSession>;
    if (
      !candidate.sessionId ||
      !candidate.userId ||
      !candidate.interviewType ||
      !candidate.interviewerName ||
      !candidate.resultId ||
      !Array.isArray(candidate.conversationHistory)
    ) {
      throw new BadRequestException('会话数据不完整，无法恢复');
    }
    return {
      ...candidate,
      sessionId: candidate.sessionId,
      userId: candidate.userId,
      interviewType: candidate.interviewType,
      interviewerName: candidate.interviewerName,
      resultId: candidate.resultId,
      company: candidate.company || '',
      resumeContent: candidate.resumeContent || '',
      conversationHistory: candidate.conversationHistory.map((entry) => ({
        ...entry,
        timestamp: new Date(entry.timestamp),
      })),
      questionCount: candidate.questionCount || 0,
      startTime: new Date(candidate.startTime || Date.now()),
      targetDuration:
        candidate.targetDuration ||
        (candidate.interviewType === MockInterviewType.SPECIAL
          ? this.SPECIAL_INTERVIEW_MAX_DURATION
          : this.BEHAVIOR_INTERVIEW_MAX_DURATION),
      isActive: candidate.isActive ?? false,
      locale: candidate.locale || 'zh-CN',
    };
  }

  private scheduleSessionCleanup(sessionId: string): void {
    const timer = setTimeout(
      () => {
        this.interviewSessions.delete(sessionId);
        this.sessionsProcessingAnswer.delete(sessionId);
      },
      5 * 60 * 1000,
    );
    timer.unref();
  }

  private async executeResumeQuiz(
    userId: string,
    dto: ResumeQuizDto,
    progressSubject: Subject<ProgressEvent>,
  ): Promise<void> {
    const recordId = randomUUID();
    const resultId = randomUUID();
    let consumptionRecord: ConsumptionRecordDocument | null = null;
    let charged = false;
    let stopSimulatedProgress: (() => void) | undefined;
    const english = dto.locale === 'en-US';

    try {
      if (!Types.ObjectId.isValid(userId)) {
        throw new BadRequestException(
          english
            ? 'Your session is invalid. Please sign in again.'
            : '用户信息无效，请重新登录',
        );
      }

      const cachedResult = await this.resolveIdempotentRequest(
        userId,
        dto,
        progressSubject,
      );
      if (cachedResult) return;

      consumptionRecord = await this.createOrReuseConsumptionRecord(
        userId,
        dto,
        recordId,
        resultId,
      );

      const user = await this.userModel.findOneAndUpdate(
        { _id: userId, resumeRemainingCount: { $gt: 0 } },
        { $inc: { resumeRemainingCount: -1 } },
        { new: false },
      );
      if (!user) {
        throw new BadRequestException(
          english
            ? 'You do not have enough question-generation credits.'
            : '简历押题次数不足，请前往充值页面购买',
        );
      }
      charged = true;
      this.logger.log(
        `✅ 用户扣费成功: userId=${userId}, 扣费前=${user.resumeRemainingCount}, 扣费后=${user.resumeRemainingCount - 1}`,
      );

      this.emitProgress(
        progressSubject,
        0,
        english ? 'Reading your résumé…' : '📄 正在读取简历文档...',
        'prepare',
      );
      const resumeContent = await this.extractResumeContent(dto);
      this.emitProgress(
        progressSubject,
        5,
        english ? 'Résumé parsing complete' : '✅ 简历解析完成',
        'prepare',
      );
      this.emitProgress(
        progressSubject,
        10,
        english
          ? 'Ready. AI generation is starting…'
          : '🚀 准备就绪，即将开始 AI 生成...',
        'prepare',
      );

      const aiStartedAt = Date.now();
      stopSimulatedProgress = this.startSimulatedProgress(
        progressSubject,
        dto.locale,
      );
      const questionsResult =
        await this.aiService.generateResumeQuizQuestionsOnly({
          company: dto.company ?? '',
          positionName: dto.positionName,
          minSalary: dto.minSalary,
          maxSalary: dto.maxSalary,
          jd: dto.jd,
          resumeContent,
          promptVersion: dto.promptVersion,
          cacheScope: userId,
          locale: dto.locale || 'zh-CN',
        });
      stopSimulatedProgress();
      stopSimulatedProgress = undefined;

      this.emitProgress(
        progressSubject,
        50,
        english
          ? 'Questions generated. Analyzing role fit…'
          : '✅ 面试问题生成完成，开始分析匹配度...',
        'generating',
      );
      const analysisResult =
        await this.aiService.generateResumeQuizAnalysisOnly({
          company: dto.company ?? '',
          positionName: dto.positionName,
          minSalary: dto.minSalary,
          maxSalary: dto.maxSalary,
          jd: dto.jd,
          resumeContent,
          promptVersion: dto.promptVersion,
          cacheScope: userId,
          locale: dto.locale || 'zh-CN',
        });
      const aiDuration = Date.now() - aiStartedAt;

      this.emitProgress(
        progressSubject,
        90,
        english ? 'Saving generated results…' : '💾 正在保存生成结果...',
        'saving',
      );
      await this.saveQuizResult(
        userId,
        dto,
        resultId,
        consumptionRecord.recordId,
        questionsResult,
        analysisResult,
        aiDuration,
      );

      await this.consumptionRecordModel.findByIdAndUpdate(
        consumptionRecord._id,
        {
          $set: {
            status: ConsumptionStatus.SUCCESS,
            outputData: {
              resultId,
              questionCount: questionsResult.questions.length,
            },
            aiModel: 'deepseek-chat',
            aiResponseTime: aiDuration,
            resultId,
            completedAt: new Date(),
          },
        },
      );

      this.emitComplete(
        progressSubject,
        {
          resultId,
          ...questionsResult,
          ...analysisResult,
          remainingCount: await this.getRemainingCount(userId, 'resume'),
          consumptionRecordId: consumptionRecord.recordId,
          isFromCache: false,
        },
        dto.locale,
      );
    } catch (error) {
      stopSimulatedProgress?.();
      await this.handleResumeQuizFailure(
        userId,
        consumptionRecord,
        charged,
        error,
      );
      this.emitError(progressSubject, error, dto.locale);
    }
  }

  private async resolveIdempotentRequest(
    userId: string,
    dto: ResumeQuizDto,
    progressSubject: Subject<ProgressEvent>,
  ): Promise<boolean> {
    if (!dto.requestId) return false;

    const existingRecord = await this.consumptionRecordModel.findOne({
      userId,
      $or: [
        { requestId: dto.requestId },
        { 'metadata.requestId': dto.requestId },
      ],
    });
    if (!existingRecord) return false;

    if (existingRecord.status === ConsumptionStatus.PENDING) {
      throw new BadRequestException('请求正在处理中，请稍后查询结果');
    }
    if (existingRecord.status !== ConsumptionStatus.SUCCESS) return false;

    const existingResult = await this.resumeQuizResultModel.findOne({
      resultId: existingRecord.resultId,
      userId,
    });
    if (!existingResult) {
      throw new BadRequestException('已完成的请求缺少结果数据');
    }

    this.emitComplete(
      progressSubject,
      {
        resultId: existingResult.resultId,
        questions: existingResult.questions,
        summary: existingResult.summary,
        matchScore: existingResult.matchScore,
        matchLevel: existingResult.matchLevel,
        matchedSkills: existingResult.matchedSkills,
        missingSkills: existingResult.missingSkills,
        knowledgeGaps: existingResult.knowledgeGaps,
        learningPriorities: existingResult.learningPriorities,
        radarData: existingResult.radarData,
        strengths: existingResult.strengths,
        weaknesses: existingResult.weaknesses,
        interviewTips: existingResult.interviewTips,
        remainingCount: await this.getRemainingCount(userId, 'resume'),
        consumptionRecordId: existingRecord.recordId,
        isFromCache: true,
      },
      dto.locale,
    );
    return true;
  }

  private async createOrReuseConsumptionRecord(
    userId: string,
    dto: ResumeQuizDto,
    recordId: string,
    resultId: string,
  ): Promise<ConsumptionRecordDocument> {
    const inputData = {
      company: dto.company ?? '',
      positionName: dto.positionName,
      minSalary: dto.minSalary,
      maxSalary: dto.maxSalary,
      jd: dto.jd,
      resumeId: dto.resumeId,
      source: dto.resumeContent ? 'text' : dto.resumeURL ? 'url' : 'unknown',
    };

    if (dto.requestId) {
      const reusedRecord = await this.consumptionRecordModel.findOneAndUpdate(
        {
          userId,
          $or: [
            { requestId: dto.requestId },
            { 'metadata.requestId': dto.requestId },
          ],
          status: {
            $in: [ConsumptionStatus.FAILED, ConsumptionStatus.CANCELLED],
          },
        },
        {
          $set: {
            status: ConsumptionStatus.PENDING,
            inputData,
            resultId,
            requestId: dto.requestId,
            metadata: {
              requestId: dto.requestId,
              promptVersion: dto.promptVersion,
            },
            startedAt: new Date(),
            completedAt: undefined,
            failedAt: undefined,
            errorMessage: undefined,
            errorStack: undefined,
            isRefunded: false,
            refundedAt: undefined,
          },
        },
        { new: true },
      );
      if (reusedRecord) return reusedRecord;
    }

    try {
      return await this.consumptionRecordModel.create({
        recordId,
        user: new Types.ObjectId(userId),
        userId,
        type: ConsumptionType.RESUME_QUIZ,
        status: ConsumptionStatus.PENDING,
        consumedCount: 1,
        description:
          `简历押题 - ${dto.company ?? ''} ${dto.positionName}`.trim(),
        inputData,
        resultId,
        requestId: dto.requestId,
        metadata: {
          requestId: dto.requestId,
          promptVersion: dto.promptVersion,
        },
        startedAt: new Date(),
      });
    } catch (error) {
      if (this.isDuplicateKeyError(error)) {
        throw new BadRequestException('请求正在处理中，请稍后查询结果');
      }
      throw error;
    }
  }

  private async extractResumeContent(dto: ResumeQuizDto): Promise<string> {
    let content: string;

    if (dto.resumeContent?.trim()) {
      content = dto.resumeContent;
    } else if (dto.resumeURL) {
      content = await this.documentParserService.parseDocumentFromUrl(
        dto.resumeURL,
      );
    } else {
      throw new BadRequestException('请提供简历文件 URL 或简历文本内容');
    }

    const cleanedText = this.documentParserService.cleanText(content);
    const validation =
      this.documentParserService.validateResumeContent(cleanedText);
    if (!validation.isValid) {
      throw new BadRequestException(validation.reason);
    }
    if (validation.warnings?.length) {
      this.logger.warn(`简历解析警告: ${validation.warnings.join('; ')}`);
    }

    const estimatedTokens =
      this.documentParserService.estimateTokens(cleanedText);
    if (estimatedTokens <= 6_000) return cleanedText;

    const truncatedText = cleanedText.slice(0, 9_000);
    this.logger.warn(
      `简历内容过长，已从约 ${estimatedTokens} tokens 截断为约 ${this.documentParserService.estimateTokens(truncatedText)} tokens`,
    );
    return truncatedText;
  }

  private async saveQuizResult(
    userId: string,
    dto: ResumeQuizDto,
    resultId: string,
    consumptionRecordId: string,
    questionsResult: ResumeQuizQuestionsResult,
    analysisResult: ResumeQuizAnalysisResult,
    aiDuration: number,
  ): Promise<void> {
    await this.resumeQuizResultModel.create({
      resultId,
      user: new Types.ObjectId(userId),
      userId,
      resumeId: dto.resumeId,
      company: dto.company ?? '',
      position: dto.positionName,
      salaryRange: this.formatSalaryRange(dto.minSalary, dto.maxSalary),
      jobDescription: dto.jd,
      questions: questionsResult.questions,
      totalQuestions: questionsResult.questions.length,
      summary: questionsResult.summary,
      ...analysisResult,
      consumptionRecordId,
      aiModel: 'deepseek-chat',
      promptVersion: dto.promptVersion ?? 'v2',
      locale: dto.locale || 'zh-CN',
      metadata: { aiResponseTime: aiDuration },
    });
  }

  private async handleResumeQuizFailure(
    userId: string,
    consumptionRecord: ConsumptionRecordDocument | null,
    charged: boolean,
    error: unknown,
  ): Promise<void> {
    const message = this.getErrorMessage(error);
    this.logger.error(
      `❌ 简历押题生成失败: userId=${userId}, error=${message}`,
    );

    let refunded = false;
    if (charged) {
      try {
        await this.refundCount(userId, 'resume');
        refunded = true;
      } catch (refundError) {
        this.logger.error(
          `🚨 退款流程失败，需要人工介入: userId=${userId}, originalError=${message}, refundError=${this.getErrorMessage(refundError)}`,
        );
      }
    }

    if (consumptionRecord) {
      await this.consumptionRecordModel
        .findByIdAndUpdate(consumptionRecord._id, {
          $set: {
            status: ConsumptionStatus.FAILED,
            errorMessage: message,
            errorStack:
              process.env.NODE_ENV === 'development' && error instanceof Error
                ? error.stack
                : undefined,
            failedAt: new Date(),
            isRefunded: refunded,
            refundedAt: refunded ? new Date() : undefined,
          },
        })
        .catch((recordError: unknown) => {
          this.logger.error(
            `更新失败消费记录时出错: ${this.getErrorMessage(recordError)}`,
          );
        });
    }
  }

  private startSimulatedProgress(
    subject: Subject<ProgressEvent>,
    locale: 'zh-CN' | 'en-US' = 'zh-CN',
  ): () => void {
    const messages =
      locale === 'en-US'
        ? [
            'AI is analyzing your résumé in depth…',
            'AI is reviewing your technical stack and project experience…',
            'AI is designing role-specific interview questions…',
            'AI is preparing realistic follow-up scenarios…',
            'AI is refining questions and reference answers…',
          ]
        : [
            '🤖 AI 正在深度理解您的简历内容...',
            '📊 AI 正在分析您的技术栈和项目经验...',
            '🎯 AI 正在设计针对性的面试问题...',
            '🧠 AI 正在构思场景化的追问...',
            '✨ AI 正在优化问题和参考答案...',
          ];
    let index = 0;
    this.emitProgress(subject, 15, messages[0], 'generating');
    const timer = setInterval(() => {
      index += 1;
      this.emitProgress(
        subject,
        Math.min(15 + index * 5, 45),
        messages[index % messages.length],
        'generating',
      );
    }, 2_000);
    timer.unref();
    return () => clearInterval(timer);
  }

  private emitProgress(
    subject: Subject<ProgressEvent>,
    progress: number,
    label: string,
    stage?: ProgressEvent['stage'],
  ): void {
    if (subject.closed) return;
    subject.next({
      type: 'progress',
      progress: Math.min(Math.max(progress, 0), 100),
      label,
      message: label,
      stage,
    });
  }

  private emitComplete(
    subject: Subject<ProgressEvent>,
    data: unknown,
    locale: 'zh-CN' | 'en-US' = 'zh-CN',
  ): void {
    if (subject.closed) return;
    subject.next({
      type: 'complete',
      progress: 100,
      label: locale === 'en-US' ? 'Generation complete' : '🎉 生成完成！',
      message: locale === 'en-US' ? 'Generation complete' : '生成完成',
      stage: 'done',
      data,
    });
    subject.complete();
  }

  private emitError(
    subject: Subject<ProgressEvent>,
    error: unknown,
    locale: 'zh-CN' | 'en-US' = 'zh-CN',
  ): void {
    if (subject.closed) return;
    const message =
      error instanceof BadRequestException
        ? error.message
        : locale === 'en-US'
          ? 'Generation failed. Please try again later.'
          : '生成失败，请稍后重试';
    subject.next({
      type: 'error',
      progress: 0,
      label: locale === 'en-US' ? 'Generation failed' : '❌ 生成失败',
      message,
      error: message,
    });
    subject.complete();
  }

  private async refundCount(
    userId: string,
    type: 'resume' | 'special' | 'behavior',
  ): Promise<void> {
    const field =
      type === 'resume'
        ? 'resumeRemainingCount'
        : type === 'special'
          ? 'specialRemainingCount'
          : 'behaviorRemainingCount';
    const result = await this.userModel.findByIdAndUpdate(
      userId,
      { $inc: { [field]: 1 } },
      { new: true },
    );
    if (!result) throw new Error(`退款失败：用户不存在 userId=${userId}`);
  }

  private async getRemainingCount(
    userId: string,
    type: 'resume' | 'special' | 'behavior',
  ): Promise<number> {
    const user = await this.userModel.findById(userId);
    if (!user) return 0;
    if (type === 'resume') return user.resumeRemainingCount;
    if (type === 'special') return user.specialRemainingCount;
    return user.behaviorRemainingCount;
  }

  private formatSalaryRange(minSalary?: number, maxSalary?: number): string {
    if (minSalary !== undefined && maxSalary !== undefined) {
      return `${minSalary}K-${maxSalary}K`;
    }
    if (minSalary !== undefined) return `${minSalary}K起`;
    if (maxSalary !== undefined) return `${maxSalary}K封顶`;
    return '面议';
  }

  private isDuplicateKeyError(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: number }).code === 11000
    );
  }

  private getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }
}
