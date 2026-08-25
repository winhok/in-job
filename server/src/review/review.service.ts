import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { randomUUID } from 'node:crypto';
import { Model, Types } from 'mongoose';
import {
  AIInterviewResult,
  AIInterviewResultDocument,
} from '../interview/schemas/ai-interview-result.schema';
import {
  ResumeQuizResult,
  ResumeQuizResultDocument,
} from '../interview/schemas/interview-quiz-result.schema';
import {
  ReportFeedbackDto,
  RequestManualReviewDto,
  ResolveManualReviewDto,
} from './dto/review.dto';
import {
  ManualReview,
  ManualReviewDocument,
} from './schemas/manual-review.schema';

@Injectable()
export class ReviewService {
  constructor(
    @InjectModel(ResumeQuizResult.name)
    private readonly resumeModel: Model<ResumeQuizResultDocument>,
    @InjectModel(AIInterviewResult.name)
    private readonly interviewModel: Model<AIInterviewResultDocument>,
    @InjectModel(ManualReview.name)
    private readonly reviewModel: Model<ManualReviewDocument>,
  ) {}

  async submitFeedback(
    userId: string,
    resultId: string,
    dto: ReportFeedbackDto,
  ) {
    const update = {
      rating: dto.rating,
      feedback: dto.comment?.trim(),
      feedbackFair: dto.fair,
      ratedAt: new Date(),
    };
    const resume = await this.resumeModel.findOneAndUpdate(
      { userId, resultId },
      { $set: update },
      { new: true },
    );
    if (resume) return { resultId, resultType: 'resume_quiz', ...update };
    const interview = await this.interviewModel.findOneAndUpdate(
      { userId, resultId },
      { $set: update },
      { new: true },
    );
    if (!interview) throw new NotFoundException('评估报告不存在');
    return { resultId, resultType: 'mock_interview', ...update };
  }

  async requestManualReview(
    userId: string,
    resultId: string,
    dto: RequestManualReviewDto,
  ) {
    const resume = await this.resumeModel.exists({ userId, resultId });
    const interview = resume
      ? null
      : await this.interviewModel.exists({ userId, resultId });
    if (!resume && !interview) throw new NotFoundException('评估报告不存在');
    const review = await this.reviewModel.findOneAndUpdate(
      { userId, resultId },
      {
        $setOnInsert: {
          requestId: randomUUID(),
          resultId,
          resultType: resume ? 'resume_quiz' : 'mock_interview',
          user: new Types.ObjectId(userId),
          userId,
        },
        $set: {
          reason: dto.reason,
          comment: dto.comment?.trim(),
          status: 'pending',
        },
        $unset: { resolution: 1, reviewedBy: 1, reviewedAt: 1 },
      },
      { upsert: true, new: true },
    );
    if (!review) throw new NotFoundException('人工复核请求创建失败');
    return {
      requestId: review.requestId,
      resultId: review.resultId,
      resultType: review.resultType,
      reason: review.reason,
      status: review.status,
    };
  }

  async list(status = 'pending', page = 1, limit = 20) {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(Math.max(1, limit), 100);
    const filter = status === 'all' ? {} : { status };
    const [records, total] = await Promise.all([
      this.reviewModel
        .find(filter)
        .sort({ createdAt: 1 })
        .skip((safePage - 1) * safeLimit)
        .limit(safeLimit)
        .lean(),
      this.reviewModel.countDocuments(filter),
    ]);
    return { records, total, page: safePage, limit: safeLimit };
  }

  async resolve(
    requestId: string,
    reviewerId: string,
    dto: ResolveManualReviewDto,
  ) {
    const review = await this.reviewModel.findOneAndUpdate(
      { requestId },
      {
        $set: {
          status: dto.status,
          resolution: dto.resolution?.trim(),
          reviewedBy: reviewerId,
          reviewedAt: new Date(),
        },
      },
      { new: true },
    );
    if (!review) throw new NotFoundException('人工复核请求不存在');
    return review;
  }
}
