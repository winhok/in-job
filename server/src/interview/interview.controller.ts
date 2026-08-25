import {
  Controller,
  Post,
  Body,
  Request,
  UseGuards,
  Res,
  Param,
  Get,
  Query,
  Headers,
} from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { InterviewService } from './services/interview.service';
import { ResumeQuizDto } from './dto/resume-quiz.dto';
import { Request as ExpressRequest } from 'express';
import {
  AnswerMockInterviewDto,
  StartMockInterviewDto,
} from './dto/mock-interview.dto';
import { ResponseUtil } from '../common/utils/response.util';
import { AIInterviewType } from './schemas/ai-interview-result.schema';
import { EntitlementService } from '../payment/entitlement.service';
import { ExchangePackageDto } from '../payment/dto/payment.dto';
import { RateLimit } from '../common/rate-limit/rate-limit.decorator';

interface AuthenticatedRequest extends ExpressRequest {
  user: {
    userId: string;
  };
}

@Controller('interview')
export class InterviewController {
  constructor(
    private readonly interviewService: InterviewService,
    private readonly entitlementService: EntitlementService,
  ) {}

  @Post('/analyze-resume')
  @RateLimit(10, 60_000)
  @UseGuards(JwtAuthGuard)
  async analyzeResume(
    @Body()
    body: {
      position: string;
      resume: string;
      jobDescription: string;
    },
    @Request() req: AuthenticatedRequest,
  ) {
    const result = await this.interviewService.analyzeResume(
      req.user.userId,
      body.position,
      body.resume,
      body.jobDescription,
    );

    return {
      code: 200,
      data: result,
    };
  }

  @Post('/continue-conversation')
  @RateLimit(30, 60_000)
  @UseGuards(JwtAuthGuard)
  async continueConversation(
    @Body() body: { sessionId: string; question: string },
    @Request() req: AuthenticatedRequest,
  ) {
    const result = await this.interviewService.continueConversation(
      req.user.userId,
      body.sessionId,
      body.question,
    );

    return {
      code: 200,
      data: {
        response: result,
      },
    };
  }

  @Post('resume/quiz/stream')
  @RateLimit(5, 60_000)
  @UseGuards(JwtAuthGuard)
  resumeQuizStream(
    @Body() dto: ResumeQuizDto,
    @Headers('accept-language') acceptLanguage: string | undefined,
    @Request() req: AuthenticatedRequest,
    @Res() res: Response,
  ) {
    dto.locale = this.resolveLocale(dto.locale, acceptLanguage);
    const userId = req.user.userId;
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();
    const subscription = this.interviewService
      .generateResumeQuizWithProgress(userId, dto)
      .subscribe({
        next: (event) => {
          res.write(`data: ${JSON.stringify(event)}\n\n`);
        },
        error: (error: unknown) => {
          const message =
            error instanceof Error ? error.message : '生成失败，请重试';
          res.write(
            `data: ${JSON.stringify({
              type: 'error',
              error: message,
            })}\n\n`,
          );
          res.end();
        },
        complete: () => {
          res.end();
        },
      });

    req.once('close', () => {
      subscription.unsubscribe();
    });
  }

  @Post('mock/start')
  @RateLimit(10, 60_000)
  @UseGuards(JwtAuthGuard)
  startMockInterview(
    @Body() dto: StartMockInterviewDto,
    @Headers('accept-language') acceptLanguage: string | undefined,
    @Request() req: AuthenticatedRequest,
    @Res() res: Response,
  ) {
    dto.locale = this.resolveLocale(dto.locale, acceptLanguage);
    this.prepareSseResponse(res);
    const subscription = this.interviewService
      .startMockInterviewWithStream(req.user.userId, dto)
      .subscribe({
        next: (event) => this.writeSseEvent(res, event),
        error: (error: unknown) => {
          this.writeSseEvent(res, {
            type: 'error',
            error: error instanceof Error ? error.message : '启动面试失败',
          });
          res.end();
        },
        complete: () => res.end(),
      });
    res.once('close', () => subscription.unsubscribe());
  }

  @Post('mock/answer')
  @RateLimit(60, 60_000)
  @UseGuards(JwtAuthGuard)
  answerMockInterview(
    @Body() dto: AnswerMockInterviewDto,
    @Request() req: AuthenticatedRequest,
    @Res() res: Response,
  ) {
    this.prepareSseResponse(res);
    const subscription = this.interviewService
      .answerMockInterviewWithStream(req.user.userId, dto.sessionId, dto.answer)
      .subscribe({
        next: (event) => this.writeSseEvent(res, event),
        error: (error: unknown) => {
          this.writeSseEvent(res, {
            type: 'error',
            error: error instanceof Error ? error.message : '提交回答失败',
          });
          res.end();
        },
        complete: () => res.end(),
      });
    res.once('close', () => subscription.unsubscribe());
  }

  @Post('mock/pause/:resultId')
  @UseGuards(JwtAuthGuard)
  async pauseMockInterview(
    @Param('resultId') resultId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    const result = await this.interviewService.pauseMockInterview(
      req.user.userId,
      resultId,
    );
    return ResponseUtil.success(result, '面试已暂停，进度已保存');
  }

  @Post('mock/resume/:resultId')
  @UseGuards(JwtAuthGuard)
  async resumeMockInterview(
    @Param('resultId') resultId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    const result = await this.interviewService.resumeMockInterview(
      req.user.userId,
      resultId,
    );
    return ResponseUtil.success(result, '面试已恢复，可以继续回答');
  }

  @Post('mock/end/:resultId')
  @UseGuards(JwtAuthGuard)
  async endMockInterview(
    @Param('resultId') resultId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    await this.interviewService.endMockInterview(req.user.userId, resultId);
    return ResponseUtil.success({ resultId }, '面试已结束，正在生成分析报告');
  }

  @Get('resume/quiz/history')
  @UseGuards(JwtAuthGuard)
  async getResumeQuizHistory(
    @Request() req: AuthenticatedRequest,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return ResponseUtil.success(
      await this.interviewService.getResumeQuizHistory(
        req.user.userId,
        page,
        limit,
      ),
      '查询成功',
    );
  }

  @Get('special/history')
  @UseGuards(JwtAuthGuard)
  async getSpecialInterviewHistory(
    @Request() req: AuthenticatedRequest,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return ResponseUtil.success(
      await this.interviewService.getMockInterviewHistory(
        req.user.userId,
        AIInterviewType.SPECIAL,
        page,
        limit,
      ),
      '查询成功',
    );
  }

  @Get('behavior/history')
  @UseGuards(JwtAuthGuard)
  async getBehaviorInterviewHistory(
    @Request() req: AuthenticatedRequest,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return ResponseUtil.success(
      await this.interviewService.getMockInterviewHistory(
        req.user.userId,
        AIInterviewType.BEHAVIOR,
        page,
        limit,
      ),
      '查询成功',
    );
  }

  @Get('resume/quiz/result/:resultId')
  @UseGuards(JwtAuthGuard)
  async getResumeQuizResult(
    @Param('resultId') resultId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return ResponseUtil.success(
      await this.interviewService.getResumeQuizResult(
        req.user.userId,
        resultId,
      ),
      '查询成功',
    );
  }

  @Get('mock/unfinished')
  @UseGuards(JwtAuthGuard)
  async getUnfinishedMockInterviews(@Request() req: AuthenticatedRequest) {
    return ResponseUtil.success(
      await this.interviewService.getUnfinishedMockInterviews(req.user.userId),
      '查询成功',
    );
  }

  @Get('mock/result/:resultId/qa')
  @UseGuards(JwtAuthGuard)
  async getMockInterviewQAResult(
    @Param('resultId') resultId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return ResponseUtil.success(
      await this.interviewService.getMockInterviewQAResult(
        req.user.userId,
        resultId,
      ),
      '查询成功',
    );
  }

  @Get('mock/history/:resultId')
  @UseGuards(JwtAuthGuard)
  async getMockInterviewSessionHistory(
    @Param('resultId') resultId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return ResponseUtil.success(
      await this.interviewService.getMockInterviewSessionHistory(
        req.user.userId,
        resultId,
      ),
      '查询成功',
    );
  }

  @Post('exchange-package')
  @RateLimit(10, 60_000)
  @UseGuards(JwtAuthGuard)
  async exchangePackage(
    @Body() dto: ExchangePackageDto,
    @Request() req: AuthenticatedRequest,
  ) {
    const result = await this.entitlementService.exchangePackage(
      req.user.userId,
      dto.packageType,
    );
    return ResponseUtil.success(result, result.message);
  }

  /** 根据结果 ID 获取简历押题或模拟面试分析报告。 */
  @Get('analysis/report/:resultId')
  @UseGuards(JwtAuthGuard)
  async getAnalysisReport(
    @Param('resultId') resultId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    const report = await this.interviewService.getAnalysisReport(
      req.user.userId,
      resultId,
    );
    return ResponseUtil.success(report, '查询成功');
  }

  @Post('analysis/report/:resultId/regenerate')
  @RateLimit(3, 60_000)
  @UseGuards(JwtAuthGuard)
  async regenerateReport(
    @Param('resultId') resultId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    await this.interviewService.regenerateAssessmentReport(
      req.user.userId,
      resultId,
    );
    return ResponseUtil.success({}, '正在重新生成报告');
  }

  private prepareSseResponse(res: Response): void {
    res.status(200);
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();
    res.write(': connected\n\n');
  }

  private writeSseEvent(res: Response, event: unknown): void {
    if (res.writableEnded) return;
    res.write(`data: ${JSON.stringify(event)}\n\n`);
    const flush = (res as Response & { flush?: () => void }).flush;
    if (typeof flush === 'function') flush.call(res);
  }

  private resolveLocale(
    explicit: 'zh-CN' | 'en-US' | undefined,
    acceptLanguage: string | undefined,
  ): 'zh-CN' | 'en-US' {
    if (explicit) return explicit;
    return acceptLanguage?.toLowerCase().startsWith('en') ? 'en-US' : 'zh-CN';
  }
}
