import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes } from 'mongoose';

export type PopularPositionDocument = PopularPosition & Document;

@Schema({ timestamps: true })
export class PopularPosition {
  @Prop({ required: true, unique: true }) positionKey!: string;
  @Prop({ required: true, type: SchemaTypes.Mixed })
  names!: { 'zh-CN': string; 'en-US': string };
  @Prop({ required: true, type: SchemaTypes.Mixed })
  jobDescriptions!: { 'zh-CN': string; 'en-US': string };
  @Prop({ default: true, index: true }) enabled!: boolean;
  @Prop({ default: 0, index: true }) priority!: number;
  @Prop({ default: 24 }) refreshHours!: number;
  @Prop({ default: Date.now, index: true }) staleAt!: Date;
  @Prop() lastGeneratedAt?: Date;
}

export const PopularPositionSchema =
  SchemaFactory.createForClass(PopularPosition);
