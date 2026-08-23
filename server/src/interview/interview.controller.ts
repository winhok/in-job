import {
  Controller,
  Post,
  Body,
  Request,
  UseGuards,
  Res,
  Param,
  Get,
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

interface AuthenticatedRequest extends ExpressRequest {
  user: {
    userId: string;
  };
}

@Controller('interview')
export class InterviewController {
  constructor(private readonly interviewService: InterviewService) {}

  @Post('/analyze-resume')
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
  @UseGuards(JwtAuthGuard)
  async continueConversation(
    @Body() body: { sessionId: string; question: string },
  ) {
    const result = await this.interviewService.continueConversation(
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
  @UseGuards(JwtAuthGuard)
  resumeQuizStream(
    @Body() dto: ResumeQuizDto,
    @Request() req: AuthenticatedRequest,
    @Res() res: Response,
  ) {
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
  @UseGuards(JwtAuthGuard)
  startMockInterview(
    @Body() dto: StartMockInterviewDto,
    @Request() req: AuthenticatedRequest,
    @Res() res: Response,
  ) {
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
}
