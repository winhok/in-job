import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes, Types } from 'mongoose';

export type ResumeDocument = Resume & Document;

@Schema({ timestamps: true })
export class Resume {
  @Prop({ required: true, unique: true })
  resumeId!: string;

  @Prop({
    type: SchemaTypes.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  user!: Types.ObjectId;

  @Prop({ required: true, index: true })
  userId!: string;

  @Prop({ required: true })
  resumeName!: string;

  @Prop({ required: true })
  resumeUrl!: string;

  @Prop({ required: true })
  objectKey!: string;

  @Prop()
  mimeType?: string;

  @Prop()
  fileSize?: number;

  @Prop({ required: true })
  uploadTime!: Date;

  @Prop({ default: false })
  isJianLiWang!: boolean;
}

export const ResumeSchema = SchemaFactory.createForClass(Resume);
ResumeSchema.index({ userId: 1, objectKey: 1 }, { unique: true });
ResumeSchema.index({ userId: 1, uploadTime: -1 });
