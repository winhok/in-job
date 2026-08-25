import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { randomUUID } from 'node:crypto';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../user/schemas/user.schema';
import {
  ResumeIdDto,
  UpdateResumeNameDto,
  UploadResumeDto,
} from './dto/resume.dto';
import { Resume, ResumeDocument } from './schemas/resume.schema';
import { ResumeStorageService } from './resume-storage.service';

@Injectable()
export class ResumeService {
  constructor(
    @InjectModel(Resume.name)
    private readonly resumeModel: Model<ResumeDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly storage: ResumeStorageService,
  ) {}

  async list(userId: string) {
    const resumes = await this.resumeModel
      .find({ userId })
      .sort({ uploadTime: -1 })
      .select('-user -userId -__v')
      .lean();
    return resumes.map((resume) => {
      const { objectKey, ...safeResume } = resume;
      return {
        ...safeResume,
        resumeUrl: this.storage.signReadUrl(objectKey),
        createTime: resume.uploadTime,
      };
    });
  }

  async create(userId: string, dto: UploadResumeDto) {
    this.assertObjectOwnership(userId, dto.objectKey);
    const user = await this.userModel.findOneAndUpdate(
      { _id: userId, resumeCount: { $lt: 5 } },
      { $inc: { resumeCount: 1 } },
      { new: true },
    );
    if (!user) {
      throw new BadRequestException('最多只能保存 5 份简历');
    }

    try {
      return await this.resumeModel.create({
        resumeId: randomUUID(),
        user: new Types.ObjectId(userId),
        userId,
        resumeName: dto.resumeName.trim(),
        resumeUrl: this.storage.canonicalUrl(dto.objectKey),
        objectKey: dto.objectKey,
        uploadTime: dto.uploadTime,
        mimeType: dto.mimeType,
        fileSize: dto.fileSize,
      });
    } catch (error) {
      await this.userModel.findByIdAndUpdate(userId, {
        $inc: { resumeCount: -1 },
      });
      throw error;
    }
  }

  async remove(userId: string, dto: ResumeIdDto) {
    const existing = await this.resumeModel.findOne({
      userId,
      resumeId: dto.resumeId,
    });
    if (!existing) throw new NotFoundException('简历不存在');
    await this.storage.deleteObject(existing.objectKey);
    const removed = await this.resumeModel.findOneAndDelete({
      userId,
      resumeId: dto.resumeId,
    });
    if (!removed) throw new NotFoundException('简历不存在');
    await this.userModel.findOneAndUpdate(
      { _id: userId, resumeCount: { $gt: 0 } },
      { $inc: { resumeCount: -1 } },
    );
    return { resumeId: removed.resumeId };
  }

  async rename(userId: string, dto: UpdateResumeNameDto) {
    const updated = await this.resumeModel.findOneAndUpdate(
      { userId, resumeId: dto.resumeId },
      { $set: { resumeName: dto.resumeName.trim() } },
      { new: true },
    );
    if (!updated) throw new NotFoundException('简历不存在');
    return { resumeId: updated.resumeId, resumeName: updated.resumeName };
  }

  async getOwnedResume(userId: string, resumeId: string) {
    const resume = await this.resumeModel
      .findOne({ userId, resumeId })
      .select('resumeId resumeName resumeUrl mimeType objectKey')
      .lean();
    if (!resume) throw new NotFoundException('简历不存在');
    return {
      ...resume,
      resumeUrl: this.storage.signReadUrl(resume.objectKey),
      objectKey: undefined,
    };
  }

  private assertObjectOwnership(userId: string, objectKey: string): void {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('用户信息无效，请重新登录');
    }
    if (!objectKey.startsWith(`user-resumes/${userId}/resumes/`)) {
      throw new BadRequestException('文件路径不属于当前用户');
    }
  }
}
