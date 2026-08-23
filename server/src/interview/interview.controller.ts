import {
  Controller,
  Post,
  Body,
  Request,
  UseGuards,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { InterviewService } from './services/interview.service';
import { ResumeQuizDto } from './dto/resume-quiz.dto';
import { Request as ExpressRequest } from 'express';

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
}
