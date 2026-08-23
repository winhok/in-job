import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes, Types } from 'mongoose';

export type AIInterviewResultDocument = AIInterviewResult & Document;

export enum AIInterviewType {
  SPECIAL = 'special',
  BEHAVIOR = 'behavior',
}

@Schema({ _id: false })
export class STARAnalysis {
  @Prop() situation?: number;
  @Prop() task?: number;
  @Prop() action?: number;
  @Prop() result?: number;
  @Prop() overallScore?: number;
  @Prop() feedback?: string;
}
export const STARAnalysisSchema = SchemaFactory.createForClass(STARAnalysis);

@Schema({ _id: false })
export class InterviewQA {
  @Prop({ required: true }) question!: string;
  @Prop({ required: true }) answer!: string;
  @Prop() standardAnswer?: string;
  @Prop() answerDuration?: number;
  @Prop() audioUrl?: string;
  @Prop() videoUrl?: string;
  @Prop({ type: Number, min: 0, max: 100 }) score?: number;
  @Prop({ type: STARAnalysisSchema }) starAnalysis?: STARAnalysis;
  @Prop() aiComment?: string;
  @Prop({ type: [String], default: [] }) highlights?: string[];
  @Prop({ type: [String], default: [] }) improvements?: string[];
  @Prop() askedAt?: Date;
  @Prop() answeredAt?: Date;
  @Prop() savedAt?: Date;
}
export const InterviewQASchema = SchemaFactory.createForClass(InterviewQA);

@Schema({ _id: false })
export class InterviewRadarDimension {
  @Prop({ required: true }) dimension!: string;
  @Prop({ required: true, type: Number, min: 0, max: 100 }) score!: number;
  @Prop() description?: string;
}
export const InterviewRadarDimensionSchema = SchemaFactory.createForClass(
  InterviewRadarDimension,
);

@Schema({ _id: false })
export class ImprovementSuggestion {
  @Prop({ required: true }) category!: string;
  @Prop({ required: true }) suggestion!: string;
  @Prop({ enum: ['high', 'medium', 'low'], default: 'medium' })
  priority?: 'high' | 'medium' | 'low';
}
export const ImprovementSuggestionSchema = SchemaFactory.createForClass(
  ImprovementSuggestion,
);

@Schema({ timestamps: true })
export class AIInterviewResult {
  @Prop({ required: true, unique: true }) resultId!: string;
  @Prop({
    type: SchemaTypes.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  user!: Types.ObjectId;
  @Prop({ required: true, index: true }) userId!: string;
  @Prop({ required: true, enum: AIInterviewType, index: true })
  interviewType!: AIInterviewType;

  @Prop() company?: string;
  @Prop() position?: string;
  @Prop() salaryRange?: string;
  @Prop({ type: String }) jobDescription?: string;
  @Prop() interviewDuration?: number;
  @Prop() interviewMode?: string;

  @Prop({ type: [InterviewQASchema], default: [] }) qaList!: InterviewQA[];
  @Prop({ default: 0 }) totalQuestions!: number;
  @Prop({ default: 0 }) answeredQuestions!: number;

  @Prop({ type: Number, min: 0, max: 100 }) overallScore?: number;
  @Prop() overallLevel?: string;
  @Prop() overallComment?: string;
  @Prop({ type: [InterviewRadarDimensionSchema], default: [] })
  radarData!: InterviewRadarDimension[];
  @Prop({ type: [ImprovementSuggestionSchema], default: [] })
  improvements!: ImprovementSuggestion[];
  @Prop({ type: [String], default: [] }) strengths?: string[];
  @Prop({ type: [String], default: [] }) weaknesses?: string[];
  @Prop() avgResponseTime?: number;
  @Prop() maxResponseTime?: number;
  @Prop() minResponseTime?: number;
  @Prop({ type: Number }) fluencyScore?: number;
  @Prop({ type: Number }) logicScore?: number;
  @Prop({ type: Number }) professionalScore?: number;

  @Prop({ default: 0 }) viewCount!: number;
  @Prop() lastViewedAt?: Date;
  @Prop({ type: Number, min: 1, max: 5 }) rating?: number;
  @Prop() feedback?: string;
  @Prop() ratedAt?: Date;

  @Prop({
    enum: ['in_progress', 'paused', 'completed', 'abandoned'],
    default: 'in_progress',
    index: true,
  })
  status!: 'in_progress' | 'paused' | 'completed' | 'abandoned';
  @Prop() pausedAt?: Date;
  @Prop() resumedAt?: Date;
  @Prop() completedAt?: Date;
  @Prop({ type: SchemaTypes.Mixed }) sessionState?: unknown;
  @Prop({
    enum: ['pending', 'generating', 'completed', 'failed'],
    default: 'pending',
  })
  reportStatus!: 'pending' | 'generating' | 'completed' | 'failed';
  @Prop() reportGeneratedAt?: Date;
  @Prop() reportError?: string;
  @Prop({ default: false }) isArchived!: boolean;
  @Prop() archivedAt?: Date;
  @Prop({ default: false }) isShared!: boolean;
  @Prop() sharedAt?: Date;
  @Prop() shareUrl?: string;
  @Prop({ index: true }) consumptionRecordId?: string;
  @Prop({ type: SchemaTypes.Mixed }) metadata?: Record<string, unknown>;
  @Prop() aiModel?: string;
  @Prop() promptVersion?: string;
}

export const AIInterviewResultSchema =
  SchemaFactory.createForClass(AIInterviewResult);
AIInterviewResultSchema.index({ userId: 1, interviewType: 1, createdAt: -1 });
AIInterviewResultSchema.index({ userId: 1, overallScore: -1 });
AIInterviewResultSchema.index({ userId: 1, status: 1, updatedAt: -1 });
