import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes } from 'mongoose';

export type PrecomputedQuestionSetDocument = PrecomputedQuestionSet & Document;

@Schema({ timestamps: true })
export class PrecomputedQuestionSet {
  @Prop({ required: true, unique: true }) setId!: string;
  @Prop({ required: true, index: true }) positionKey!: string;
  @Prop({ required: true, type: String, enum: ['zh-CN', 'en-US'], index: true })
  locale!: 'zh-CN' | 'en-US';
  @Prop({ required: true }) version!: number;
  @Prop({ required: true, type: [SchemaTypes.Mixed] })
  questions!: Array<Record<string, unknown>>;
  @Prop() summary?: string;
  @Prop({ required: true }) model!: string;
  @Prop({ required: true }) promptVersion!: string;
  @Prop({ required: true, default: Date.now, index: true })
  generatedAt!: Date;
}

export const PrecomputedQuestionSetSchema = SchemaFactory.createForClass(
  PrecomputedQuestionSet,
);
PrecomputedQuestionSetSchema.index({ positionKey: 1, locale: 1, version: -1 });
