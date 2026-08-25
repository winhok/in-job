import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes, Types } from 'mongoose';

export type UserTransactionDocument = UserTransaction & Document;
export enum UserTransactionType {
  RECHARGE = 'recharge',
  EXPENSE = 'expense',
  REWARD = 'reward',
}

@Schema({ timestamps: true })
export class UserTransaction {
  @Prop({
    type: SchemaTypes.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  user!: Types.ObjectId;
  @Prop({ required: true, index: true }) userIdentifier!: string;
  @Prop({ required: true, type: String, enum: UserTransactionType })
  type!: UserTransactionType;
  @Prop({ required: true, type: Number }) amount!: number;
  @Prop({ required: true }) currency!: string;
  @Prop({ required: true }) description!: string;
  @Prop() source?: string;
  @Prop({ enum: ['pending', 'success', 'failed'], default: 'pending' })
  status!: string;
  @Prop() planId?: string;
  @Prop() planName?: string;
  @Prop({ index: true, unique: true, sparse: true }) relatedOrderId?: string;
  @Prop({ type: SchemaTypes.Mixed }) metadata?: Record<string, unknown>;
  @Prop({ type: SchemaTypes.Mixed }) payData?: Record<string, unknown>;
  @Prop() createdAt?: Date;
}
export const UserTransactionSchema =
  SchemaFactory.createForClass(UserTransaction);
UserTransactionSchema.index({ userIdentifier: 1, createdAt: -1 });
