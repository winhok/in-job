import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type KnowledgeChunkDocument = KnowledgeChunk & Document;

@Schema({ timestamps: true })
export class KnowledgeChunk {
  @Prop({ required: true, index: true }) ownerId!: string;
  @Prop({ required: true, enum: ['resume', 'interview', 'manual'] })
  sourceType!: string;
  @Prop({ required: true, index: true }) sourceId!: string;
  @Prop({ required: true }) chunkIndex!: number;
  @Prop({ required: true, type: String }) content!: string;
  @Prop({ type: [String], default: [] }) keywords!: string[];
}

export const KnowledgeChunkSchema =
  SchemaFactory.createForClass(KnowledgeChunk);
KnowledgeChunkSchema.index({ content: 'text', keywords: 'text' });
KnowledgeChunkSchema.index(
  { ownerId: 1, sourceType: 1, sourceId: 1, chunkIndex: 1 },
  { unique: true },
);
