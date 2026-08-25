import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  AIInterviewResult,
  AIInterviewResultSchema,
} from '../interview/schemas/ai-interview-result.schema';
import {
  ResumeQuizResult,
  ResumeQuizResultSchema,
} from '../interview/schemas/interview-quiz-result.schema';
import { User, UserSchema } from '../user/schemas/user.schema';
import { AdminGuard } from './admin.guard';
import { ReviewAdminController, ReviewController } from './review.controller';
import { ReviewService } from './review.service';
import {
  ManualReview,
  ManualReviewSchema,
} from './schemas/manual-review.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ResumeQuizResult.name, schema: ResumeQuizResultSchema },
      { name: AIInterviewResult.name, schema: AIInterviewResultSchema },
      { name: ManualReview.name, schema: ManualReviewSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [ReviewController, ReviewAdminController],
  providers: [ReviewService, AdminGuard],
})
export class ReviewModule {}
