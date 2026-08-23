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

/**
 * 面试 AI 服务
 * 封装 LangChain + DeepSeek 的调用
 */
@Injectable()
export class InterviewAIService {
  private readonly logger = new Logger(InterviewAIService.name);

  constructor(private readonly aiModelFactory: AIModelFactory) {}

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

  private buildPromptParams(input: ResumeQuizInput): ResumeQuizPromptParams {
    return {
      company: input.company || '未提供',
      positionName: input.positionName,
      salaryRange: this.formatSalaryRange(input.minSalary, input.maxSalary),
      jd: input.jd,
      resumeContent: input.resumeContent,
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

  private getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }
}
