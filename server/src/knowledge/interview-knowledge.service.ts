import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  KnowledgeChunk,
  KnowledgeChunkDocument,
} from './schemas/knowledge-chunk.schema';
import { EmbeddingService } from './embedding.service';
import { QdrantVectorStore } from './qdrant-vector-store.service';
import { MetricsService } from '../common/metrics/metrics.service';

@Injectable()
export class InterviewKnowledgeService {
  private readonly logger = new Logger(InterviewKnowledgeService.name);

  constructor(
    @InjectModel(KnowledgeChunk.name)
    private readonly chunkModel: Model<KnowledgeChunkDocument>,
    private readonly configService: ConfigService,
    private readonly embeddingService: EmbeddingService,
    private readonly vectorStore: QdrantVectorStore,
    private readonly metricsService: MetricsService,
  ) {}

  async indexResume(
    ownerId: string,
    resumeId: string,
    content: string,
  ): Promise<void> {
    if (!this.isEnabled()) return;
    const chunks = this.splitContent(content);
    try {
      await this.chunkModel.deleteMany({
        ownerId,
        sourceType: 'resume',
        sourceId: resumeId,
      });
      if (chunks.length > 0) {
        await this.chunkModel.insertMany(
          chunks.map((chunk, chunkIndex) => ({
            ownerId,
            sourceType: 'resume',
            sourceId: resumeId,
            chunkIndex,
            content: chunk,
            keywords: this.tokenize(chunk).slice(0, 30),
          })),
        );
        try {
          await this.indexVectors(ownerId, resumeId, chunks);
        } catch (error) {
          this.metricsService.incrementRag('index', 'error');
          this.logger.warn(
            `向量知识索引失败，Mongo 文本索引仍可用: ${error instanceof Error ? error.message : 'unknown'}`,
          );
        }
      }
    } catch (error) {
      this.logger.warn(
        `简历知识索引失败并降级: ${error instanceof Error ? error.message : 'unknown'}`,
      );
    }
  }

  async retrieve(ownerId: string, query: string, limit = 4): Promise<string[]> {
    if (!this.isEnabled()) return [];
    const safeLimit = Math.min(Math.max(limit, 1), 8);
    if (
      this.vectorStore.isConfigured() &&
      this.embeddingService.isConfigured()
    ) {
      try {
        const vector = await this.embeddingService.embedQuery(query);
        const documents = await this.vectorStore.search(
          ownerId,
          vector,
          safeLimit,
        );
        this.metricsService.incrementRag('vector', 'success');
        return documents.map(
          (document) =>
            `[${document.sourceType}:${document.sourceId}#${document.chunkIndex}] ${document.content}`,
        );
      } catch (error) {
        this.metricsService.incrementRag('vector', 'error');
        this.logger.warn(
          `向量知识检索失败，降级文本检索: ${error instanceof Error ? error.message : 'unknown'}`,
        );
      }
    }
    return this.retrieveText(ownerId, query, safeLimit);
  }

  private async retrieveText(
    ownerId: string,
    query: string,
    limit: number,
  ): Promise<string[]> {
    const terms = this.tokenize(query).slice(0, 12);
    if (terms.length === 0) return [];
    try {
      const documents = await this.chunkModel
        .find({
          ownerId,
          $text: { $search: terms.join(' ') },
        })
        .select('sourceType sourceId chunkIndex content')
        .sort({ score: { $meta: 'textScore' } })
        .limit(limit)
        .lean();
      this.metricsService.incrementRag('text', 'success');
      return documents.map(
        (document) =>
          `[${document.sourceType}:${document.sourceId}#${document.chunkIndex}] ${document.content}`,
      );
    } catch (error) {
      this.metricsService.incrementRag('text', 'error');
      this.logger.warn(
        `知识检索失败并降级: ${error instanceof Error ? error.message : 'unknown'}`,
      );
      return [];
    }
  }

  private async indexVectors(
    ownerId: string,
    resumeId: string,
    chunks: string[],
  ): Promise<void> {
    if (
      !this.vectorStore.isConfigured() ||
      !this.embeddingService.isConfigured()
    ) {
      return;
    }
    const vectors = await this.embeddingService.embedDocuments(chunks);
    await this.vectorStore.replaceSource(
      ownerId,
      'resume',
      resumeId,
      chunks.map((content, chunkIndex) => ({
        chunkIndex,
        content,
        locale: /[\u4e00-\u9fff]/.test(content) ? 'zh-CN' : 'en-US',
      })),
      vectors,
    );
    this.metricsService.incrementRag('index', 'success');
  }

  private isEnabled(): boolean {
    return this.configService.get<string>('RAG_ENABLED') !== 'false';
  }

  private splitContent(content: string): string[] {
    const normalized = content.replace(/\s+/g, ' ').trim();
    const chunks: string[] = [];
    for (let start = 0; start < normalized.length; start += 700) {
      const chunk = normalized.slice(start, start + 900).trim();
      if (chunk.length >= 40) chunks.push(chunk);
    }
    return chunks.slice(0, 40);
  }

  private tokenize(value: string): string[] {
    return [
      ...new Set(
        value.toLowerCase().match(/[a-z0-9+#.]{2,}|[\u4e00-\u9fff]{2,8}/g) ||
          [],
      ),
    ];
  }
}
