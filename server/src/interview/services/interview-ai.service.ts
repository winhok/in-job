import { Injectable, Logger, Optional } from '@nestjs/common';
import { JsonOutputParser } from '@langchain/core/output_parsers';
import { PromptTemplate } from '@langchain/core/prompts';
import { AIModelFactory } from '../../ai/services/ai-model.factory';
import {
  FORMAT_INSTRUCTIONS_ANALYSIS_ONLY,
  FORMAT_INSTRUCTIONS_QUESTIONS_ONLY,
} from '../prompts/format-instructions.prompts';
import {
  RESUME_QUIZ_PROMPT_ANALYSIS_ONLY,
  RESUME_QUIZ_PROMPT_QUESTIONS_ONLY,
} from '../prompts/resume-quiz.prompts';
import {
  buildAssessmentPrompt,
  buildMockInterviewPrompt,
} from '../prompts/mock-interview.prompts';
import {
  QuestionCategory,
  QuestionDifficulty,
} from '../schemas/interview-quiz-result.schema';
import { MetricsService } from '../../common/metrics/metrics.service';
import { LogAiCall } from '../../common/decorators/log-ai-call.decorator';
import { ConfigService } from '@nestjs/config';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { AiCacheService } from '../../ai-cache/ai-cache.service';

interface ResumeQuizPromptParams {
  company: string;
  positionName: string;
  salaryRange: string;
  jd: string;
  resumeContent: string;
}

export interface ResumeQuizInput {
  company: string;
  positionName: string;
  minSalary?: number;
  maxSalary?: number;
  jd: string;
  resumeContent: string;
  promptVersion?: string;
  cacheScope?: string;
  locale?: 'zh-CN' | 'en-US';
}

export interface ResumeQuizQuestion {
  question: string;
  answer: string;
  category: QuestionCategory;
  difficulty: QuestionDifficulty;
  tips: string;
  keywords?: string[];
  reasoning?: string;
}

export interface ResumeQuizQuestionsResult {
  questions: ResumeQuizQuestion[];
  summary: string;
}

export interface ResumeQuizAnalysisResult {
  matchScore: number;
  matchLevel: string;
  matchedSkills: Array<{
    skill: string;
    matched: boolean;
    proficiency?: string;
  }>;
  missingSkills: string[];
  knowledgeGaps: string[];
  learningPriorities: Array<{
    topic: string;
    priority: 'high' | 'medium' | 'low';
    reason: string;
  }>;
  radarData: Array<{
    dimension: string;
    score: number;
    description?: string;
  }>;
  strengths: string[];
  weaknesses: string[];
  interviewTips: string[];
}

export interface MockInterviewQuestionContext {
  interviewType: 'special' | 'comprehensive';
  resumeContent: string;
  company?: string;
  positionName?: string;
  jd?: string;
  conversationHistory: Array<{
    role: 'interviewer' | 'candidate';
    content: string;
  }>;
  elapsedMinutes: number;
  targetDuration: number;
  retrievedContext?: string[];
  locale?: 'zh-CN' | 'en-US';
}

export interface MockInterviewQuestionResult {
  question: string;
  shouldEnd: boolean;
  standardAnswer?: string;
  reasoning?: string;
}

export interface InterviewAssessmentContext {
  interviewType: 'special' | 'comprehensive';
  company: string;
  positionName: string;
  jd: string;
  resumeContent: string;
  qaList: Array<{
    question: string;
    answer: string;
    standardAnswer?: string;
  }>;
  answerQualityMetrics?: {
    totalQuestions: number;
    avgAnswerLength: number;
    emptyAnswersCount: number;
  };
  cacheScope?: string;
  locale?: 'zh-CN' | 'en-US';
  promptVersion?: string;
}

export interface InterviewAssessmentResult {
  overallScore: number;
  overallLevel: string;
  overallComment: string;
  radarData: Array<{
    dimension: string;
    score: number;
    description?: string;
  }>;
  strengths: string[];
  weaknesses: string[];
  improvements: Array<{
    category: string;
    suggestion: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  fluencyScore: number;
  logicScore: number;
  professionalScore: number;
}

/**
 * 面试 AI 服务
 * 封装 LangChain + DeepSeek 的调用
 */
@Injectable()
export class InterviewAIService {
  private readonly logger = new Logger(InterviewAIService.name);

  constructor(
    private readonly aiModelFactory: AIModelFactory,
    @Optional() private readonly metrics?: MetricsService,
    @Optional() private readonly configService?: ConfigService,
    @Optional() private readonly cache?: AiCacheService,
  ) {}

  generateOpeningStatement(
    interviewerName: string,
    candidateName?: string,
    positionName?: string,
    locale: 'zh-CN' | 'en-US' = 'zh-CN',
  ): string {
    if (locale === 'en-US') {
      const candidate = candidateName?.trim() || 'there';
      const role = positionName?.trim()
        ? ` I see that you are applying for the ${positionName.trim()} role.`
        : '';
      return `Hello ${candidate}, I’m your interviewer today. You can call me ${interviewerName}.${role}\n\nLet’s begin. First, please introduce yourself, including your education, professional background, and the results you are most proud of.`;
    }
    let greeting = `${candidateName?.trim() || '你'}好，我是你今天的面试官，你可以叫我${interviewerName}老师。\n\n`;
    if (positionName?.trim()) {
      greeting += `我看到你申请的是${positionName.trim()}岗位。\n\n`;
    }
    greeting +=
      '让我们开始今天的面试吧。\n\n首先，请你简单介绍一下自己。自我介绍可以说明你的学历以及专业背景、工作经历以及取得的成绩等。';
    return greeting;
  }

  async *generateOpeningStatementStream(
    interviewerName: string,
    candidateName?: string,
    positionName?: string,
    locale: 'zh-CN' | 'en-US' = 'zh-CN',
  ): AsyncGenerator<string, string, undefined> {
    const fullGreeting = this.generateOpeningStatement(
      interviewerName,
      candidateName,
      positionName,
      locale,
    );
    const chunkSize = 5;
    for (let index = 0; index < fullGreeting.length; index += chunkSize) {
      yield fullGreeting.slice(index, index + chunkSize);
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
    return fullGreeting;
  }

  async *generateInterviewQuestionStream(
    context: MockInterviewQuestionContext,
  ): AsyncGenerator<string, MockInterviewQuestionResult, undefined> {
    const startedAt = Date.now();
    try {
      const promptTemplate = PromptTemplate.fromTemplate(
        buildMockInterviewPrompt(context),
      );
      const chain = promptTemplate.pipe(
        this.aiModelFactory.createDefaultModel(),
      );
      const stream = await chain.stream({
        interviewType: context.interviewType,
        resumeContent: context.resumeContent,
        company: context.company || this.notProvided(context.locale),
        positionName: context.positionName || this.notProvided(context.locale),
        jd: context.jd || this.notProvided(context.locale),
        conversationHistory: this.formatConversationHistory(
          context.conversationHistory,
          context.locale,
        ),
        elapsedMinutes: context.elapsedMinutes,
        targetDuration: context.targetDuration,
        retrievedContext:
          context.retrievedContext?.join('\n\n') ||
          (context.locale === 'en-US'
            ? '(No supplemental context is available.)'
            : '（没有可用的补充资料）'),
      });

      let fullContent = '';
      for await (const chunk of stream) {
        this.captureAiUsage(chunk);
        const content = this.extractChunkText(chunk.content);
        if (!content) continue;
        fullContent += content;
        yield content;
      }

      this.logger.log(
        `✅ 模拟面试问题流式生成完成: 耗时=${Date.now() - startedAt}ms, 长度=${fullContent.length}`,
      );
      this.observeAi('mock_question', 'success', startedAt);
      return this.parseInterviewResponse(fullContent, context);
    } catch (error) {
      this.observeAi('mock_question', 'error', startedAt);
      this.logger.error(
        `❌ 模拟面试问题生成失败: ${this.getErrorMessage(error)}`,
      );
      throw error;
    }
  }

  generateClosingStatement(
    interviewerName: string,
    candidateName?: string,
    locale: 'zh-CN' | 'en-US' = 'zh-CN',
  ): string {
    if (locale === 'en-US') {
      const name = candidateName?.trim() || 'Candidate';
      return `Thank you, ${name}. That concludes today’s interview.\n\nWe appreciate your time and thoughtful answers. We’ll share our assessment with the hiring team, and you can expect an update within three to five business days.\n\nIf you have any questions, please contact HR. Best of luck!\n\n— ${interviewerName}`;
    }
    const name = candidateName?.trim() || '候选人';
    return (
      `好的${name}，今天的面试就到这里。\n\n` +
      '感谢你的时间和精彩的回答。整体来看，你的表现不错。\n\n' +
      '我们会将你的面试情况反馈给用人部门，预计3-5个工作日内会给你答复。\n\n' +
      '如果有任何问题，可以随时联系HR。祝你一切顺利！\n\n' +
      `— ${interviewerName}老师`
    );
  }

  @LogAiCall('resume_questions')
  async generateResumeQuizQuestionsOnly(
    input: ResumeQuizInput,
  ): Promise<ResumeQuizQuestionsResult> {
    const startedAt = Date.now();

    try {
      const prompt = PromptTemplate.fromTemplate(
        this.withOutputLanguage(
          RESUME_QUIZ_PROMPT_QUESTIONS_ONLY,
          input.locale,
        ),
      );
      const compute = () =>
        this.invokeJson(prompt, this.aiModelFactory.createCreativeModel(), {
          ...this.buildPromptParams(input),
          format_instructions: FORMAT_INSTRUCTIONS_QUESTIONS_ONLY,
        });
      const result = await this.cachedJson(
        'resume_questions',
        input.cacheScope,
        input.locale,
        input.promptVersion,
        input,
        compute,
      );

      this.assertQuestionsResult(result);
      this.logger.log(
        `✅ [押题部分] 生成成功: 耗时=${Date.now() - startedAt}ms, 问题数=${result.questions.length}`,
      );
      this.observeAi('resume_questions', 'success', startedAt);
      return result;
    } catch (error) {
      this.observeAi('resume_questions', 'error', startedAt);
      this.logger.error(
        `❌ [押题部分] 生成失败: 耗时=${Date.now() - startedAt}ms, 错误=${this.getErrorMessage(error)}`,
      );
      throw error;
    }
  }

  @LogAiCall('resume_analysis')
  async generateResumeQuizAnalysisOnly(
    input: ResumeQuizInput,
  ): Promise<ResumeQuizAnalysisResult> {
    const startedAt = Date.now();

    try {
      const prompt = PromptTemplate.fromTemplate(
        this.withOutputLanguage(RESUME_QUIZ_PROMPT_ANALYSIS_ONLY, input.locale),
      );
      const compute = () =>
        this.invokeJson(prompt, this.aiModelFactory.createStableModel(), {
          ...this.buildPromptParams(input),
          format_instructions: FORMAT_INSTRUCTIONS_ANALYSIS_ONLY,
        });
      const result = await this.cachedJson(
        'resume_analysis',
        input.cacheScope,
        input.locale,
        input.promptVersion,
        input,
        compute,
      );

      this.assertAnalysisResult(result);
      this.logger.log(
        `✅ [匹配度分析] 生成成功: 耗时=${Date.now() - startedAt}ms`,
      );
      this.observeAi('resume_analysis', 'success', startedAt);
      return result;
    } catch (error) {
      this.observeAi('resume_analysis', 'error', startedAt);
      this.logger.error(
        `❌ [匹配度分析] 生成失败: 耗时=${Date.now() - startedAt}ms, 错误=${this.getErrorMessage(error)}`,
      );
      throw error;
    }
  }

  /** 基于面试问答生成结构化评估报告。 */
  @LogAiCall('assessment')
  async generateInterviewAssessmentReport(
    context: InterviewAssessmentContext,
  ): Promise<InterviewAssessmentResult> {
    const startedAt = Date.now();
    try {
      const prompt = PromptTemplate.fromTemplate(
        buildAssessmentPrompt(context),
      );
      const values = {
        interviewType: context.interviewType,
        company: context.company || this.notProvided(context.locale),
        positionName: context.positionName || this.notProvided(context.locale),
        jd: context.jd || this.notProvided(context.locale),
        resumeContent:
          context.resumeContent || this.notProvided(context.locale),
        qaList: context.qaList
          .map(
            (qa, index) =>
              `问题${index + 1}: ${qa.question}\n用户回答: ${qa.answer}\n回答长度: ${qa.answer.length}字\n标准答案: ${qa.standardAnswer || '无'}`,
          )
          .join('\n\n'),
        qualityMetrics: context.answerQualityMetrics
          ? `\n## 回答质量统计\n- 总问题数: ${context.answerQualityMetrics.totalQuestions}\n- 平均回答长度: ${context.answerQualityMetrics.avgAnswerLength}字\n- 无效回答数: ${context.answerQualityMetrics.emptyAnswersCount}`
          : '',
      };
      const compute = () =>
        this.invokeJson(
          prompt,
          this.aiModelFactory.createDefaultModel(),
          values,
        );
      const result = await this.cachedJson(
        'assessment',
        context.cacheScope,
        context.locale,
        context.promptVersion,
        values,
        compute,
      );

      this.assertAssessmentResult(result);
      this.logger.log(
        `✅ 评估报告生成完成: 耗时=${Date.now() - startedAt}ms, overallScore=${result.overallScore}`,
      );
      this.observeAi('assessment', 'success', startedAt);
      return result;
    } catch (error) {
      this.observeAi('assessment', 'error', startedAt);
      this.logger.error(`❌ 生成评估报告失败: ${this.getErrorMessage(error)}`);
      throw error;
    }
  }

  private buildPromptParams(input: ResumeQuizInput): ResumeQuizPromptParams {
    return {
      company: input.company || this.notProvided(input.locale),
      positionName: input.positionName,
      salaryRange: this.formatSalaryRange(input.minSalary, input.maxSalary),
      jd: input.jd,
      resumeContent: input.resumeContent,
    };
  }

  private observeAi(
    operation: string,
    result: 'success' | 'error',
    startedAt: number,
  ): void {
    this.metrics?.observeAi(
      operation,
      this.modelLabel(),
      result,
      (Date.now() - startedAt) / 1000,
    );
  }

  private async invokeJson(
    prompt: PromptTemplate,
    model: BaseChatModel,
    values: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const formattedPrompt = await prompt.format(values);
    const response: unknown = await model.invoke(formattedPrompt);
    this.captureAiUsage(response);
    const content =
      response && typeof response === 'object' && 'content' in response
        ? response.content
        : response;
    return new JsonOutputParser<Record<string, unknown>>().parse(
      this.extractChunkText(content),
    );
  }

  private captureAiUsage(value: unknown): void {
    if (!value || typeof value !== 'object' || !('usage_metadata' in value))
      return;
    const usage = (value as { usage_metadata?: unknown }).usage_metadata;
    if (!usage || typeof usage !== 'object') return;
    const record = usage as Record<string, unknown>;
    const input =
      typeof record.input_tokens === 'number' ? record.input_tokens : 0;
    const output =
      typeof record.output_tokens === 'number' ? record.output_tokens : 0;
    this.metrics?.observeAiUsage(this.modelLabel(), input, output);
  }

  private modelLabel(): string {
    return this.configService?.get<string>('AI_PROVIDER') || 'deepseek';
  }

  private modelName(): string {
    return this.modelLabel() === 'openai'
      ? this.configService?.get<string>('OPENAI_MODEL') || 'gpt-4.1-mini'
      : this.configService?.get<string>('DEEPSEEK_MODEL') || 'deepseek-chat';
  }

  private cachedJson(
    operation: string,
    scopeKey: string | undefined,
    locale: 'zh-CN' | 'en-US' | undefined,
    promptVersion: string | undefined,
    input: unknown,
    compute: () => Promise<Record<string, unknown>>,
  ): Promise<Record<string, unknown>> {
    if (!this.cache || !scopeKey) return compute();
    return this.cache.getOrCompute(
      {
        operation,
        scopeKey,
        provider: this.modelLabel(),
        model: this.modelName(),
        locale: locale || 'zh-CN',
        promptVersion: promptVersion || 'v1',
        input,
      },
      compute,
    );
  }

  private formatConversationHistory(
    history: Array<{
      role: 'interviewer' | 'candidate';
      content: string;
    }>,
    locale: 'zh-CN' | 'en-US' = 'zh-CN',
  ): string {
    if (!history.length)
      return locale === 'en-US'
        ? '(The conversation has just started.)'
        : '（对话刚开始）';
    return history
      .map((item, index) => {
        const role =
          locale === 'en-US'
            ? item.role === 'interviewer'
              ? 'Interviewer'
              : 'Candidate'
            : item.role === 'interviewer'
              ? '面试官'
              : '候选人';
        return `${index + 1}. ${role}: ${item.content}`;
      })
      .join('\n\n');
  }

  private notProvided(locale: 'zh-CN' | 'en-US' | undefined): string {
    return locale === 'en-US' ? 'Not provided' : '未提供';
  }

  private withOutputLanguage(
    prompt: string,
    locale: 'zh-CN' | 'en-US' | undefined,
  ): string {
    return `${prompt}\n\n# 输出语言\n${
      locale === 'en-US'
        ? 'Write every human-readable JSON value in natural professional English. Keep JSON keys and enum values unchanged.'
        : '所有面向用户的 JSON 文本值必须使用自然、专业的简体中文。JSON 键名和枚举值保持不变。'
    }`;
  }

  private extractChunkText(content: unknown): string {
    if (typeof content === 'string') return content;
    if (!Array.isArray(content)) return '';
    const blocks: unknown[] = content;
    return blocks
      .map((block) => {
        if (typeof block === 'string') return block;
        if (block && typeof block === 'object') {
          const candidate = block as Record<string, unknown>;
          if (typeof candidate.text === 'string') return candidate.text;
        }
        return '';
      })
      .join('');
  }

  private parseInterviewResponse(
    content: string,
    context: Pick<
      MockInterviewQuestionContext,
      'elapsedMinutes' | 'targetDuration'
    >,
  ): MockInterviewQuestionResult {
    const shouldEnd = content.includes('[END_INTERVIEW]');
    const standardAnswerMatch = content.match(
      /\[STANDARD_ANSWER\]([\s\S]*?)(?=\[END_INTERVIEW\]|$)/,
    );
    const standardAnswer = standardAnswerMatch?.[1].trim() || undefined;
    const question = content
      .split('[STANDARD_ANSWER]')[0]
      .replace(/\[END_INTERVIEW\]/g, '')
      .trim();

    if (!question) throw new Error('AI返回的面试问题为空');
    return {
      question,
      shouldEnd,
      standardAnswer,
      reasoning: shouldEnd
        ? `面试已达到目标时长（${context.elapsedMinutes}/${context.targetDuration}分钟）`
        : undefined,
    };
  }

  private formatSalaryRange(minSalary?: number, maxSalary?: number): string {
    if (minSalary !== undefined && maxSalary !== undefined) {
      return `${minSalary}K-${maxSalary}K`;
    }
    if (minSalary !== undefined) return `${minSalary}K起`;
    if (maxSalary !== undefined) return `${maxSalary}K封顶`;
    return '面议';
  }

  private assertQuestionsResult(
    result: Record<string, unknown>,
  ): asserts result is Record<string, unknown> & ResumeQuizQuestionsResult {
    if (!Array.isArray(result.questions) || result.questions.length < 3) {
      throw new Error('AI返回的面试问题数量不足');
    }
    if (typeof result.summary !== 'string' || !result.summary.trim()) {
      throw new Error('AI返回的综合评估为空');
    }

    for (const question of result.questions) {
      const candidate = question as Record<string, unknown>;
      if (
        !question ||
        typeof question !== 'object' ||
        !['question', 'answer', 'category', 'difficulty', 'tips'].every(
          (field) => typeof candidate[field] === 'string',
        ) ||
        !Object.values(QuestionCategory).includes(
          candidate.category as QuestionCategory,
        ) ||
        !Object.values(QuestionDifficulty).includes(
          candidate.difficulty as QuestionDifficulty,
        )
      ) {
        throw new Error('AI返回的面试问题格式不完整');
      }
    }
  }

  private assertAnalysisResult(
    result: Record<string, unknown>,
  ): asserts result is Record<string, unknown> & ResumeQuizAnalysisResult {
    if (
      typeof result.matchScore !== 'number' ||
      result.matchScore < 0 ||
      result.matchScore > 100 ||
      typeof result.matchLevel !== 'string'
    ) {
      throw new Error('AI返回的匹配度格式不正确');
    }

    const arrayFields = [
      'matchedSkills',
      'missingSkills',
      'knowledgeGaps',
      'learningPriorities',
      'radarData',
      'strengths',
      'weaknesses',
      'interviewTips',
    ];
    if (arrayFields.some((field) => !Array.isArray(result[field]))) {
      throw new Error('AI返回的匹配度分析字段不完整');
    }
  }

  private assertAssessmentResult(
    result: Record<string, unknown>,
  ): asserts result is Record<string, unknown> & InterviewAssessmentResult {
    const scoreFields = [
      'overallScore',
      'fluencyScore',
      'logicScore',
      'professionalScore',
    ];
    if (
      scoreFields.some((field) => {
        const score = result[field];
        return typeof score !== 'number' || score < 0 || score > 100;
      }) ||
      typeof result.overallLevel !== 'string' ||
      typeof result.overallComment !== 'string'
    ) {
      throw new Error('AI返回的评估分数或综合评价格式不正确');
    }

    if (
      !Array.isArray(result.radarData) ||
      !Array.isArray(result.strengths) ||
      !Array.isArray(result.weaknesses) ||
      !Array.isArray(result.improvements)
    ) {
      throw new Error('AI返回的评估报告字段不完整');
    }

    const radarData = result.radarData as Array<Record<string, unknown>>;
    if (
      radarData.some(
        (item) =>
          !item ||
          typeof item.dimension !== 'string' ||
          typeof item.score !== 'number' ||
          item.score < 0 ||
          item.score > 100 ||
          (item.description !== undefined &&
            typeof item.description !== 'string'),
      )
    ) {
      throw new Error('AI返回的雷达图数据格式不正确');
    }

    const improvements = result.improvements as Array<Record<string, unknown>>;
    if (
      improvements.some(
        (item) =>
          !item ||
          typeof item.category !== 'string' ||
          typeof item.suggestion !== 'string' ||
          !['high', 'medium', 'low'].includes(String(item.priority)),
      )
    ) {
      throw new Error('AI返回的改进建议格式不正确');
    }
  }

  private getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }
}
