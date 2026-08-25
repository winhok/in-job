import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { randomUUID } from 'node:crypto';
import { Model } from 'mongoose';
import { BoundedBatchRunner } from '../batch/bounded-batch.runner';
import { InterviewAIService } from '../interview/services/interview-ai.service';
import {
  CreatePrecomputeBatchDto,
  UpsertPopularPositionDto,
} from './dto/precompute.dto';
import { AiBatchJob, AiBatchJobDocument } from './schemas/ai-batch-job.schema';
import {
  PopularPosition,
  PopularPositionDocument,
} from './schemas/popular-position.schema';
import {
  PrecomputedQuestionSet,
  PrecomputedQuestionSetDocument,
} from './schemas/precomputed-question-set.schema';

@Injectable()
export class PrecomputeService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrecomputeService.name);
  private readonly workerId = randomUUID();
  private timer?: NodeJS.Timeout;
  private ticking = false;
  private destroyed = false;

  constructor(
    @InjectModel(PopularPosition.name)
    private readonly positionModel: Model<PopularPositionDocument>,
    @InjectModel(PrecomputedQuestionSet.name)
    private readonly questionSetModel: Model<PrecomputedQuestionSetDocument>,
    @InjectModel(AiBatchJob.name)
    private readonly batchModel: Model<AiBatchJobDocument>,
    private readonly batchRunner: BoundedBatchRunner,
    private readonly aiService: InterviewAIService,
    private readonly configService: ConfigService,
  ) {}

  onModuleInit(): void {
    const interval = Math.max(
      5_000,
      Number(this.configService.get<string>('AI_BATCH_POLL_MS')) || 30_000,
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

  async upsertPosition(dto: UpsertPopularPositionDto) {
    return this.positionModel.findOneAndUpdate(
      { positionKey: dto.positionKey },
      {
        $set: {
          names: dto.names,
          jobDescriptions: dto.jobDescriptions,
          enabled: dto.enabled ?? true,
          priority: dto.priority ?? 0,
          refreshHours: dto.refreshHours ?? 24,
          staleAt: new Date(),
        },
      },
      { upsert: true, new: true },
    );
  }

  async listPositions() {
    return this.positionModel
      .find()
      .sort({ enabled: -1, priority: -1, positionKey: 1 })
      .lean();
  }

  async listJobs(limit = 20) {
    return this.batchModel
      .find()
      .sort({ createdAt: -1 })
      .limit(Math.max(1, Math.min(100, limit)))
      .lean();
  }

  async createBatch(requestedBy: string, dto: CreatePrecomputeBatchDto) {
    const filter = {
      enabled: true,
      ...(dto.positionKeys?.length
        ? { positionKey: { $in: dto.positionKeys } }
        : { staleAt: { $lte: new Date() } }),
    };
    const positions = await this.positionModel
      .find(filter)
      .sort({ priority: -1, staleAt: 1 })
      .limit(50)
      .lean();
    if (positions.length === 0) {
      throw new BadRequestException('没有符合条件的热门岗位');
    }
    const locales: Array<'zh-CN' | 'en-US'> = dto.locales?.length
      ? dto.locales
      : ['zh-CN', 'en-US'];
    const items = positions.flatMap((position) =>
      locales.map((locale) => ({ positionKey: position.positionKey, locale })),
    );
    return new this.batchModel({
      jobId: randomUUID(),
      operation: 'popular_position_precompute',
      requestedBy,
      status: 'queued',
      items,
      results: [],
      totalItems: items.length,
      metadata: { scheduled: requestedBy === 'scheduler' },
    }).save();
  }

  async getJob(jobId: string) {
    const job = await this.batchModel.findOne({ jobId }).lean();
    if (!job) throw new NotFoundException('批任务不存在');
    return job;
  }

  async cancelJob(jobId: string) {
    const job = await this.batchModel.findOneAndUpdate(
      { jobId, status: { $in: ['queued', 'running'] } },
      { $set: { cancelRequested: true } },
      { new: true },
    );
    if (!job) throw new NotFoundException('没有可取消的批任务');
    if (job.status === 'queued') {
      job.status = 'cancelled';
      job.finishedAt = new Date();
      await job.save();
    }
    return job;
  }

  async getLatestQuestionSet(positionKey: string, locale: 'zh-CN' | 'en-US') {
    const result = await this.questionSetModel
      .findOne({ positionKey, locale })
      .sort({ version: -1 })
      .lean();
    if (!result) throw new NotFoundException('该岗位尚无预计算题库');
    return result;
  }

  async tick(): Promise<void> {
    if (this.destroyed || this.ticking) return;
    this.ticking = true;
    try {
      await this.enqueueScheduledBatch();
      const job = await this.claimNextJob();
      if (job) await this.processJob(job);
    } catch (error) {
      this.logger.error(
        `AI 批任务轮询失败: ${error instanceof Error ? error.message : 'unknown'}`,
      );
    } finally {
      this.ticking = false;
    }
  }

  private async enqueueScheduledBatch(): Promise<void> {
    const active = await this.batchModel.exists({
      operation: 'popular_position_precompute',
      status: { $in: ['queued', 'running'] },
      'metadata.scheduled': true,
    });
    if (active) return;
    const stale = await this.positionModel.exists({
      enabled: true,
      staleAt: { $lte: new Date() },
    });
    if (!stale) return;
    await this.createBatch('scheduler', {});
  }

  private async claimNextJob(): Promise<AiBatchJobDocument | null> {
    const now = new Date();
    const leaseMs = Math.max(
      30_000,
      Number(this.configService.get<string>('AI_BATCH_LEASE_MS')) || 300_000,
    );
    return await this.batchModel.findOneAndUpdate(
      {
        cancelRequested: { $ne: true },
        $or: [
          { status: 'queued' },
          { status: 'running', leaseExpiresAt: { $lte: now } },
        ],
      },
      {
        $set: {
          status: 'running',
          leaseOwner: this.workerId,
          leaseExpiresAt: new Date(now.getTime() + leaseMs),
          startedAt: now,
        },
      },
      { sort: { createdAt: 1 }, new: true },
    );
  }

  private async processJob(job: AiBatchJobDocument): Promise<void> {
    const concurrency = Math.max(
      1,
      Math.min(
        10,
        Number(this.configService.get<string>('AI_BATCH_CONCURRENCY')) || 3,
      ),
    );
    const results = await this.batchRunner.run(
      job.items,
      async (item) => {
        const current = await this.batchModel.findOne({ jobId: job.jobId });
        if (current?.cancelRequested) throw new Error('batch cancelled');
        return this.generateQuestionSet(item.positionKey, item.locale);
      },
      concurrency,
    );
    const completed = results.filter((result) => result.status === 'fulfilled');
    const failed = results.length - completed.length;
    const positionKeys = [
      ...new Set(job.items.map((item) => item.positionKey)),
    ];
    for (const positionKey of positionKeys) {
      const itemIndexes = job.items.flatMap((item, index) =>
        item.positionKey === positionKey ? [index] : [],
      );
      if (itemIndexes.every((index) => results[index].status === 'fulfilled')) {
        const refreshHours = Math.max(
          ...itemIndexes.map((index) => {
            const value = results[index].value as
              { refreshHours?: number } | undefined;
            return value?.refreshHours || 24;
          }),
        );
        await this.positionModel.updateOne(
          { positionKey },
          {
            $set: {
              lastGeneratedAt: new Date(),
              staleAt: new Date(Date.now() + refreshHours * 60 * 60 * 1_000),
            },
          },
        );
      }
    }
    const current = await this.batchModel.findOne({ jobId: job.jobId });
    const cancelled = Boolean(current?.cancelRequested);
    await this.batchModel.findOneAndUpdate(
      { jobId: job.jobId, leaseOwner: this.workerId },
      {
        $set: {
          status: cancelled
            ? 'cancelled'
            : failed === 0
              ? 'completed'
              : completed.length > 0
                ? 'partial'
                : 'failed',
          results,
          completedItems: completed.length,
          failedItems: failed,
          finishedAt: new Date(),
        },
        $unset: { leaseOwner: 1, leaseExpiresAt: 1 },
      },
    );
  }

  private async generateQuestionSet(
    positionKey: string,
    locale: 'zh-CN' | 'en-US',
  ) {
    const position = await this.positionModel.findOne({ positionKey });
    if (!position) throw new NotFoundException('热门岗位不存在');
    const result = await this.aiService.generateResumeQuizQuestionsOnly({
      company: '',
      positionName: position.names[locale],
      jd: position.jobDescriptions[locale],
      resumeContent:
        locale === 'zh-CN'
          ? '通用候选人画像，不包含个人信息。'
          : 'Generic candidate profile without personal information.',
      cacheScope: `public:popular-position:${positionKey}`,
      locale,
      promptVersion: 'popular-position-v1',
    });
    const version = Date.now();
    const questionSet = await new this.questionSetModel({
      setId: `${positionKey}:${locale}:${version}`,
      positionKey,
      locale,
      version,
      questions: result.questions,
      summary: result.summary,
      model: this.configService.get<string>('AI_PROVIDER') || 'deepseek',
      promptVersion: 'popular-position-v1',
      generatedAt: new Date(),
    }).save();
    return {
      setId: questionSet.setId,
      positionKey,
      locale,
      version,
      refreshHours: position.refreshHours,
    };
  }
}
