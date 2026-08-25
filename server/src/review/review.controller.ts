import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { CurrentUserData } from '../auth/current-user.decorator';
import { ResponseUtil } from '../common/utils/response.util';
import {
  ReportFeedbackDto,
  RequestManualReviewDto,
  ResolveManualReviewDto,
} from './dto/review.dto';
import { AdminGuard } from './admin.guard';
import { ReviewService } from './review.service';
import { RateLimit } from '../common/rate-limit/rate-limit.decorator';

@Controller('interview/analysis/report')
@UseGuards(JwtAuthGuard)
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post(':resultId/feedback')
  @RateLimit(10, 60_000)
  async feedback(
    @Param('resultId') resultId: string,
    @CurrentUser() user: CurrentUserData,
    @Body() dto: ReportFeedbackDto,
  ) {
    return ResponseUtil.success(
      await this.reviewService.submitFeedback(user.userId, resultId, dto),
      '反馈已提交',
    );
  }

  @Post(':resultId/manual-review')
  @RateLimit(3, 60_000)
  async requestReview(
    @Param('resultId') resultId: string,
    @CurrentUser() user: CurrentUserData,
    @Body() dto: RequestManualReviewDto,
  ) {
    return ResponseUtil.success(
      await this.reviewService.requestManualReview(user.userId, resultId, dto),
      '人工复核请求已提交',
    );
  }
}

@Controller('admin/manual-reviews')
@UseGuards(JwtAuthGuard, AdminGuard)
export class ReviewAdminController {
  constructor(private readonly reviewService: ReviewService) {}

  @Get()
  async list(
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return ResponseUtil.success(
      await this.reviewService.list(status, page, limit),
      '查询成功',
    );
  }

  @Put(':requestId')
  async resolve(
    @Param('requestId') requestId: string,
    @CurrentUser() user: CurrentUserData,
    @Body() dto: ResolveManualReviewDto,
  ) {
    return ResponseUtil.success(
      await this.reviewService.resolve(requestId, user.userId, dto),
      '复核状态已更新',
    );
  }
}
