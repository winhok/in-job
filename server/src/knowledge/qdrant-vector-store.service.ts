import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { QdrantClient } from '@qdrant/js-client-rest';
import { createHash } from 'node:crypto';

export interface VectorKnowledgeDocument {
  ownerId: string;
  sourceType: string;
  sourceId: string;
  chunkIndex: number;
  content: string;
  locale: string;
  contentVersion: string;
}

@Injectable()
export class QdrantVectorStore {
  private readonly client: QdrantClient;
  private readonly collectionName: string;
  private collectionReady?: Promise<void>;

  constructor(private readonly configService: ConfigService) {
    this.collectionName =
      configService.get<string>('QDRANT_COLLECTION') || 'interview_knowledge';
    this.client = new QdrantClient({
      url: configService.get<string>('QDRANT_URL') || 'http://127.0.0.1:6333',
      apiKey: configService.get<string>('QDRANT_API_KEY') || undefined,
      timeout: Number(configService.get<string>('QDRANT_TIMEOUT_MS')) || 10_000,
      checkCompatibility: false,
    });
  }

  isConfigured(): boolean {
    return Boolean(this.configService.get<string>('QDRANT_URL'));
  }

  async replaceSource(
    ownerId: string,
    sourceType: string,
    sourceId: string,
    documents: Array<
      Omit<
        VectorKnowledgeDocument,
        'ownerId' | 'sourceType' | 'sourceId' | 'contentVersion'
      >
    >,
    vectors: number[][],
  ): Promise<void> {
    if (documents.length !== vectors.length) {
      throw new Error('向量数量与知识分片数量不一致');
    }
    if (vectors.length === 0) return;
    await this.ensureCollection(vectors[0].length);
    await this.client.delete(this.collectionName, {
      wait: true,
      filter: this.sourceFilter(ownerId, sourceType, sourceId),
    });
    await this.client.upsert(this.collectionName, {
      wait: true,
      points: documents.map((document, index) => ({
        id: this.pointId(ownerId, sourceType, sourceId, document.chunkIndex),
        vector: vectors[index],
        payload: {
          ownerId,
          sourceType,
          sourceId,
          ...document,
          contentVersion: createHash('sha256')
            .update(document.content)
            .digest('hex'),
        },
      })),
    });
  }

  async search(
    ownerId: string,
    vector: number[],
    limit: number,
  ): Promise<VectorKnowledgeDocument[]> {
    await this.ensureCollection(vector.length);
    const response = await this.client.query(this.collectionName, {
      query: vector,
      filter: {
        must: [{ key: 'ownerId', match: { value: ownerId } }],
      },
      limit,
      with_payload: true,
      with_vector: false,
    });
    return response.points.flatMap((point) => {
      const payload = point.payload;
      if (
        !payload ||
        typeof payload.ownerId !== 'string' ||
        typeof payload.sourceType !== 'string' ||
        typeof payload.sourceId !== 'string' ||
        typeof payload.chunkIndex !== 'number' ||
        typeof payload.content !== 'string'
      ) {
        return [];
      }
      return [
        {
          ownerId: payload.ownerId,
          sourceType: payload.sourceType,
          sourceId: payload.sourceId,
          chunkIndex: payload.chunkIndex,
          content: payload.content,
          locale: typeof payload.locale === 'string' ? payload.locale : 'und',
          contentVersion:
            typeof payload.contentVersion === 'string'
              ? payload.contentVersion
              : '',
        },
      ];
    });
  }

  private async ensureCollection(dimensions: number): Promise<void> {
    this.collectionReady ??= this.createOrValidateCollection(dimensions).catch(
      (error) => {
        this.collectionReady = undefined;
        throw error;
      },
    );
    await this.collectionReady;
  }

  private async createOrValidateCollection(dimensions: number): Promise<void> {
    const collections = await this.client.getCollections();
    if (
      !collections.collections.some(({ name }) => name === this.collectionName)
    ) {
      await this.client.createCollection(this.collectionName, {
        vectors: { size: dimensions, distance: 'Cosine' },
      });
      return;
    }
    const collection = await this.client.getCollection(this.collectionName);
    const vectors = collection.config.params.vectors;
    if (
      !vectors ||
      Array.isArray(vectors) ||
      !('size' in vectors) ||
      vectors.size !== dimensions ||
      vectors.distance !== 'Cosine'
    ) {
      throw new Error(
        `Qdrant collection ${this.collectionName} 的维度或距离配置不匹配`,
      );
    }
  }

  private sourceFilter(ownerId: string, sourceType: string, sourceId: string) {
    return {
      must: [
        { key: 'ownerId', match: { value: ownerId } },
        { key: 'sourceType', match: { value: sourceType } },
        { key: 'sourceId', match: { value: sourceId } },
      ],
    };
  }

  private pointId(
    ownerId: string,
    sourceType: string,
    sourceId: string,
    chunkIndex: number,
  ): string {
    const hash = createHash('sha256')
      .update(`${ownerId}\0${sourceType}\0${sourceId}\0${chunkIndex}`)
      .digest('hex')
      .slice(0, 32);
    return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-a${hash.slice(17, 20)}-${hash.slice(20)}`;
  }
}
