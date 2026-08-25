import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InterviewKnowledgeService } from './interview-knowledge.service';
import {
  KnowledgeChunk,
  KnowledgeChunkSchema,
} from './schemas/knowledge-chunk.schema';
import { EmbeddingService } from './embedding.service';
import { QdrantVectorStore } from './qdrant-vector-store.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: KnowledgeChunk.name, schema: KnowledgeChunkSchema },
    ]),
  ],
  providers: [InterviewKnowledgeService, EmbeddingService, QdrantVectorStore],
  exports: [InterviewKnowledgeService],
})
export class KnowledgeModule {}
