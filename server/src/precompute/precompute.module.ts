import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BoundedBatchRunner } from '../batch/bounded-batch.runner';
import { InterviewModule } from '../interview/interview.module';
import { AdminGuard } from '../review/admin.guard';
import { User, UserSchema } from '../user/schemas/user.schema';
import {
  PrecomputeAdminController,
  PrecomputedQuestionController,
} from './precompute.controller';
import { PrecomputeService } from './precompute.service';
import { AiBatchJob, AiBatchJobSchema } from './schemas/ai-batch-job.schema';
import {
  PopularPosition,
  PopularPositionSchema,
} from './schemas/popular-position.schema';
import {
  PrecomputedQuestionSet,
  PrecomputedQuestionSetSchema,
} from './schemas/precomputed-question-set.schema';

@Module({
  imports: [
    InterviewModule,
    MongooseModule.forFeature([
      { name: PopularPosition.name, schema: PopularPositionSchema },
      {
        name: PrecomputedQuestionSet.name,
        schema: PrecomputedQuestionSetSchema,
      },
      { name: AiBatchJob.name, schema: AiBatchJobSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [PrecomputedQuestionController, PrecomputeAdminController],
  providers: [PrecomputeService, BoundedBatchRunner, AdminGuard],
  exports: [PrecomputeService],
})
export class PrecomputeModule {}
