import { Injectable, Logger } from '@nestjs/common';
import { PromptTemplate } from '@langchain/core/prompts';
import { JsonOutputParser } from '@langchain/core/output_parsers';
import { AIModelFactory } from '../../ai/services/ai-model.factory';
import { RESUME_ANALYSIS_PROMPT } from '../prompts/resume-analysis.prompts';

@Injectable()
export class ResumeAnalysisService {
  private readonly logger = new Logger(ResumeAnalysisService.name);

  constructor(private aiModelFactory: AIModelFactory) {}

  async analyze(
    resumeContent: string,
    jobDescription: string,
  ): Promise<Record<string, unknown>> {
    const prompt = PromptTemplate.fromTemplate(RESUME_ANALYSIS_PROMPT);

    const model = this.aiModelFactory.createDefaultModel();

    const parser = new JsonOutputParser<Record<string, unknown>>();

    const chain = prompt.pipe(model).pipe(parser);

    try {
      this.logger.log('开始分析简历...');

      const result = await chain.invoke({
        resume_content: resumeContent,
        job_description: jobDescription,
      });

      this.logger.log('简历分析完成');
      return result;
    } catch (error) {
      this.logger.error('简历分析失败:', error);
      throw error;
    }
  }
}
