import { BadRequestException, NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { ResumeService } from './resume.service';

describe('ResumeService', () => {
  const userId = '507f1f77bcf86cd799439011';
  const dto = {
    url: 'https://example-bucket.oss-cn-beijing.aliyuncs.com/resume.pdf',
    resumeName: '前端简历.pdf',
    objectKey: `user-resumes/${userId}/resumes/resume.pdf`,
    uploadTime: new Date('2026-08-24T00:00:00.000Z'),
    mimeType: 'application/pdf',
    fileSize: 1024,
  };

  function createService() {
    const resumeModel = {
      create: vi.fn().mockImplementation((value) => Promise.resolve(value)),
      findOneAndDelete: vi.fn(),
      findOneAndUpdate: vi.fn(),
      findOne: vi.fn(),
    };
    const userModel = {
      findOneAndUpdate: vi.fn().mockResolvedValue({ resumeCount: 1 }),
      findByIdAndUpdate: vi.fn(),
    };
    const storage = {
      canonicalUrl: vi.fn().mockReturnValue(dto.url),
      signReadUrl: vi.fn().mockReturnValue('https://signed.example/resume'),
      deleteObject: vi.fn().mockResolvedValue(undefined),
    };
    return {
      service: new ResumeService(
        resumeModel as never,
        userModel as never,
        storage as never,
      ),
      resumeModel,
      userModel,
      storage,
    };
  }

  it('只接受当前用户前缀并原子占用简历名额', async () => {
    const { service, resumeModel, userModel } = createService();
    const result = await service.create(userId, dto);

    expect(result).toMatchObject({
      userId,
      objectKey: dto.objectKey,
      resumeName: dto.resumeName,
    });
    expect(userModel.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: userId, resumeCount: { $lt: 5 } },
      { $inc: { resumeCount: 1 } },
      { new: true },
    );
    expect(resumeModel.create).toHaveBeenCalledTimes(1);
  });

  it('拒绝登记其他用户的 OSS 对象', async () => {
    const { service, userModel } = createService();
    await expect(
      service.create(userId, {
        ...dto,
        objectKey: 'user-resumes/507f1f77bcf86cd799439012/resumes/resume.pdf',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(userModel.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it('删除时同时绑定用户和简历 ID', async () => {
    const { service, resumeModel, userModel } = createService();
    resumeModel.findOne.mockResolvedValue({
      resumeId: 'resume-id',
      objectKey: dto.objectKey,
    });
    resumeModel.findOneAndDelete.mockResolvedValue({ resumeId: 'resume-id' });

    await expect(
      service.remove(userId, { resumeId: 'resume-id' }),
    ).resolves.toEqual({ resumeId: 'resume-id' });
    expect(resumeModel.findOneAndDelete).toHaveBeenCalledWith({
      userId,
      resumeId: 'resume-id',
    });
    expect(userModel.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: userId, resumeCount: { $gt: 0 } },
      { $inc: { resumeCount: -1 } },
    );
  });

  it('不存在或不属于当前用户的简历不能删除', async () => {
    const { service, resumeModel } = createService();
    resumeModel.findOne.mockResolvedValue(null);
    await expect(
      service.remove(userId, { resumeId: 'private-resume' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('读取简历内容时绑定当前用户所有权', async () => {
    const { service, resumeModel } = createService();
    const lean = vi.fn().mockResolvedValue({
      resumeId: 'resume-id',
      resumeUrl: dto.url,
      objectKey: dto.objectKey,
    });
    const select = vi.fn().mockReturnValue({ lean });
    resumeModel.findOne.mockReturnValue({ select });

    await expect(
      service.getOwnedResume(userId, 'resume-id'),
    ).resolves.toMatchObject({ resumeId: 'resume-id' });
    expect(resumeModel.findOne).toHaveBeenCalledWith({
      userId,
      resumeId: 'resume-id',
    });
  });
});
