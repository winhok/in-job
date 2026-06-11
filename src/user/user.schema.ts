import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export type UserDocument = User &
  Document & {
    comparePassword(candidatePassword: string): Promise<boolean>;
  };

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  username!: string;

  @Prop()
  password?: string;

  @Prop()
  avatar?: string;

  @Prop({ default: ['user'] })
  roles!: string[];

  @Prop({ default: false })
  isActive!: boolean;

  @Prop({ required: false })
  wechatId?: string;

  @Prop({ unique: true, sparse: true })
  openid?: string;

  @Prop({ unique: true, sparse: true })
  unionid?: string;

  @Prop()
  wechatNickname?: string;

  @Prop()
  wechatAvatar?: string;

  @Prop({ default: false })
  isWechatBound!: boolean;

  @Prop()
  wechatBoundTime?: Date;

  @Prop({ required: false })
  phone?: string;

  @Prop({ required: false })
  email?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);

// 保存前加密密码
UserSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  if (this.password) {
    this.password = await bcrypt.hash(this.password, salt);
  }
});

// 添加比较密码的方法
UserSchema.methods.comparePassword = async function (
  this: UserDocument,
  candidatePassword: string,
): Promise<boolean> {
  if (!this.password) {
    return false;
  }
  return bcrypt.compare(candidatePassword, this.password);
};
