import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
// TODO(next commit): 以下文件尚未创建,补齐后取消注释,并恢复下方 @Module 配置
// import { InterviewController } from './interview.controller';
// import { InterviewService } from './services/interview.service';
// import { InterviewAIService } from './services/interview-ai.service';
// import { DocumentParserService } from './services/document-parser.service';

@Module({
  imports: [ConfigModule],
  // TODO(next commit): controller / services 创建后恢复以下三项
  // controllers: [InterviewController],
  // providers: [InterviewService, InterviewAIService, DocumentParserService],
  // exports: [InterviewService, InterviewAIService, DocumentParserService],
})
export class InterviewModule {}
