import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes, Types } from 'mongoose';
import { PaymentChannel } from '../payment.types';

export type PaymentRecordDocument = PaymentRecord & Document;
export enum PaymentRecordStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SUCCESS = 'success',
  FAILED = 'failed',
  CLOSED = 'closed',
}

@Schema({ timestamps: true })
export class PaymentRecord {
  @Prop({ required: true, unique: true }) orderId!: string;
  @Prop({ required: true, type: String, enum: PaymentChannel })
  channel!: PaymentChannel;
  @Prop({ required: true, type: Number }) amount!: number;
  @Prop({ default: 'CNY' }) currency!: string;
  @Prop() planId?: string;
  @Prop() planName?: string;
  @Prop() source?: string;
  @Prop() description?: string;
  @Prop({ type: SchemaTypes.Mixed }) metadata?: Record<string, unknown>;
  @Prop({ type: SchemaTypes.Mixed })
  notificationPayload?: Record<string, unknown>;
  @Prop({
    type: String,
    enum: PaymentRecordStatus,
    default: PaymentRecordStatus.PENDING,
    index: true,
  })
  status!: PaymentRecordStatus;
  @Prop() paidAt?: Date;
  @Prop() processingAt?: Date;
  @Prop() failureReason?: string;
  @Prop() transactionId?: string;
  @Prop() userIdentifier?: string;
  @Prop() createdAt?: Date;
  @Prop({
    type: SchemaTypes.ObjectId,
    ref: 'User',
    index: true,
  })
  user?: Types.ObjectId;
  @Prop({ index: true }) userId?: string;
}
export const PaymentRecordSchema = SchemaFactory.createForClass(PaymentRecord);
PaymentRecordSchema.index({ userId: 1, createdAt: -1 });
