import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ResponseUtil } from '../common/utils/response.util';
import {
  ResumeIdDto,
  UpdateResumeNameDto,
  UploadResumeDto,
} from './dto/resume.dto';
import { ResumeService } from './resume.service';
import { RateLimit } from '../common/rate-limit/rate-limit.decorator';

interface AuthenticatedRequest extends ExpressRequest {
  user: { userId: string };
}

@Controller('resume')
@UseGuards(JwtAuthGuard)
export class ResumeController {
  constructor(private readonly resumeService: ResumeService) {}

  @Get('getInterviewResumeList')
  async list(@Request() request: AuthenticatedRequest) {
    return ResponseUtil.success(
      await this.resumeService.list(request.user.userId),
      '查询成功',
    );
  }

  @Post('uploadResume')
  @RateLimit(5, 60_000)
  async create(
    @Request() request: AuthenticatedRequest,
    @Body() dto: UploadResumeDto,
  ) {
    return ResponseUtil.success(
      await this.resumeService.create(request.user.userId, dto),
      '上传成功',
    );
  }

  @Post('deleteResume')
  @RateLimit(20, 60_000)
  async remove(
    @Request() request: AuthenticatedRequest,
    @Body() dto: ResumeIdDto,
  ) {
    return ResponseUtil.success(
      await this.resumeService.remove(request.user.userId, dto),
      '删除成功',
    );
  }

  @Post('updateResumeName')
  @RateLimit(20, 60_000)
  async rename(
    @Request() request: AuthenticatedRequest,
    @Body() dto: UpdateResumeNameDto,
  ) {
    return ResponseUtil.success(
      await this.resumeService.rename(request.user.userId, dto),
      '修改成功',
    );
  }
}
