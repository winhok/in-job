import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { WechatService } from './wechat.service';

interface AuthenticatedRequest extends Request {
  user?: { userId?: string };
}

@Injectable()
export class WechatAdminGuard implements CanActivate {
  constructor(private readonly wechatService: WechatService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const userId = request.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('缺少登录用户信息');
    }

    await this.wechatService.assertAdmin(userId);
    return true;
  }
}
