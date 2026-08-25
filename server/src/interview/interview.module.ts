import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AIModule } from '../ai/ai.module';
import { User, UserSchema } from '../user/schemas/user.schema';
import { InterviewController } from './interview.controller';
import {
  ConsumptionRecord,
  ConsumptionRecordSchema,
} from './schemas/consumption-record.schema';
import {
  ResumeQuizResult,
  ResumeQuizResultSchema,
} from './schemas/interview-quiz-result.schema';
import { InterviewService } from './services/interview.service';
import { ResumeAnalysisService } from './services/resume-analysis.service';
import { ConversationContinuationService } from './services/conversation-continuation.service';
import { DocumentParserService } from './services/document-parser.service';
import { InterviewAIService } from './services/interview-ai.service';
import {
  AIInterviewResult,
  AIInterviewResultSchema,
} from './schemas/ai-interview-result.schema';
import { PaymentModule } from '../payment/payment.module';
import { ResumeModule } from '../resume/resume.module';
import { KnowledgeModule } from '../knowledge/knowledge.module';
import { ReportRetryScheduler } from './services/report-retry.scheduler';

@Module({
  imports: [
    AIModule,
    PaymentModule,
    ResumeModule,
    KnowledgeModule,
    MongooseModule.forFeature([
      { name: ConsumptionRecord.name, schema: ConsumptionRecordSchema },
      { name: ResumeQuizResult.name, schema: ResumeQuizResultSchema },
      { name: AIInterviewResult.name, schema: AIInterviewResultSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  providers: [
    InterviewService,
    ResumeAnalysisService,
    ConversationContinuationService,
    DocumentParserService,
    InterviewAIService,
    ReportRetryScheduler,
  ],
  controllers: [InterviewController],
  exports: [InterviewAIService],
})
export class InterviewModule {}
