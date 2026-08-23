import { Injectable, Logger } from '@nestjs/common';
import { PromptTemplate } from '@langchain/core/prompts';
import { AIModelFactory } from '../../ai/services/ai-model.factory';
import { Message } from '../../ai/interfaces/message.interface';
import { CONVERSATION_CONTINUATION_PROMPT } from '../prompts/resume-analysis.prompts';

@Injectable()
export class ConversationContinuationService {
  private readonly logger = new Logger(ConversationContinuationService.name);

  constructor(private aiModelFactory: AIModelFactory) {}

  async continue(history: Message[]): Promise<string> {
    const prompt = PromptTemplate.fromTemplate(
      CONVERSATION_CONTINUATION_PROMPT,
    );

    const model = this.aiModelFactory.createDefaultModel();

    const chain = prompt.pipe(model);

    try {
      this.logger.log(`继续对话，历史消息数: ${history.length}`);

      const response = await chain.invoke({
        history: history.map((m) => `${m.role}: ${m.content}`).join('\n\n'),
      });

      const aiResponse = response.content as string;

      this.logger.log('对话继续完成');
      return aiResponse;
    } catch (error) {
      this.logger.error('继续对话失败:', error);
      throw error;
    }
  }
}
