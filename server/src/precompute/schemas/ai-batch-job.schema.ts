import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes } from 'mongoose';

export type AiBatchJobDocument = AiBatchJob & Document;

export type AiBatchStatus =
  'queued' | 'running' | 'completed' | 'partial' | 'failed' | 'cancelled';

@Schema({ timestamps: true })
export class AiBatchJob {
  @Prop({ required: true, unique: true }) jobId!: string;
  @Prop({
    required: true,
    type: String,
    enum: ['popular_position_precompute'],
    index: true,
  })
  operation!: 'popular_position_precompute';
  @Prop({ required: true }) requestedBy!: string;
  @Prop({
    required: true,
    type: String,
    enum: ['queued', 'running', 'completed', 'partial', 'failed', 'cancelled'],
    default: 'queued',
    index: true,
  })
  status!: AiBatchStatus;
  @Prop({ required: true, type: [SchemaTypes.Mixed] })
  items!: Array<{ positionKey: string; locale: 'zh-CN' | 'en-US' }>;
  @Prop({ type: [SchemaTypes.Mixed], default: [] })
  results!: Array<Record<string, unknown>>;
  @Prop({ required: true }) totalItems!: number;
  @Prop({ default: 0 }) completedItems!: number;
  @Prop({ default: 0 }) failedItems!: number;
  @Prop() leaseOwner?: string;
  @Prop({ index: true }) leaseExpiresAt?: Date;
  @Prop({ default: false }) cancelRequested!: boolean;
  @Prop({ type: SchemaTypes.Mixed }) metadata?: Record<string, unknown>;
  @Prop() startedAt?: Date;
  @Prop() finishedAt?: Date;
}

export const AiBatchJobSchema = SchemaFactory.createForClass(AiBatchJob);
AiBatchJobSchema.index({ status: 1, leaseExpiresAt: 1, createdAt: 1 });
