import { Injectable, Logger } from '@nestjs/common';
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

  constructor(private readonly aiModelFactory: AIModelFactory) {}

  generateOpeningStatement(
    interviewerName: string,
    candidateName?: string,
    positionName?: string,
  ): string {
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
  ): AsyncGenerator<string, string, undefined> {
    const fullGreeting = this.generateOpeningStatement(
      interviewerName,
      candidateName,
      positionName,
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
        company: context.company || '未提供',
        positionName: context.positionName || '未提供',
        jd: context.jd || '未提供',
        conversationHistory: this.formatConversationHistory(
          context.conversationHistory,
        ),
        elapsedMinutes: context.elapsedMinutes,
        targetDuration: context.targetDuration,
      });

      let fullContent = '';
      for await (const chunk of stream) {
        const content = this.extractChunkText(chunk.content);
        if (!content) continue;
        fullContent += content;
        yield content;
      }

      this.logger.log(
        `✅ 模拟面试问题流式生成完成: 耗时=${Date.now() - startedAt}ms, 长度=${fullContent.length}`,
      );
      return this.parseInterviewResponse(fullContent, context);
    } catch (error) {
      this.logger.error(
        `❌ 模拟面试问题生成失败: ${this.getErrorMessage(error)}`,
      );
      throw error;
    }
  }

  generateClosingStatement(
    interviewerName: string,
    candidateName?: string,
  ): string {
    const name = candidateName?.trim() || '候选人';
    return (
      `好的${name}，今天的面试就到这里。\n\n` +
      '感谢你的时间和精彩的回答。整体来看，你的表现不错。\n\n' +
      '我们会将你的面试情况反馈给用人部门，预计3-5个工作日内会给你答复。\n\n' +
      '如果有任何问题，可以随时联系HR。祝你一切顺利！\n\n' +
      `— ${interviewerName}老师`
    );
  }

  async generateResumeQuizQuestionsOnly(
    input: ResumeQuizInput,
  ): Promise<ResumeQuizQuestionsResult> {
    const startedAt = Date.now();

    try {
      const prompt = PromptTemplate.fromTemplate(
        RESUME_QUIZ_PROMPT_QUESTIONS_ONLY,
      );
      const parser = new JsonOutputParser<Record<string, unknown>>();
      const chain = prompt
        .pipe(this.aiModelFactory.createCreativeModel())
        .pipe(parser);
      const result = await chain.invoke({
        ...this.buildPromptParams(input),
        format_instructions: FORMAT_INSTRUCTIONS_QUESTIONS_ONLY,
      });

      this.assertQuestionsResult(result);
      this.logger.log(
        `✅ [押题部分] 生成成功: 耗时=${Date.now() - startedAt}ms, 问题数=${result.questions.length}`,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `❌ [押题部分] 生成失败: 耗时=${Date.now() - startedAt}ms, 错误=${this.getErrorMessage(error)}`,
      );
      throw error;
    }
  }

  async generateResumeQuizAnalysisOnly(
    input: ResumeQuizInput,
  ): Promise<ResumeQuizAnalysisResult> {
    const startedAt = Date.now();

    try {
      const prompt = PromptTemplate.fromTemplate(
        RESUME_QUIZ_PROMPT_ANALYSIS_ONLY,
      );
      const parser = new JsonOutputParser<Record<string, unknown>>();
      const chain = prompt
        .pipe(this.aiModelFactory.createStableModel())
        .pipe(parser);
      const result = await chain.invoke({
        ...this.buildPromptParams(input),
        format_instructions: FORMAT_INSTRUCTIONS_ANALYSIS_ONLY,
      });

      this.assertAnalysisResult(result);
      this.logger.log(
        `✅ [匹配度分析] 生成成功: 耗时=${Date.now() - startedAt}ms`,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `❌ [匹配度分析] 生成失败: 耗时=${Date.now() - startedAt}ms, 错误=${this.getErrorMessage(error)}`,
      );
      throw error;
    }
  }

  /** 基于面试问答生成结构化评估报告。 */
  async generateInterviewAssessmentReport(
    context: InterviewAssessmentContext,
  ): Promise<InterviewAssessmentResult> {
    const startedAt = Date.now();
    try {
      const prompt = PromptTemplate.fromTemplate(
        buildAssessmentPrompt(context),
      );
      const parser = new JsonOutputParser<Record<string, unknown>>();
      const chain = prompt
        .pipe(this.aiModelFactory.createDefaultModel())
        .pipe(parser);
      const result = await chain.invoke({
        interviewType: context.interviewType,
        company: context.company || '未提供',
        positionName: context.positionName || '未提供',
        jd: context.jd || '未提供',
        resumeContent: context.resumeContent || '未提供',
        qaList: context.qaList
          .map(
            (qa, index) =>
              `问题${index + 1}: ${qa.question}\n用户回答: ${qa.answer}\n回答长度: ${qa.answer.length}字\n标准答案: ${qa.standardAnswer || '无'}`,
          )
          .join('\n\n'),
        qualityMetrics: context.answerQualityMetrics
          ? `\n## 回答质量统计\n- 总问题数: ${context.answerQualityMetrics.totalQuestions}\n- 平均回答长度: ${context.answerQualityMetrics.avgAnswerLength}字\n- 无效回答数: ${context.answerQualityMetrics.emptyAnswersCount}`
          : '',
      });

      this.assertAssessmentResult(result);
      this.logger.log(
        `✅ 评估报告生成完成: 耗时=${Date.now() - startedAt}ms, overallScore=${result.overallScore}`,
      );
      return result;
    } catch (error) {
      this.logger.error(`❌ 生成评估报告失败: ${this.getErrorMessage(error)}`);
      throw error;
    }
  }

  private buildPromptParams(input: ResumeQuizInput): ResumeQuizPromptParams {
    return {
      company: input.company || '未提供',
      positionName: input.positionName,
      salaryRange: this.formatSalaryRange(input.minSalary, input.maxSalary),
      jd: input.jd,
      resumeContent: input.resumeContent,
    };
  }

  private formatConversationHistory(
    history: Array<{
      role: 'interviewer' | 'candidate';
      content: string;
    }>,
  ): string {
    if (!history.length) return '（对话刚开始）';
    return history
      .map((item, index) => {
        const role = item.role === 'interviewer' ? '面试官' : '候选人';
        return `${index + 1}. ${role}: ${item.content}`;
      })
      .join('\n\n');
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
