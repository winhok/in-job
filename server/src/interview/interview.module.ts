import { Module } from '@nestjs/common';
import { AIModule } from '../ai/ai.module';
import { InterviewController } from './interview.controller';
import { InterviewService } from './services/interview.service';
import { ResumeAnalysisService } from './services/resume-analysis.service';
import { ConversationContinuationService } from './services/conversation-continuation.service';

@Module({
  imports: [AIModule],
  providers: [
    InterviewService,
    ResumeAnalysisService,
    ConversationContinuationService,
  ],
  controllers: [InterviewController],
})
export class InterviewModule {}
