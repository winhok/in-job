import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(private readonly configService: ConfigService) {
    // Get the JWT secret (used for signature verification).
    const jwtSecret =
      configService.get<string>('JWT_SECRET') || 'wwzhidao-secret';

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      // NOTE: this secret must match JwtModule's secret in app.module.ts.
      secretOrKey: jwtSecret,
    });

    // Log whether the default value is in use (never log the secret itself).
    if (!configService.get<string>('JWT_SECRET')) {
      this.logger.warn(
        '⚠️ JWT_SECRET is not set, using the default value. Set the JWT_SECRET environment variable in production.',
      );
    } else {
      this.logger.log('✅ JWT_SECRET loaded from environment variables.');
    }
  }

  validate(payload: { userId: string; username: string; email?: string }) {
    return {
      userId: payload.userId,
      username: payload.username,
      email: payload.email,
    };
  }
}
