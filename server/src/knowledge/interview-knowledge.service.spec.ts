import { describe, expect, it, vi } from 'vitest';
import { InterviewKnowledgeService } from './interview-knowledge.service';

describe('InterviewKnowledgeService', () => {
  const createService = (
    model: Record<string, unknown>,
    configGet: (key: string) => unknown = () => undefined,
    embedding: Record<string, unknown> = {
      isConfigured: vi.fn().mockReturnValue(false),
    },
    vectorStore: Record<string, unknown> = {
      isConfigured: vi.fn().mockReturnValue(false),
    },
  ) =>
    new InterviewKnowledgeService(
      model as never,
      { get: vi.fn(configGet) } as never,
      embedding as never,
      vectorStore as never,
      { incrementRag: vi.fn() } as never,
    );

  it('检索查询始终绑定当前用户', async () => {
    const lean = vi.fn().mockResolvedValue([
      {
        sourceType: 'resume',
        sourceId: 'resume-1',
        chunkIndex: 0,
        content: 'Vue 性能优化经验',
      },
    ]);
    const limit = vi.fn().mockReturnValue({ lean });
    const sort = vi.fn().mockReturnValue({ limit });
    const select = vi.fn().mockReturnValue({ sort });
    let capturedQuery: unknown;
    const model = {
      find: vi.fn((query: unknown) => {
        capturedQuery = query;
        return { select };
      }),
    };
    const service = createService(model);

    await expect(service.retrieve('user-1', 'Vue 性能优化')).resolves.toEqual([
      '[resume:resume-1#0] Vue 性能优化经验',
    ]);
    expect(capturedQuery).toEqual({
      ownerId: 'user-1',
      $text: { $search: 'vue 性能优化' },
    });
  });

  it('关闭 RAG 后不读写知识库', async () => {
    const model = { find: vi.fn(), deleteMany: vi.fn(), insertMany: vi.fn() };
    const service = createService(model, (key) =>
      key === 'RAG_ENABLED' ? 'false' : undefined,
    );
    await expect(service.retrieve('user-1', 'Vue')).resolves.toEqual([]);
    await service.indexResume(
      'user-1',
      'resume-1',
      '足够长的简历内容'.repeat(20),
    );
    expect(model.find).not.toHaveBeenCalled();
    expect(model.deleteMany).not.toHaveBeenCalled();
  });

  it('数据库故障时返回空上下文而不阻断面试', async () => {
    const lean = vi.fn().mockRejectedValue(new Error('database unavailable'));
    const model = {
      find: vi.fn().mockReturnValue({
        select: () => ({ sort: () => ({ limit: () => ({ lean }) }) }),
      }),
    };
    const service = createService(model);
    await expect(service.retrieve('user-1', '系统设计')).resolves.toEqual([]);
  });

  it('向量检索为主路径且过滤结果绑定当前用户', async () => {
    const vectorStore = {
      isConfigured: vi.fn().mockReturnValue(true),
      search: vi.fn().mockResolvedValue([
        {
          ownerId: 'user-1',
          sourceType: 'resume',
          sourceId: 'resume-1',
          chunkIndex: 2,
          content: '负责高并发系统设计',
          locale: 'zh-CN',
        },
      ]),
    };
    const embedding = {
      isConfigured: vi.fn().mockReturnValue(true),
      embedQuery: vi.fn().mockResolvedValue([0.1, 0.2]),
    };
    const model = { find: vi.fn() };
    const service = createService(
      model,
      () => undefined,
      embedding,
      vectorStore,
    );

    await expect(service.retrieve('user-1', '系统设计', 3)).resolves.toEqual([
      '[resume:resume-1#2] 负责高并发系统设计',
    ]);
    expect(vectorStore.search).toHaveBeenCalledWith('user-1', [0.1, 0.2], 3);
    expect(model.find).not.toHaveBeenCalled();
  });

  it('向量服务异常时自动降级到用户隔离的文本检索', async () => {
    const lean = vi.fn().mockResolvedValue([]);
    const model = {
      find: vi.fn().mockReturnValue({
        select: () => ({ sort: () => ({ limit: () => ({ lean }) }) }),
      }),
    };
    const service = createService(
      model,
      () => undefined,
      {
        isConfigured: vi.fn().mockReturnValue(true),
        embedQuery: vi
          .fn()
          .mockRejectedValue(new Error('embedding unavailable')),
      },
      { isConfigured: vi.fn().mockReturnValue(true), search: vi.fn() },
    );

    await expect(service.retrieve('user-9', '向量数据库')).resolves.toEqual([]);
    expect(model.find).toHaveBeenCalledWith({
      ownerId: 'user-9',
      $text: { $search: '向量数据库' },
    });
  });
});
