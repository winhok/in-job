import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { randomUUID } from 'node:crypto';
import { ReplaySubject, Subject } from 'rxjs';
import { SessionManager } from '../../ai/services/session.manager';
import { User, UserDocument } from '../../user/schemas/user.schema';
import { ResumeQuizDto } from '../dto/resume-quiz.dto';
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
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
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
    sessionId: string,
    userQuestion: string,
  ): Promise<string> {
    try {
      this.sessionManager.addMessage(sessionId, 'user', userQuestion);
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

  generateResumeQuizWithProgress(
    userId: string,
    dto: ResumeQuizDto,
  ): Subject<ProgressEvent> {
    const subject = new ReplaySubject<ProgressEvent>(1);
    void this.executeResumeQuiz(userId, dto, subject);
    return subject;
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

    try {
      if (!Types.ObjectId.isValid(userId)) {
        throw new BadRequestException('用户信息无效，请重新登录');
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
        throw new BadRequestException('简历押题次数不足，请前往充值页面购买');
      }
      charged = true;
      this.logger.log(
        `✅ 用户扣费成功: userId=${userId}, 扣费前=${user.resumeRemainingCount}, 扣费后=${user.resumeRemainingCount - 1}`,
      );

      this.emitProgress(
        progressSubject,
        0,
        '📄 正在读取简历文档...',
        'prepare',
      );
      const resumeContent = await this.extractResumeContent(dto);
      this.emitProgress(progressSubject, 5, '✅ 简历解析完成', 'prepare');
      this.emitProgress(
        progressSubject,
        10,
        '🚀 准备就绪，即将开始 AI 生成...',
        'prepare',
      );

      const aiStartedAt = Date.now();
      stopSimulatedProgress = this.startSimulatedProgress(progressSubject);
      const questionsResult =
        await this.aiService.generateResumeQuizQuestionsOnly({
          company: dto.company ?? '',
          positionName: dto.positionName,
          minSalary: dto.minSalary,
          maxSalary: dto.maxSalary,
          jd: dto.jd,
          resumeContent,
          promptVersion: dto.promptVersion,
        });
      stopSimulatedProgress();
      stopSimulatedProgress = undefined;

      this.emitProgress(
        progressSubject,
        50,
        '✅ 面试问题生成完成，开始分析匹配度...',
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
        });
      const aiDuration = Date.now() - aiStartedAt;

      this.emitProgress(
        progressSubject,
        90,
        '💾 正在保存生成结果...',
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

      this.emitComplete(progressSubject, {
        resultId,
        ...questionsResult,
        ...analysisResult,
        remainingCount: await this.getRemainingCount(userId, 'resume'),
        consumptionRecordId: consumptionRecord.recordId,
        isFromCache: false,
      });
    } catch (error) {
      stopSimulatedProgress?.();
      await this.handleResumeQuizFailure(
        userId,
        consumptionRecord,
        charged,
        error,
      );
      this.emitError(progressSubject, error);
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

    this.emitComplete(progressSubject, {
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
    });
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

  private startSimulatedProgress(subject: Subject<ProgressEvent>): () => void {
    const messages = [
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

  private emitComplete(subject: Subject<ProgressEvent>, data: unknown): void {
    if (subject.closed) return;
    subject.next({
      type: 'complete',
      progress: 100,
      label: '🎉 生成完成！',
      message: '生成完成',
      stage: 'done',
      data,
    });
    subject.complete();
  }

  private emitError(subject: Subject<ProgressEvent>, error: unknown): void {
    if (subject.closed) return;
    const message =
      error instanceof BadRequestException
        ? error.message
        : '生成失败，请稍后重试';
    subject.next({
      type: 'error',
      progress: 0,
      label: '❌ 生成失败',
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
