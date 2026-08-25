import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import { createWinstonOptions } from './common/logger/winston.config';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
    logger: WinstonModule.createLogger(createWinstonOptions()),
  });
  const configService = app.get(ConfigService);
  const swaggerEnabled =
    configService.get<string>('SWAGGER_ENABLED') === 'true';
  app.use(
    helmet({
      contentSecurityPolicy: swaggerEnabled ? false : undefined,
    }),
  );

  // 全局验证管道
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // 自动移除 DTO 中没有声明的字段
      transform: true, // 自动类型转换
    }),
  );

  const corsOrigins = (configService.get<string>('CORS_ORIGINS') || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  app.enableCors({
    origin:
      corsOrigins.length > 0
        ? corsOrigins
        : configService.get<string>('NODE_ENV') !== 'production',
    credentials: true,
  });

  if (swaggerEnabled) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('in-job API')
      .setDescription('AI 面试、简历、支付与用户服务 API')
      .setVersion('0.4.0')
      .addBearerAuth()
      .build();
    SwaggerModule.setup(
      configService.get<string>('SWAGGER_PATH') || 'api-docs',
      app,
      SwaggerModule.createDocument(app, swaggerConfig),
    );
  }

  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
