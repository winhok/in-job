import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { WinstonModule, WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { createWinstonLogger } from './common/logger/winston.config';

async function bootstrap() {
  const nodeEnv = process.env.NODE_ENV || 'development';

  // Create the Winston logger
  const winstonLogger = createWinstonLogger(nodeEnv);

  // Create the NestJS app using the Winston logger
  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger({
      instance: winstonLogger,
    }),
  });

  // Make all NestJS components use the Winston logger
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strip properties not declared in the DTO
      transform: true, // auto type conversion
    }),
  );

  // Enable CORS
  app.enableCors();

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Application started successfully, listening on port ${port}`);
}

bootstrap();
