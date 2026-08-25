import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes } from 'mongoose';

export type AiResultCacheDocument = AiResultCache & Document;

@Schema({ timestamps: true })
export class AiResultCache {
  @Prop({ required: true, unique: true }) cacheKey!: string;
  @Prop({ required: true, index: true }) operation!: string;
  @Prop({ required: true, index: true }) scopeKey!: string;
  @Prop({ required: true }) provider!: string;
  @Prop({ required: true }) model!: string;
  @Prop({ required: true, enum: ['zh-CN', 'en-US'] }) locale!: string;
  @Prop({ required: true }) promptVersion!: string;
  @Prop({ required: true, type: SchemaTypes.Mixed }) value!: unknown;
  @Prop({ required: true }) expiresAt!: Date;
  @Prop({ default: 0 }) hitCount!: number;
  @Prop() lastHitAt?: Date;
}

export const AiResultCacheSchema = SchemaFactory.createForClass(AiResultCache);
AiResultCacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
AiResultCacheSchema.index({ scopeKey: 1, operation: 1, createdAt: -1 });
