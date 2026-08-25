import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { WechatModule } from './wechat/wechat.module';
import { PaymentModule } from './payment/payment.module';
import { StsModule } from './sts/sts.module';
import { InterviewModule } from './interview/interview.module';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { JwtStrategy } from './auth/jwt.strategy';
import { getTokenExpirationSeconds } from './common/utils/jwt.util';
import { AdminModule } from './admin/admin.module';
import { ResumeModule } from './resume/resume.module';
import { ObservabilityModule } from './common/observability/observability.module';
import { MetricsInterceptor } from './common/interceptors/metrics.interceptor';
import { TraceIdMiddleware } from './common/middleware/trace-id.middleware';
import { validateEnvironment } from './config/env.validation';
import { ReviewModule } from './review/review.module';
import { AiCacheModule } from './ai-cache/ai-cache.module';
import { RateLimitGuard } from './common/rate-limit/rate-limit.guard';
import { PrecomputeModule } from './precompute/precompute.module';
import { AlertsModule } from './alerts/alerts.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: [`.env.${process.env.NODE_ENV || 'development'}`, '.env'],
      isGlobal: true,
      validate: validateEnvironment,
    }),
    MongooseModule.forRoot(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/wwzhidao',
    ),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const expirationSeconds = getTokenExpirationSeconds();
        return {
          secret: configService.get<string>('JWT_SECRET') || 'wwzhidao-secret',
          signOptions: {
            expiresIn: expirationSeconds,
          },
        };
      },
      inject: [ConfigService],
      global: true,
    }),
    UserModule,
    WechatModule,
    PaymentModule,
    StsModule,
    InterviewModule,
    AdminModule,
    ResumeModule,
    ObservabilityModule,
    ReviewModule,
    AiCacheModule,
    PrecomputeModule,
    AlertsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    JwtStrategy,
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: MetricsInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_GUARD,
      useClass: RateLimitGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(TraceIdMiddleware).forRoutes('*');
  }
}
