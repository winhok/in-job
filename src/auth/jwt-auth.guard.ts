import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from './public.decorator';
import { UnauthorizedException } from '@nestjs/common';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }

  handleRequest(err, user, info: any) {
    if (err || !user) {
      const errorMessage = info?.message || 'Invalid Token';
      const errorName = info?.name || 'UnknownError';

      let friendlyMessage = errorMessage;
      if (errorName === 'JsonWebTokenError') {
        if (errorMessage.includes('invalid signature')) {
          friendlyMessage =
            'Token signature is invalid, possibly due to inconsistent JWT_SECRET configuration or token tampering';
        } else if (errorMessage.includes('jwt malformed')) {
          friendlyMessage =
            'Token format is incorrect, please check the Authorization header format';
        } else if (errorMessage.includes('jwt expired')) {
          friendlyMessage = 'Token has expired, please log in again';
        }
      }

      throw new UnauthorizedException(friendlyMessage);
    }
    return user;
  }
}
