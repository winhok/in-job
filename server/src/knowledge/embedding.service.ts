import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAIEmbeddings } from '@langchain/openai';

@Injectable()
export class EmbeddingService {
  private readonly client: OpenAIEmbeddings;
  readonly dimensions: number;

  constructor(private readonly configService: ConfigService) {
    this.dimensions = Math.max(
      256,
      Number(configService.get<string>('EMBEDDING_DIMENSIONS')) || 1536,
    );
    const baseURL = configService.get<string>('EMBEDDING_BASE_URL')?.trim();
    this.client = new OpenAIEmbeddings({
      apiKey:
        configService.get<string>('EMBEDDING_API_KEY') ||
        configService.get<string>('OPENAI_API_KEY'),
      model:
        configService.get<string>('EMBEDDING_MODEL') ||
        'text-embedding-3-small',
      dimensions: this.dimensions,
      batchSize: Math.max(
        1,
        Math.min(
          256,
          Number(configService.get<string>('EMBEDDING_BATCH_SIZE')) || 64,
        ),
      ),
      timeout:
        Number(configService.get<string>('EMBEDDING_TIMEOUT_MS')) || 30_000,
      configuration: baseURL ? { baseURL } : undefined,
    });
  }

  isConfigured(): boolean {
    return Boolean(
      this.configService.get<string>('EMBEDDING_API_KEY') ||
      this.configService.get<string>('OPENAI_API_KEY'),
    );
  }

  embedDocuments(documents: string[]): Promise<number[][]> {
    return this.client.embedDocuments(documents);
  }

  embedQuery(query: string): Promise<number[]> {
    return this.client.embedQuery(query);
  }
}
