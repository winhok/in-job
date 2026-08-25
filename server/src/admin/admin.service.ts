import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  AIInterviewResult,
  AIInterviewResultDocument,
} from '../interview/schemas/ai-interview-result.schema';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(AIInterviewResult.name)
    private readonly aiInterviewResultModel: Model<AIInterviewResultDocument>,
  ) {}

  async getActiveInterviewCount(): Promise<{ count: number }> {
    const count = await this.aiInterviewResultModel.countDocuments({
      status: 'in_progress',
    });
    return { count };
  }
}
