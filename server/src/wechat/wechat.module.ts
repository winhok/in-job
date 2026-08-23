import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../user/schemas/user.schema';
import { WechatAdminGuard } from './wechat-admin.guard';
import { WechatController } from './wechat.controller';
import { WechatService } from './wechat.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  controllers: [WechatController],
  providers: [WechatService, WechatAdminGuard],
})
export class WechatModule {}
