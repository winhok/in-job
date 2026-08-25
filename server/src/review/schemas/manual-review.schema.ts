import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes, Types } from 'mongoose';

export type ManualReviewDocument = ManualReview & Document;

@Schema({ timestamps: true })
export class ManualReview {
  @Prop({ required: true, unique: true }) requestId!: string;
  @Prop({ required: true, index: true }) resultId!: string;
  @Prop({ required: true, enum: ['resume_quiz', 'mock_interview'] })
  resultType!: string;
  @Prop({
    type: SchemaTypes.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  user!: Types.ObjectId;
  @Prop({ required: true, index: true }) userId!: string;
  @Prop({
    required: true,
    enum: ['unfair', 'inaccurate', 'technical', 'other'],
  })
  reason!: string;
  @Prop() comment?: string;
  @Prop({
    enum: ['pending', 'reviewing', 'resolved', 'rejected'],
    default: 'pending',
    index: true,
  })
  status!: string;
  @Prop() resolution?: string;
  @Prop() reviewedBy?: string;
  @Prop() reviewedAt?: Date;
}

export const ManualReviewSchema = SchemaFactory.createForClass(ManualReview);
ManualReviewSchema.index({ userId: 1, resultId: 1 }, { unique: true });
