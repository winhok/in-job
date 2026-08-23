import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
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
      ),
      timestamp: new Date(),
    });
    await this.saveMockInterviewResult(session);
    this.interviewSessions.delete(session.sessionId);
    this.sessionsProcessingAnswer.delete(session.sessionId);
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

      const resumeContent = this.extractMockResumeContent(dto);
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
        const closingStatement = `感谢你今天的面试表现。由于时间关系（已进行${elapsedMinutes}分钟），我们今天的面试就到这里。后续我们会进行综合评估，有结果会及时通知你。祝你生活愉快！`;
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

  private extractMockResumeContent(dto: StartMockInterviewDto): string {
    if (!dto.resumeContent?.trim()) {
      if (dto.resumeId) {
        throw new BadRequestException(
          '当前后端尚未接入简历ID内容查询，请改用简历文本开始面试',
        );
      }
      throw new BadRequestException('请提供简历文本内容');
    }
    const cleanedText = this.documentParserService.cleanText(dto.resumeContent);
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
    });
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
