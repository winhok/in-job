import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatDeepSeek } from '@langchain/deepseek';
import { ChatOpenAI } from '@langchain/openai';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
@Injectable()
export class AIModelFactory {
  private readonly logger = new Logger(AIModelFactory.name);

  constructor(private configService: ConfigService) {}
  createDefaultModel(): BaseChatModel {
    return this.createConfiguredModel(
      Number(this.configService.get<string>('AI_TEMPERATURE')) || 0.7,
    );
  }

  createStableModel(): BaseChatModel {
    return this.createConfiguredModel(0.3);
  }

  createCreativeModel(): BaseChatModel {
    return this.createConfiguredModel(0.8);
  }

  private createConfiguredModel(temperature: number): BaseChatModel {
    const provider =
      this.configService.get<string>('AI_PROVIDER') || 'deepseek';
    const maxRetries = Math.max(
      0,
      Number(this.configService.get<string>('AI_MAX_RETRIES')) || 2,
    );
    const timeout = Math.max(
      5_000,
      Number(this.configService.get<string>('AI_TIMEOUT_MS')) || 60_000,
    );
    const maxTokens =
      Number(this.configService.get<string>('AI_MAX_TOKENS')) || 4_000;

    if (provider === 'openai') {
      const apiKey = this.configService.get<string>('OPENAI_API_KEY');
      if (!apiKey) this.logger.warn('OPENAI_API_KEY 不存在');
      return new ChatOpenAI({
        apiKey: apiKey || 'dummy-key',
        model: this.configService.get<string>('OPENAI_MODEL') || 'gpt-4.1-mini',
        temperature,
        maxTokens,
        maxRetries,
        timeout,
      });
    }

    if (provider !== 'deepseek') {
      throw new Error(`不支持的 AI_PROVIDER: ${provider}`);
    }
    const apiKey = this.configService.get<string>('DEEPSEEK_API_KEY');
    if (!apiKey) this.logger.warn('DEEPSEEK_API_KEY 不存在');
    return new ChatDeepSeek({
      apiKey: apiKey || 'dummy-key',
      model:
        this.configService.get<string>('DEEPSEEK_MODEL') || 'deepseek-chat',
      temperature,
      maxTokens,
      maxRetries,
      timeout,
    });
  }
}
