import { NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { InterviewService } from './interview.service';

describe('InterviewService read contracts', () => {
  const userId = '507f1f77bcf86cd799439011';

  function createService(
    options: {
      resumeDocuments?: Array<Record<string, unknown>>;
      mockResult?: Record<string, unknown> | null;
    } = {},
  ) {
    const limit = vi.fn().mockResolvedValue(options.resumeDocuments || []);
    const skip = vi.fn().mockReturnValue({ limit });
    const sort = vi.fn().mockReturnValue({ skip });
    const resumeModel = {
      find: vi.fn().mockReturnValue({ sort }),
      countDocuments: vi
        .fn()
        .mockResolvedValue(options.resumeDocuments?.length || 0),
      findOne: vi.fn(),
    };
    const mockModel = {
      findOne: vi.fn().mockResolvedValue(options.mockResult ?? null),
    };
    const sessionManager = {
      getSession: vi.fn(),
      addMessage: vi.fn(),
      summarizeLongConversation: vi.fn(),
      getRecentMessages: vi.fn(),
    };
    return {
      service: new InterviewService(
        sessionManager as never,
        {} as never,
        {} as never,
        {} as never,
        {} as never,
        {} as never,
        resumeModel as never,
        mockModel as never,
        {} as never,
        {} as never,
        {} as never,
      ),
      resumeModel,
      mockModel,
      sessionManager,
      pagination: { sort, skip, limit },
    };
  }

  it('简历历史按用户分页且不返回简历正文', async () => {
    const { service, resumeModel, pagination } = createService({
      resumeDocuments: [
        {
          resultId: 'result-1',
          company: '示例公司',
          position: '前端工程师',
          questions: [],
          resumeSnapshot: '不应返回的简历正文',
          createdAt: new Date('2026-08-24T00:00:00Z'),
        },
      ],
    });
    const result = await service.getResumeQuizHistory(userId, '2', '5');

    expect(resumeModel.find).toHaveBeenCalledWith({
      userId,
      isArchived: { $ne: true },
    });
    expect(pagination.skip).toHaveBeenCalledWith(5);
    expect(pagination.limit).toHaveBeenCalledWith(5);
    expect(result.records[0]).not.toHaveProperty('resumeSnapshot');
  });

  it('模拟面试问答查询同时绑定用户和结果 ID', async () => {
    const mockResult = {
      resultId: 'result-2',
      interviewType: 'special',
      status: 'completed',
      qaList: [{ question: '自我介绍', answer: '三年前端经验' }],
      sessionState: { resumeContent: '不应返回' },
    };
    const { service, mockModel } = createService({ mockResult });
    const result = await service.getMockInterviewQAResult(userId, 'result-2');

    expect(mockModel.findOne).toHaveBeenCalledWith({
      userId,
      resultId: 'result-2',
      isArchived: { $ne: true },
    });
    expect(result).not.toHaveProperty('sessionState');
    expect(result.questions).toEqual([
      expect.objectContaining({ question: '自我介绍' }),
    ]);
  });

  it('继续对话拒绝其他用户或不存在的会话', async () => {
    const { service, sessionManager } = createService();
    sessionManager.getSession.mockReturnValue({ userId: 'other-user' });
    await expect(
      service.continueConversation(userId, 'private-session', '继续分析'),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(sessionManager.addMessage).not.toHaveBeenCalled();
  });
});
