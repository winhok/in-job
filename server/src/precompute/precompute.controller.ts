import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import type { CurrentUserData } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Public } from '../auth/public.decorator';
import { AdminGuard } from '../review/admin.guard';
import {
  CreatePrecomputeBatchDto,
  UpsertPopularPositionDto,
} from './dto/precompute.dto';
import { PrecomputeService } from './precompute.service';

@Controller('interview/precomputed')
export class PrecomputedQuestionController {
  constructor(private readonly precomputeService: PrecomputeService) {}

  @Public()
  @Get(':positionKey')
  getLatestQuestionSet(
    @Param('positionKey') positionKey: string,
    @Query('locale') locale: 'zh-CN' | 'en-US' = 'zh-CN',
  ) {
    return this.precomputeService.getLatestQuestionSet(positionKey, locale);
  }
}

@Controller('admin/ai-precompute')
@UseGuards(JwtAuthGuard, AdminGuard)
export class PrecomputeAdminController {
  constructor(private readonly precomputeService: PrecomputeService) {}

  @Put('positions')
  upsertPosition(@Body() dto: UpsertPopularPositionDto) {
    return this.precomputeService.upsertPosition(dto);
  }

  @Get('positions')
  listPositions() {
    return this.precomputeService.listPositions();
  }

  @Post('jobs')
  createBatch(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: CreatePrecomputeBatchDto,
  ) {
    return this.precomputeService.createBatch(user.userId, dto);
  }

  @Get('jobs')
  listJobs(@Query('limit', new ParseIntPipe({ optional: true })) limit = 20) {
    return this.precomputeService.listJobs(limit);
  }

  @Get('jobs/:jobId')
  getJob(@Param('jobId') jobId: string) {
    return this.precomputeService.getJob(jobId);
  }

  @Post('jobs/:jobId/cancel')
  cancelJob(@Param('jobId') jobId: string) {
    return this.precomputeService.cancelJob(jobId);
  }

  @Post('run')
  async runWorkerOnce() {
    await this.precomputeService.tick();
    return { accepted: true };
  }
}
