import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ReportStatus } from '../dto/analysis-report.dto';
import {
  AIInterviewResult,
  AIInterviewResultDocument,
} from '../schemas/ai-interview-result.schema';
import { InterviewService } from './interview.service';

@Injectable()
export class ReportRetryScheduler implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ReportRetryScheduler.name);
  private timer?: NodeJS.Timeout;
  private ticking = false;
  private destroyed = false;

  constructor(
    @InjectModel(AIInterviewResult.name)
    private readonly resultModel: Model<AIInterviewResultDocument>,
    private readonly interviewService: InterviewService,
    private readonly configService: ConfigService,
  ) {}

  onModuleInit(): void {
    const interval = Math.max(
      5_000,
      Number(this.configService.get<string>('REPORT_RETRY_POLL_MS')) || 30_000,
    );
    this.timer = setInterval(() => void this.tick(), interval);
    this.timer.unref();
    if (process.env.NODE_ENV !== 'test') {
      queueMicrotask(() => {
        if (!this.destroyed) void this.tick();
      });
    }
  }

  onModuleDestroy(): void {
    this.destroyed = true;
    if (this.timer) clearInterval(this.timer);
  }

  async tick(): Promise<void> {
    if (this.destroyed || this.ticking) return;
    this.ticking = true;
    try {
      const now = new Date();
      const maxAttempts = Math.max(
        1,
        Math.min(
          10,
          Number(this.configService.get<string>('REPORT_RETRY_MAX_ATTEMPTS')) ||
            5,
        ),
      );
      await this.resultModel.updateMany(
        {
          reportStatus: ReportStatus.GENERATING,
          status: 'completed',
          reportLeaseExpiresAt: { $lte: now },
          reportAttempts: { $lt: maxAttempts },
        },
        {
          $set: {
            reportStatus: ReportStatus.FAILED,
            reportError: '报告生成任务租约已过期，等待自动重试',
            reportLastFailureAt: now,
            nextReportRetryAt: now,
          },
          $unset: { reportLeaseExpiresAt: 1 },
        },
      );
      const batchSize = Math.max(
        1,
        Math.min(
          50,
          Number(this.configService.get<string>('REPORT_RETRY_BATCH_SIZE')) ||
            10,
        ),
      );
      const due = await this.resultModel
        .find({
          reportAttempts: { $lt: maxAttempts },
          status: 'completed',
          $or: [
            { reportStatus: ReportStatus.PENDING },
            {
              reportStatus: ReportStatus.FAILED,
              nextReportRetryAt: { $lte: now },
            },
          ],
        })
        .select('userId resultId')
        .sort({ nextReportRetryAt: 1, createdAt: 1 })
        .limit(batchSize)
        .lean();
      for (const result of due) {
        try {
          await this.interviewService.generateAssessmentReport(
            result.userId,
            result.resultId,
          );
        } catch (error) {
          this.logger.warn(
            `报告自动重试失败: resultId=${result.resultId}, error=${error instanceof Error ? error.message : 'unknown'}`,
          );
        }
      }
    } catch (error) {
      this.logger.error(
        `报告自动重试轮询失败: ${error instanceof Error ? error.message : 'unknown'}`,
      );
    } finally {
      this.ticking = false;
    }
  }
}
